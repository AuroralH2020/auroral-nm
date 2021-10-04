// Controller common imports
import { expressTypes, localsTypes } from '../../../types/index'
import { HttpStatusCode } from '../../../utils/http-status-codes'
import { logger } from '../../../utils/logger'
import { responseBuilder } from '../../../utils/response-builder'
import { errorHandler } from '../../../utils/error-handler'

// Controller specific imports
import { UserModel } from '../../../persistance/user/model'
import { AuditModel } from '../../../persistance/audit/model'
import { IUserUI, IUserUIProfile, IUserUpdate, UserVisibility } from '../../../persistance/user/types'
import { OrganisationModel } from '../../../persistance/organisation/model'
import { AccountModel } from '../../../persistance/account/model'
import { hashPassword, comparePassword } from '../../../auth-server/auth-server'
import { ResultStatusType, EventType } from '../../../types/misc-types'

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

type updateUserController = expressTypes.Controller<{ uid: string }, IUserUpdate, {}, null, localsTypes.ILocals>
 
export const updateUser: updateUserController = async (req, res) => {
        const { uid } = req.params
        const payload = req.body
        try {
                const userDoc = await UserModel._getDoc(uid)
                userDoc._updateUser(payload)
                // If updating roles add also to account
                if (payload.roles) {
                        const account = await AccountModel._getDocByUid(uid)
                        account._updateRoles(payload.roles)
                }
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
