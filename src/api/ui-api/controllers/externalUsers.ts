// Controller common imports
import { errorHandler, MyError } from '../../../utils/error-handler'
import { ExternalUserModel } from '../../../persistance/externalUsers/model'
import { ACLObject, GrantType, IExternalUserCreatedUi, IExternalUserUi } from '../../../persistance/externalUsers/types'
import { generateSecret,  hashPassword } from '../../../auth-server/auth-server'
import { expressTypes, localsTypes } from '../../../types/index'
import { HttpStatusCode, logger, responseBuilder } from '../../../utils'
import { ItemModel } from '../../../persistance/item/model'
import { NodeModel } from '../../../persistance/node/model'
import { RolesEnum } from '../../../types/roles'
import { UserModel } from '../../../persistance/user/model'

// Controller specific imports

// Controllers

type createExternalUserController = expressTypes.Controller<{}, { ACL: ACLObject, name: string, grantType?: GrantType[] }, {}, IExternalUserCreatedUi, localsTypes.ILocals>

export const createExternalUser: createExternalUserController = async (req, res) => {
    const { ACL, name } = req.body 
    const grantType = req.body.grantType ? req.body.grantType : [GrantType.DATA_ACCESS]
    const { decoded } = res.locals
    try {
        // CID LEVEL
        if (ACL.cid) {
            // Check ROLES
            if (!decoded.roles.includes(RolesEnum.ADMIN)) {
                throw new MyError('Missing proper roles', HttpStatusCode.FORBIDDEN)
            }
            // Only myOrg can be part of the ACL
            ACL.cid.forEach(c => {
                // Test CIDs are valid
                if (c !== decoded.org) {
                    throw new MyError('Invalid CID', HttpStatusCode.FORBIDDEN,)
                }
            })
        }
        // OID LEVEL
        if (ACL.oid) {
            // Check ROLES
            if (!decoded.roles.includes(RolesEnum.SERV_PROVIDER) && !decoded.roles.includes(RolesEnum.DEV_OWNER)) {
                throw new MyError('Missing proper roles', HttpStatusCode.FORBIDDEN)
            }
            // tweak to allow including all user items
            if (ACL.oid.includes('all')) {
                const myUserDoc = await UserModel._getDoc(decoded.sub)
                ACL.oid = myUserDoc.hasItems
            }
            for (const oid of ACL.oid) {
                const item = await ItemModel._getItem(oid)
                if (!item) {
                    throw new MyError('Invalid OID', HttpStatusCode.FORBIDDEN)
                }
                if (item.cid !== decoded.org) {
                    throw new MyError('Item does not belong to your org', HttpStatusCode.FORBIDDEN)
                }
                if (item.uid !== decoded.sub) {
                    throw new MyError('Item does not belong to your user', HttpStatusCode.FORBIDDEN)
                }
            }
        }
        // NODE LEVEL
        if (ACL.agid) {
            if (!decoded.roles.includes(RolesEnum.SYS_INTEGRATOR)) {
                throw new MyError('Missing proper roles', HttpStatusCode.FORBIDDEN)
            }
            for (const agid of ACL.agid) {
                const node = await NodeModel._getNode(agid)
                if (!node) {
                    throw new MyError('Invalid AGID', HttpStatusCode.FORBIDDEN)
                }
                if (node.cid !== decoded.org) {
                    throw new MyError('Node does not belong under your org', HttpStatusCode.FORBIDDEN)
                }
            }
        }
        const secretKey = generateSecret()
        const secretKeyHash = await hashPassword(secretKey)
        // Remove duplicates
        ACL.oid = [...new Set(ACL.oid)]
        ACL.agid = [...new Set(ACL.agid)]
        ACL.cid = [...new Set(ACL.cid)]
        // Create external user
        const externalUser = await ExternalUserModel._createExternalUser({ ACL, name, cid: decoded.org, secretKey: secretKeyHash, grantType })
        return responseBuilder(HttpStatusCode.OK, res, null, { keyid: externalUser.keyid, name: externalUser.name, ACL: externalUser.ACL, secretKey, created: externalUser.created, ttl: externalUser.ttl })
    } catch (err) {
        const error = errorHandler(err)
        logger.error({ msg: error.message, id: res.locals.reqId })
        return responseBuilder(error.status, res, error.message)
    }
}

type removeExternalUserController = expressTypes.Controller<{keyid: string}, {}, {}, null, localsTypes.ILocals>

export const removeExternalUser: removeExternalUserController = async (req, res) => {
    const { keyid } = req.params
    const { decoded } = res.locals
    try {
        // TODO: Check roles
        const eUser = await ExternalUserModel._getByKeyid(keyid)
        if (decoded.org !== eUser.cid) {
            throw new MyError('You are not allowed to remove this user', HttpStatusCode.FORBIDDEN)
        }
        await ExternalUserModel._removeExternalUser(keyid)
        return responseBuilder(HttpStatusCode.OK, res, null, null)
    } catch (err) {
        const error = errorHandler(err)
        logger.error({ msg: error.message, id: res.locals.reqId })
        return responseBuilder(error.status, res, error.message)
    }
}

type getExternalUserByCidController = expressTypes.Controller<{}, {}, {}, IExternalUserUi[], localsTypes.ILocals>

export const getExternalUserByCid: getExternalUserByCidController = async (_req, res) => {
    const { decoded } = res.locals
    try {
        const eUsers = await ExternalUserModel._getExternalUsersByCid(decoded.org)
        return responseBuilder(HttpStatusCode.OK, res, null, eUsers)
    } catch (err) {
        const error = errorHandler(err)
        logger.error({ msg: error.message, id: res.locals.reqId })
        return responseBuilder(error.status, res, error.message)
    }
}

