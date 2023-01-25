// Controller common imports
import { errorHandler, MyError } from '../../../utils/error-handler'
import { ExternalUserModel } from '../../../persistance/externalUsers/model'
import { ACLObject, GrantType } from '../../../persistance/externalUsers/types'
import { expressTypes, localsTypes } from '../../../types/index'
import { HttpStatusCode, logger, responseBuilder } from '../../../utils'
import { verifyHash } from '../../../auth-server/auth-server'
import { NodeService } from '../../../core'
import { NodeModel } from '../../../persistance/node/model'
import { INodeCreate, INodeExternal } from '../../../persistance/node/types'
import { OrganisationModel } from '../../../persistance/organisation/model'

// EXTERAL USER API

type checkExternalAuthController = expressTypes.Controller<{}, { keyid: string, secret: string }, {}, { grantType: GrantType[],  ACL: ACLObject }, localsTypes.ILocals>

export const checkExternalAuth: checkExternalAuthController = async (req, res) => {
    const { keyid, secret } = req.body
        try {    
            const eUser = await ExternalUserModel._getByKeyid(keyid)
            const isValid = await verifyHash(secret, eUser.secretKey)
            if (!isValid) {
                throw new MyError('Invalid secret', HttpStatusCode.UNAUTHORIZED)
            }
            return responseBuilder(HttpStatusCode.OK, res, null, { grantType: eUser.grantType, ACL: eUser.ACL })
        } catch (err) {
            const error = errorHandler(err)
            logger.error({ msg: error.message, id: res.locals.reqId })
            return responseBuilder(error.status, res, error.message)
        }
}

type pushPubkeyController = expressTypes.Controller<{ agid: string }, { keyid: string, secret: string, pubkey: string }, {}, string, localsTypes.ILocals>

export const pushNodePubkey: pushPubkeyController = async (req, res) => {
    const { agid } = req.params
    const { keyid, secret, pubkey } = req.body
    try {
        const eUser = await ExternalUserModel._getByKeyid(keyid)
        const isValid = await verifyHash(secret, eUser.secretKey)
        if (!isValid) {
            throw new MyError('Invalid secret', HttpStatusCode.UNAUTHORIZED)
        }
        // Check if grantType is correct
        if (!eUser.grantType.includes(GrantType.AP_EDIT)) {
            throw new MyError('You are not allowed to set AP pubkey', HttpStatusCode.FORBIDDEN)
        }
        // Check if ACL contains AGID or CID
        const node = await NodeModel._getNode(agid)
        if (!eUser.ACL.agid.includes(agid) && !eUser.ACL.cid.includes(node.cid)) {
            throw new MyError('You are not allowed to push pubkey to this node', HttpStatusCode.FORBIDDEN)
        }
        // Push pubkey to MongoDB
        logger.debug({ msg: 'Updating node pubkey using EXT api', id: res.locals.reqId })
        await NodeService.updateOne(agid, { key: pubkey })
        return responseBuilder(HttpStatusCode.OK, res, null, 'Public key updated' as string)
    } catch (err) { 
        const error = errorHandler(err)
        logger.error({ msg: error.message, id: res.locals.reqId })
        return responseBuilder(error.status, res, error.message)
    }
}

type removeNodeController = expressTypes.Controller<{ agid: string }, { keyid: string, secret: string }, {}, string, localsTypes.ILocals>

export const removeNode: removeNodeController = async (req, res) => {
    const { agid } = req.params
    const { keyid, secret } = req.body
    try {
        const eUser = await ExternalUserModel._getByKeyid(keyid)
        const isValid = await verifyHash(secret, eUser.secretKey)
        if (!isValid) {
            throw new MyError('Invalid secret', HttpStatusCode.UNAUTHORIZED)
        }
        // Check if grantType is correct
        if (!eUser.grantType.includes(GrantType.AP_EDIT)) {
            throw new MyError('You are not allowed to remove AP', HttpStatusCode.FORBIDDEN)
        }
        // Check if ACL contains AGID or CID
        const node = await NodeModel._getNode(agid)
        if (!eUser.ACL.agid.includes(agid) && !eUser.ACL.cid.includes(node.cid)) { 
            throw new MyError('You are not allowed to remove this node', HttpStatusCode.FORBIDDEN)
        }
        // Remove node from MongoDB
        logger.debug({ msg: 'Removing node using EXT api', id: res.locals.reqId })

        await NodeService.removeOne(agid)
        return responseBuilder(HttpStatusCode.OK, res, null, 'Node removed' as string)
    } catch (err) {
        const error = errorHandler(err)
        logger.error({ msg: error.message, id: res.locals.reqId })
        return responseBuilder(error.status, res, error.message)
    }
}

type createNodeController = expressTypes.Controller<{}, { keyid: string, secret: string, node: INodeCreate & { pubkey: string } }, {}, { agid: string }, localsTypes.ILocals>

export const createNode: createNodeController = async (req, res) => {
    const { keyid, secret, node } = req.body
    try {
        const eUser = await ExternalUserModel._getByKeyid(keyid)
        const isValid = await verifyHash(secret, eUser.secretKey)
        if (!isValid) {
            throw new MyError('Invalid secret', HttpStatusCode.UNAUTHORIZED)
        }
        // Check if grantType is correct
        if (!eUser.grantType.includes(GrantType.AP_EDIT)) {
            throw new MyError('You are not allowed to create nodes', HttpStatusCode.FORBIDDEN)
        }
        // Check if ACL contains AGID or CID
        if (eUser.ACL.cid.length < 1) {
            throw new MyError('Your token is missing cid', HttpStatusCode.FORBIDDEN)
        }
        // Create node in MongoDB
        logger.debug({ msg: 'Creating node using EXT api', id: res.locals.reqId })
        const agid = await NodeService.createOne(eUser.ACL.cid[0], node.name, node.type, node.password, node.pubkey)
        return responseBuilder(HttpStatusCode.OK, res, null, { agid })
    } catch (err) {
        const error = errorHandler(err)
        logger.error({ msg: error.message, id: res.locals.reqId })
        return responseBuilder(error.status, res, error.message)
    }
}

type getNodesController = expressTypes.Controller<{},{ keyid: string, secret: string }, {}, INodeExternal[], localsTypes.ILocals>

export const getNodes: getNodesController = async (req, res) => {
    const { keyid, secret } = req.body
    try {
        const eUser = await ExternalUserModel._getByKeyid(keyid)
        const isValid = await verifyHash(secret, eUser.secretKey)
        if (!isValid) {
            throw new MyError('Invalid secret', HttpStatusCode.UNAUTHORIZED)
        }
        // Check if grantType is correct
        if (!eUser.grantType.includes(GrantType.AP_EDIT)) {
            throw new MyError('You are not allowed to retrieve nodes', HttpStatusCode.FORBIDDEN)
        }
        if (eUser.ACL.cid.length < 1) {
            throw new MyError('Your token is missing cid', HttpStatusCode.FORBIDDEN)
        }
        // for each cid in ACL, get all nodes
        const nodeIds : string[] = []
        for (const cid of eUser.ACL.cid) {
            const org = await OrganisationModel._getOrganisation(cid)
            org.hasNodes.forEach((node) => {
                nodeIds.push(node)
            })
        }
        const nodes : INodeExternal[]  = await Promise.all(nodeIds.map(async (agid) => {
            const node = await NodeModel._getNode(agid)
            return { 
                agid: node.agid,
                name: node.name,
                cid: node.cid,
                hasKey: node.hasKey,
                itemsCount: node.itemsCount,
                info: node.info,
                visible: node.visible,
                defaultOwner: node.defaultOwner
            }
        }))
        return responseBuilder(HttpStatusCode.OK, res, null, nodes)
    } catch (err) {
        const error = errorHandler(err)
        logger.error({ msg: error.message, id: res.locals.reqId })
        return responseBuilder(error.status, res, error.message)
    }
}
