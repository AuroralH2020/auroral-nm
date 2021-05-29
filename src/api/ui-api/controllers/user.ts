// Controller common imports
import { expressTypes, localsTypes } from '../../../types/index'
import { HttpStatusCode } from '../../../utils/http-status-codes'
import { logger } from '../../../utils/logger'
import { responseBuilder } from '../../../utils/response-builder'

// Controller specific imports
import { UserModel } from '../../../persistance/user/model'
import { IUserUI, IUserUIProfile, IUserUpdate, UserVisibility } from '../../../persistance/user/types'
import { OrganisationModel } from '../../../persistance/organisation/model'
import { AccountModel } from '../../../persistance/account/model'
import { hashPassword, comparePassword } from '../../../auth-server/auth-server'

// Controllers

type getOneController = expressTypes.Controller<{ uid: string }, {}, {}, IUserUIProfile, localsTypes.ILocals>
 
export const getOne: getOneController = async (req, res) => {
        const { uid } = req.params // Requested organisation info
        try {
                const data = await UserModel._getUser(uid)
                return responseBuilder(HttpStatusCode.OK, res, null, data)
        } catch (err) {
                logger.error(err.message)
                return responseBuilder(HttpStatusCode.INTERNAL_SERVER_ERROR, res, err)
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
                const data = await UserModel._getAllUsers(cid, accessLevel, users)
                return responseBuilder(HttpStatusCode.OK, res, null, data)
        } catch (err) {
                logger.error(err.message)
                return responseBuilder(HttpStatusCode.INTERNAL_SERVER_ERROR, res, err)
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
                return responseBuilder(HttpStatusCode.OK, res, null, null)
        } catch (err) {
                logger.error(err.message)
                return responseBuilder(HttpStatusCode.INTERNAL_SERVER_ERROR, res, err)
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
                comparePassword(account.username, oldPwd)
                const newHash = await hashPassword(newPwd)
                account._updatePasswordHash(newHash)
                return responseBuilder(HttpStatusCode.OK, res, null, null)
        } catch (err) {
                logger.error(err.message)
                return responseBuilder(HttpStatusCode.INTERNAL_SERVER_ERROR, res, err)
        }
}
