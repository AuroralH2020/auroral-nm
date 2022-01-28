// Controller common imports
import { expressTypes, localsTypes } from '../../../types/index'
import { HttpStatusCode } from '../../../utils/http-status-codes'
import { logger } from '../../../utils/logger'
import { responseBuilder } from '../../../utils/response-builder'
import { errorHandler, MyError } from '../../../utils/error-handler'

// Controller specific imports
import { UserModel } from '../../../persistance/user/model'
import { AuditModel } from '../../../persistance/audit/model'
import { NotificationModel } from '../../../persistance/notification/model'
import { NotificationStatus } from '../../../persistance/notification/types'
import { IUserUI, IUserUIProfile, IUserUpdate, UserVisibility } from '../../../persistance/user/types'
import { OrganisationModel } from '../../../persistance/organisation/model'
import { AccountModel } from '../../../persistance/account/model'
import { hashPassword, comparePassword } from '../../../auth-server/auth-server'
import { ResultStatusType, EventType } from '../../../types/misc-types'
import { UserService } from '../../../core'

// Controllers

type getOneController = expressTypes.Controller<{ uid: string }, {}, {}, IUserUIProfile, localsTypes.ILocals>
 
export const getOne: getOneController = async (req, res) => {
        const { uid } = req.params // Requested organisation info
        try {
                const data = await UserModel._getUser(uid)
                return responseBuilder(HttpStatusCode.OK, res, null, data)
        } catch (err) {
                const error = errorHandler(err)
                logger.error({ msg: error.message, id: res.locals.reqId })
                return responseBuilder(error.status, res, error.message)
        }
}

type getManyController = expressTypes.Controller<{ cid: string }, {}, {}, IUserUI[], localsTypes.ILocals>
 
export const getMany: getManyController = async (req, res) => {
        const { cid } = req.params
        const { decoded } = res.locals
        try {
                // Find relationship between organisations (requester and requested)
                const organisation = await OrganisationModel._getOrganisation(cid)
                let accessLevel: UserVisibility[] = []
                const users: string[] = organisation.hasUsers
                if (cid === decoded.org) {
                        // It is same org
                        accessLevel = Object.values(UserVisibility) as UserVisibility[]
                } else {
                        const friends = organisation.knows
                        accessLevel = friends.indexOf(decoded.org) !== -1 ?
                                      [UserVisibility.FRIENDS_ONLY, UserVisibility.PUBLIC] :
                                      [UserVisibility.PUBLIC]  
                }
                const data = await UserModel._getAllUsers(accessLevel, users)
                return responseBuilder(HttpStatusCode.OK, res, null, data)
        } catch (err) {
                const error = errorHandler(err)
                logger.error({ msg: error.message, id: res.locals.reqId })
                return responseBuilder(error.status, res, error.message)
        }
}
type removeUserController = expressTypes.Controller<{ uid: string }, {}, {}, null, localsTypes.ILocals>

export const removeUser: removeUserController = async (req, res) => {
        const { uid } = req.params
        const  decoded  = res.locals.decoded
        
        try {
                if (uid === decoded.uid) {
                        throw new MyError('Users cannot delete their accounts', HttpStatusCode.FORBIDDEN)
                }

                // Ger user
                const userDoc = await UserModel._getDoc(uid)
                if ((userDoc.hasItems.length) !== 0) {
                        throw new MyError('User has some enabled items', HttpStatusCode.FORBIDDEN)
                }
   
                const adminUser = await UserModel._getUser(decoded.uid)
                const company = await OrganisationModel._getOrganisation(adminUser.cid)

                // Audit
                await AuditModel._createAudit({
                        ...res.locals.audit,
                        actor: { id: adminUser.uid, name: adminUser.name },
                        target: { id: company.cid, name: company.name },
                        object: { id: userDoc.uid, name: userDoc.name },
                        type: EventType.userRemoved,
                        labels: { ...res.locals.audit.labels, status: ResultStatusType.SUCCESS }
                })
                 // Notification
                await NotificationModel._createNotification({
                        owner: decoded.org,
                        actor: { id: adminUser.uid, name: adminUser.name },
                        target: { id: userDoc.uid, name: userDoc.name },
                        type: EventType.userRemoved,
                        status: NotificationStatus.INFO
                })

                // remove user in MONGO
                await userDoc._removeUser()
                await OrganisationModel._removeUserFromCompany(company.cid, uid)
                logger.debug('User:' + userDoc.name + ' was deleted')

                return responseBuilder(HttpStatusCode.OK, res, null, null)
        } catch (err) {
                const error = errorHandler(err)
                logger.error({ msg: error.message, id: res.locals.reqId })
                return responseBuilder(error.status, res, error.message)
        }
}

type updateUserController = expressTypes.Controller<{ uid: string }, IUserUpdate, {}, null, localsTypes.ILocals>
 
export const updateUser: updateUserController = async (req, res) => {
        const { uid } = req.params
        const payload = req.body
        const my_uid = res.locals.decoded.uid
        try {
                const userDoc = await UserModel._getDoc(uid)
                // If updating roles verify there are no conflicts
                if (payload.roles) {
                        UserService.checkRoles(my_uid, userDoc, payload.roles)
                        // If updating roles add also to account
                        const account = await AccountModel._getDocByUid(uid)
                        account._updateRoles(payload.roles)
                }
                // Update user document
                userDoc._updateUser(payload)
                // Audit
                await AuditModel._createAudit({
                        ...res.locals.audit,
                        actor: { id: uid, name: userDoc.name },
                        target: { id: uid, name: userDoc.name },
                        type: EventType.userUpdated,
                        labels: { ...res.locals.audit.labels, status: ResultStatusType.SUCCESS }
                })
                return responseBuilder(HttpStatusCode.OK, res, null, null)
        } catch (err) {
                const error = errorHandler(err)
                logger.error({ msg: error.message, id: res.locals.reqId })
                return responseBuilder(error.status, res, error.message)
        }
}

type updateUserPwdController = expressTypes.Controller<{ uid: string }, { newPwd: string, oldPwd: string}, {}, null, localsTypes.ILocals>
 
export const updateUserPassword: updateUserPwdController = async (req, res) => {
        const { uid } = req.params
        const { newPwd, oldPwd } = req.body
        try {
                if (!newPwd || !oldPwd) {
                        throw new Error('Wrong body')
                }
                const account = await AccountModel._getDocByUid(uid)
                const myUser = await UserModel._getUser(uid)
                comparePassword(account.username, oldPwd)
                const newHash = await hashPassword(newPwd)
                account._updatePasswordHash(newHash)
                // Audit
                await AuditModel._createAudit({
                        ...res.locals.audit,
                        actor: { id: uid, name: myUser.name },
                        target: { id: uid, name: myUser.name },
                        type: EventType.userPasswordUpdated,
                        labels: { ...res.locals.audit.labels, status: ResultStatusType.SUCCESS }
                })
                return responseBuilder(HttpStatusCode.OK, res, null, null)
        } catch (err) {
                const error = errorHandler(err)
                logger.error({ msg: error.message, id: res.locals.reqId })
                return responseBuilder(error.status, res, error.message)
        }
}
