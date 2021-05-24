// Controller common imports
import { v4 as uuidv4 } from 'uuid'
import { expressTypes, localsTypes } from '../../../types/index'
import { HttpStatusCode } from '../../../utils/http-status-codes'
import { logger } from '../../../utils/logger'
import { responseBuilder } from '../../../utils/response-builder'

// Controller specific imports
import { RegistrationModel } from '../../../persistance/registration/model'
import { IRegistration, IRegistrationPre, RegistrationStatus, RegistrationType } from '../../../persistance/registration/types'
import { checkTempSecret, hashPassword, signMailToken, verifyToken } from '../../../auth-server/auth-server'
import { notifyDevOpsOfNewRegistration, verificationMail, rejectRegistration } from '../../../auth-server/mailer'
import { AccountModel } from '../../../persistance/account/model'
import { RolesEnum } from '../../../types/roles' 

// Controllers

type getRegistrationController = expressTypes.Controller<{ registrationId: string }, {}, {}, IRegistration, localsTypes.ILocals>
 
export const getRegistration: getRegistrationController = async (req, res) => {
  const { registrationId } = req.params
	try {
    const data = await RegistrationModel._getRegistration(registrationId)
    return responseBuilder(HttpStatusCode.OK, res, null, data)
	} catch (err) {
		logger.error(err.message)
		return responseBuilder(HttpStatusCode.INTERNAL_SERVER_ERROR, res, err)
	}
}

type getRegistrationsController = expressTypes.Controller<{}, {}, {}, IRegistration[], localsTypes.ILocals>
 
export const getAllRegistrations: getRegistrationsController = async (req, res) => {
	try {
    const data = await RegistrationModel._getRegistrations()
    return responseBuilder(HttpStatusCode.OK, res, null, data)
	} catch (err) {
		logger.error(err.message)
		return responseBuilder(HttpStatusCode.INTERNAL_SERVER_ERROR, res, err)
	}
}

type postRegistrationController = expressTypes.Controller<{}, { data: IRegistrationPre } , {}, null, localsTypes.ILocals>
 
export const postRegistration: postRegistrationController = async (req, res) => {
  const { data } = req.body
  const locals = res.locals
	try {
    if (!data.status) {
      throw new Error('Missing status of the registration')
    } else if (data.status === RegistrationStatus.OPEN) {
      // If status OPEN it is a new organisation and needs new CID
      const cid = uuidv4()
      // Initialize account
      const hash = await hashPassword(data.password)
      await AccountModel._createAccount({
        username: data.email,
        passwordHash: hash,
        cid,
        roles: data.type === RegistrationType.COMPANY ? [RolesEnum.USER, RolesEnum.ADMIN] : [RolesEnum.USER]
      })
      // Create registration obj
      await RegistrationModel._createRegistration({
        ...data,
        registrationId: uuidv4(),
        cid
      })
      // Notify devOps by mail
      notifyDevOpsOfNewRegistration(data.name + ' ' + data.surname, data.companyName!)
    } else if (data.status === RegistrationStatus.PENDING) {
      // Validate if new user that we have CID to assign to
      if (!data.cid && data.type === RegistrationType.USER) {
        throw new Error('New users need a CID to be assigned to')
      }
      const cid = data.cid ? data.cid : uuidv4()
      // Initialize account
      const hash = await hashPassword(data.password)
      await AccountModel._createAccount({
        username: data.email,
        passwordHash: hash,
        cid,
        roles: data.type === RegistrationType.COMPANY ? [RolesEnum.USER, RolesEnum.ADMIN] : [RolesEnum.USER]
      })
      // Create registration obj      
      const pendingDoc = await RegistrationModel._createRegistration({
        ...data,
        registrationId: uuidv4(),
        cid
      })
      // Generate account validation token
      const token = await signMailToken(pendingDoc.registrationId, 'validate')
      // Notify user by mail
      verificationMail(data.email, token, data.type, locals.origin?.realm)
    } else {
      throw new Error('Wrong registration status: ' + data.status)
    }
    return responseBuilder(HttpStatusCode.OK, res, null, null)
	} catch (err) {
		logger.error(err.message)
		return responseBuilder(HttpStatusCode.INTERNAL_SERVER_ERROR, res, err)
	}
}

type putRegistrationController = expressTypes.Controller<{ token: string }, { status: RegistrationStatus }, {}, null, localsTypes.ILocals>
 
export const putRegistration: putRegistrationController = async (req, res) => {
  const { status } = req.body
  const { token } = req.params
  const locals = res.locals
	try {
    if (status === RegistrationStatus.VERIFIED) {
      const decoded = await verifyToken(token)
      const registrationId = decoded.iss
      // Retrieve the registration object
      const registrationObj = await RegistrationModel._getDoc(registrationId)
      // Validate if secret in token has not expired (email === username)
      await checkTempSecret(registrationObj.email, decoded.sub)
      if (decoded.aud !== 'validate') {
        throw new Error('Invalid token type')
      } else {
        await registrationObj._updateStatus(status)
        // Create org and user
      }
    } else if (status === RegistrationStatus.PENDING) {
      // For status pending token === registrationId
      const registrationId = token
      // Retrieve the registration object
      const registrationObj = await RegistrationModel._getDoc(registrationId)
      // Generate account validation token
      const newToken = await signMailToken(registrationId, 'validate')
      // Notify user by mail
      verificationMail(registrationObj.email, newToken, registrationObj.type, locals.origin?.realm)
    } else if (status === RegistrationStatus.DECLINED) {
      // For status pending token === registrationId
      const registrationId = token
      // Retrieve the registration object
      const registrationObj = await RegistrationModel._getDoc(registrationId)
      // Notify user by mail
      rejectRegistration(registrationObj.email, registrationObj.companyName)
    } else {
      throw new Error('Wrong registration update request with status: ' + status)
    }  
    return responseBuilder(HttpStatusCode.OK, res, null, null)
	} catch (err) {
		logger.error(err.message)
		return responseBuilder(HttpStatusCode.INTERNAL_SERVER_ERROR, res, err)
	}
}

type findDuplicatesUserController = expressTypes.Controller<{}, { email: string }, {}, boolean, localsTypes.ILocals>
 
export const findDuplicatesUser: findDuplicatesUserController = async (req, res) => {
  const { email } = req.body
	try {
    const data = await RegistrationModel._findDuplicatesUser(email)
    return responseBuilder(HttpStatusCode.OK, res, null, data)
	} catch (err) {
		logger.error(err.message)
		return responseBuilder(HttpStatusCode.INTERNAL_SERVER_ERROR, res, err)
	}
}

type findDuplicatesCompanyController = expressTypes.Controller<{}, { companyName: string }, {}, boolean, localsTypes.ILocals>
 
export const findDuplicatesCompany: findDuplicatesCompanyController = async (req, res) => {
  const { companyName } = req.body
	try {
    const data = await RegistrationModel._findDuplicatesCompany(companyName)
    return responseBuilder(HttpStatusCode.OK, res, null, data)
	} catch (err) {
		logger.error(err.message)
		return responseBuilder(HttpStatusCode.INTERNAL_SERVER_ERROR, res, err)
	}
}
