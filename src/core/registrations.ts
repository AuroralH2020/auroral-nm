import { v4 as uuidv4 } from 'uuid'
import { MyError } from '../utils/error-handler'
import { HttpStatusCode } from '../utils/http-status-codes'
import { logger } from '../utils/logger'
import { Config } from '../config'
// Import types
import { RolesEnum } from '../types/roles'
import { localsTypes } from '../types/index'
import {
    IRegistrationDocument,
    IRegistrationPost,
    IRegisType,
    RegistrationStatus,
    IRegistrationUser,
    RegistrationType
  } from '../persistance/registration/types'
import { InvitationStatus } from '../persistance/invitation/types'
import { NotificationStatus } from '../persistance/notification/types'
import { EventType, ResultStatusType, SourceType } from '../types/misc-types'
// Import services
import { NotificationModel } from '../persistance/notification/model'
import { InvitationModel } from '../persistance/invitation/model'
import { AccountModel } from '../persistance/account/model'
import { AuditModel } from '../persistance/audit/model'
import { UserModel } from '../persistance/user/model'
import { RegistrationModel } from '../persistance/registration/model'
import { OrganisationModel } from '../persistance/organisation/model'
import { cs } from '../microservices/commServer'
import { checkTempSecret, hashPassword, signMailToken, verifyToken } from '../auth-server/auth-server'
import { notifyDevOpsOfNewRegistration, rejectRegistration, verificationMail } from '../auth-server/mailer'

/**
 * Registration request
 * @param data 
 */
export const registerNewOrganisation = async (data: IRegistrationPost): Promise<void> => {
    const cid = uuidv4()
    // Initialize account
    const hash = await hashPassword(data.password)
    await AccountModel._createAccount({
      username: data.email,
      passwordHash: hash,
      cid,
      roles: [RolesEnum.USER, RolesEnum.ADMIN, RolesEnum.INFRAS_OPERATOR, RolesEnum.SYS_INTEGRATOR] // IF status open is organisation administrator
    })
    // Create registration obj
    const registration = await RegistrationModel._createRegistration({
      ...data,
      registrationId: uuidv4(),
      cid
    })
    // Notify devOps by mail and UI
    notifyDevOpsOfNewRegistration(data.name + ' ' + data.surname, data.companyName!)
    // Get users devOps and send notifications to them
    const devOpsIds = await UserModel._getUserByRole(RolesEnum.DEV_OPS)
    // Send notifications to all user with role Dev Ops
    devOpsIds.forEach(async (it) => {
      await NotificationModel._createNotification({
        owner: it.uid,
        actor: { id: registration.registrationId, name: registration.name },
        type: EventType.registrationRequest,
        status: NotificationStatus.WAITING
      })
    })
}

/**
 * Invited user or organisation
 * @param data 
 * @param realm 
 */
export const registerInvitedUserOrOrganisation = async (data: IRegistrationPost, realm?: string): Promise<void> => {
    if (!data.cid && data.type === RegistrationType.USER) {
        throw new MyError('New user needs to have a CID assigned', HttpStatusCode.BAD_REQUEST)
    }
      const cid = data.cid ? data.cid : uuidv4()
      // Initialize account
      const hash = await hashPassword(data.password)
      await AccountModel._createAccount({
        username: data.email,
        passwordHash: hash,
        cid,
        roles: data.type === RegistrationType.COMPANY ? [RolesEnum.USER, RolesEnum.ADMIN, RolesEnum.INFRAS_OPERATOR, RolesEnum.SYS_INTEGRATOR] : data.roles
      })
      // Create registration obj      
      const pendingDoc = await RegistrationModel._createRegistration({
        ...data,
        registrationId: uuidv4(),
        cid
      })
      // Generate account validation token
      const token = await signMailToken(pendingDoc.email, 'validate', pendingDoc.registrationId)
      // Notify user by mail
      verificationMail(data.email, token, data.type, realm)
}

export const registerAfterVerification = async (status: RegistrationStatus, token: string, locals: localsTypes.ILocals): Promise<void> => {
    const decoded = await verifyToken(token)
    const registrationId = decoded.iss
    // Retrieve the registration object
    const registrationObject = await RegistrationModel._getDoc(registrationId)
    // Validate if secret in token has not expired (email === username)
    await checkTempSecret(registrationObject.email, decoded.sub)
    // Check if registration is already validated
    if (registrationObject.status === RegistrationStatus.VERIFIED) {
      throw new Error('Registration was already verified')
    }
    if (decoded.aud !== 'validate') {
      throw new Error('Invalid token type')
    } else {
      // Update status to verified
      await registrationObject._updateStatus(status)
      // Create org and user
      if (registrationObject.type === RegistrationType.COMPANY) {
        const registrationObj = registrationObject as IRegisType<RegistrationType.COMPANY>
        // Organisation and user with role admin
        await OrganisationModel._createOrganisation({
          cid: registrationObj.cid,
          name: registrationObj.companyName,
          businessId: registrationObj.businessId,
          location: registrationObj.companyLocation
        })
        const uid = uuidv4() // Create unique id
        const newUser = await UserModel._createUser({
          uid,
          firstName: registrationObj.name,
          lastName: registrationObj.surname,
          email: registrationObj.email,
          occupation: registrationObj.occupation,
          cid: registrationObj.cid,
          roles: [RolesEnum.USER, RolesEnum.ADMIN, RolesEnum.INFRAS_OPERATOR, RolesEnum.SYS_INTEGRATOR]
        })
         // Audits
        await AuditModel._createAudit({
          ...locals.audit,
          cid: registrationObj.cid,
          actor: { id: uid, name: newUser.email },
          target: { id: registrationObj.cid, name: registrationObj.companyName },
          type: EventType.companyCreated,
          labels: { ...locals.audit.labels, status: ResultStatusType.SUCCESS }
        })
         await AuditModel._createAudit({
          ...locals.audit,
          cid: registrationObj.cid,
          actor: { id: uid, name: newUser.email },
          target: { id: registrationObj.cid, name: registrationObj.companyName },
          object: { id: uid, name: newUser.email },
          type: EventType.userCreated,
          labels: { ...locals.audit.labels, status: ResultStatusType.SUCCESS, source: SourceType.USER }
        })
        // Add organisation group to commServer
        await cs.postGroup(registrationObj.cid, registrationObj.companyName)
        // Add user to organisation
        await OrganisationModel._addUserToCompany(registrationObj.cid, uid)
        // Verify account
        await AccountModel._verifyAccount(registrationObj.email, uid)
        // Update invitation status to DONE
        await InvitationModel._setInvitationStatus(registrationObj.invitationId, InvitationStatus.DONE)
      } else if (registrationObject.type === RegistrationType.USER) {
        const registrationObj = registrationObject as IRegisType<RegistrationType.USER>
        // Only user with role user
        const uid = uuidv4() // Create unique id
        const newUser = await UserModel._createUser({
          uid,
          firstName: registrationObj.name,
          lastName: registrationObj.surname,
          email: registrationObj.email,
          occupation: registrationObj.occupation,
          cid: registrationObj.cid,
          roles: registrationObj.roles
        })
        // Add user to organisation
        await OrganisationModel._addUserToCompany(registrationObj.cid, uid)
        // Verify account
        await AccountModel._verifyAccount(registrationObj.email, uid)
        // Get users devOps and send notifications to them
        await devOpsNotifications(registrationObj)
        // Update invitation status to DONE
        await InvitationModel._setInvitationStatus(registrationObj.invitationId, InvitationStatus.DONE)
        // Get Organisation that sent invitation
        const invitation = await InvitationModel._getInvitation(registrationObj.invitationId)
        // Create audit
        await AuditModel._createAudit({
          ...locals.audit,
          cid: invitation.sentBy.cid,
          actor: { id: invitation.sentBy.uid, name: invitation.sentBy.email },
          target: { id: invitation.sentBy.cid, name: invitation.sentBy.organisation },
          object: { id: newUser.uid, name: newUser.name },
          type: EventType.userCreated,
          labels: { ...locals.audit.labels, status: ResultStatusType.SUCCESS, source: SourceType.USER }
        })
      } else {
        throw new Error('Wrong registration type')
      }
    }
}

export const sendVerificationMail = async (status: RegistrationStatus, registrationId: string, locals: localsTypes.ILocals): Promise<void> => {
    // Retrieve the registration object
    const registrationObj = await RegistrationModel._getDoc(registrationId)
    // Update status to pending (user approval)
    await registrationObj._updateStatus(status)
    // Generate account validation token
    const newToken = await signMailToken(registrationObj.email, 'validate', registrationId)
    logger.info('Registration pending to ' + registrationObj.companyName)
    // Notify user by mail
    verificationMail(registrationObj.email, newToken, registrationObj.type, locals.origin?.realm)
    // Get users devOps and send notifications to them
    await devOpsNotifications(registrationObj)
}

export const resendVerificationMail = async (_status: RegistrationStatus, registrationId: string, locals: localsTypes.ILocals): Promise<void> => {
    // Retrieve the registration object
    const registrationObj = await RegistrationModel._getDoc(registrationId)
    // Generate account validation token
    const newToken = await signMailToken(registrationObj.email, 'validate', registrationId)
    logger.info('Resending verification mail to organisation ' + registrationObj.companyName)
    // Notify user by mail
    verificationMail(registrationObj.email, newToken, registrationObj.type, locals.origin?.realm)
}

export const declineRegistration = async (status: RegistrationStatus, registrationId: string, _locals: localsTypes.ILocals): Promise<void> => {
    // Retrieve the registration object
    const registrationObj = await RegistrationModel._getDoc(registrationId)
    // Update status to declined (user approval)
    await registrationObj._updateStatus(status)
    // Remove unverified account
    await AccountModel._deleteAccount(registrationObj.email)
    logger.warn('Registration declined to ' + registrationObj.companyName)
    // Notify user by mail
    rejectRegistration(registrationObj.email, registrationObj.companyName)
    // Update registration notifications
    // Get users devOps and send notifications to them
    await devOpsNotifications(registrationObj)
}

export const registerAfterMasterVerification = async (status: RegistrationStatus, registrationId: string, locals: localsTypes.ILocals): Promise<void> => {
    // Retrieve the registration object
    const registrationObject = await RegistrationModel._getDoc(registrationId)
    // Check if registration is already validated
    if (registrationObject.status === RegistrationStatus.VERIFIED) {
      throw new Error('Registration was already verified')
    }
    // Update status to verified
    await registrationObject._updateStatus(status)
    // Create org and user
    if (registrationObject.type === RegistrationType.COMPANY) {
        const registrationObj = registrationObject as IRegisType<RegistrationType.COMPANY>
        // Organisation and user with role admin
        await OrganisationModel._createOrganisation({
            cid: registrationObj.cid,
            name: registrationObj.companyName,
            businessId: registrationObj.businessId,
            location: registrationObj.companyLocation
        })
        const uid = uuidv4() // Create unique id
        const newUser = await UserModel._createUser({
            uid,
            firstName: registrationObj.name,
            lastName: registrationObj.surname,
            email: registrationObj.email,
            occupation: registrationObj.occupation,
            cid: registrationObj.cid,
            roles: [RolesEnum.USER, RolesEnum.ADMIN, RolesEnum.INFRAS_OPERATOR, RolesEnum.SYS_INTEGRATOR]
        })
            // Audits
        await AuditModel._createAudit({
            ...locals.audit,
            cid: registrationObj.cid,
            actor: { id: uid, name: newUser.email },
            target: { id: registrationObj.cid, name: registrationObj.companyName },
            type: EventType.companyCreated,
            labels: { ...locals.audit.labels, status: ResultStatusType.SUCCESS }
        })
            await AuditModel._createAudit({
            ...locals.audit,
            cid: registrationObj.cid,
            actor: { id: uid, name: newUser.email },
            target: { id: registrationObj.cid, name: registrationObj.companyName },
            object: { id: uid, name: newUser.email },
            type: EventType.userCreated,
            labels: { ...locals.audit.labels, status: ResultStatusType.SUCCESS, source: SourceType.USER }
        })
        // Add organisation group to commServer
        await cs.postGroup(registrationObj.cid, registrationObj.name)
        // Add user to organisation
        await OrganisationModel._addUserToCompany(registrationObj.cid, uid)
        // Verify account
        await AccountModel._verifyAccount(registrationObj.email, uid)
        // Update invitation status to DONE
        await InvitationModel._setInvitationStatus(registrationObj.invitationId, InvitationStatus.DONE)
    } else if (registrationObject.type === RegistrationType.USER) {
        const registrationObj = registrationObject as IRegisType<RegistrationType.USER>
        // Only user with role user
        const uid = uuidv4() // Create unique id
        const newUser = await UserModel._createUser({
            uid,
            firstName: registrationObj.name,
            lastName: registrationObj.surname,
            email: registrationObj.email,
            occupation: registrationObj.occupation,
            cid: registrationObj.cid,
            roles: registrationObj.roles
        })
        // Add user to organisation
        await OrganisationModel._addUserToCompany(registrationObj.cid, uid)
        // Verify account
        await AccountModel._verifyAccount(registrationObj.email, uid)
        // Get users devOps and send notifications to them
        await devOpsNotifications(registrationObj)
        // Update invitation status to DONE
        await InvitationModel._setInvitationStatus(registrationObj.invitationId, InvitationStatus.DONE)
        // Get Organisation that sent invitation
        const invitation = await InvitationModel._getInvitation(registrationObj.invitationId)
        // Create audit
        await AuditModel._createAudit({
            ...locals.audit,
            cid: invitation.sentBy.cid,
            actor: { id: invitation.sentBy.uid, name: invitation.sentBy.email },
            target: { id: invitation.sentBy.cid, name: invitation.sentBy.organisation },
            object: { id: newUser.uid, name: newUser.name },
            type: EventType.userCreated,
            labels: { ...locals.audit.labels, status: ResultStatusType.SUCCESS, source: SourceType.USER }
        })
    } else {
        throw new Error('Wrong registration type')
    }
}

// Private functions

const devOpsNotifications = async (registrationObj: IRegistrationDocument | IRegistrationUser): Promise<void> => {
    const devOpsIds = await UserModel._getUserByRole(RolesEnum.DEV_OPS)
    devOpsIds.forEach(async (it) => {
        const notificationsToUpdate = await NotificationModel._findNotifications({
            owners: [it.uid],
            status: NotificationStatus.WAITING,
            type: EventType.registrationRequest,
            actor: { id: registrationObj.registrationId, name: registrationObj.name } // Notifications sent by my friend
        })
        // Update notification of registrationRequest --> decline it
        notificationsToUpdate.forEach(async (elem) => {
            await NotificationModel._setRead(elem)
            await NotificationModel._setStatus(elem, NotificationStatus.RESPONDED)
        })
    })
}
