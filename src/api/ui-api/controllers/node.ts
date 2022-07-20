// Controller common imports
import { expressTypes, localsTypes } from '../../../types/index'
import { HttpStatusCode } from '../../../utils/http-status-codes'
import { logger } from '../../../utils/logger'
import { responseBuilder } from '../../../utils/response-builder'
import { errorHandler, MyError } from '../../../utils/error-handler'

// Controller specific imports
import { DefaultOwnerTypeUpdate, INodeCreate, INodeUI, INodeUpdate } from '../../../persistance/node/types'
import { NodeModel } from '../../../persistance/node/model'
import { OrganisationModel } from '../../../persistance/organisation/model'
import { CommunityService, NodeService } from '../../../core'
import { NotificationModel } from '../../../persistance/notification/model'
import { NotificationStatus } from '../../../persistance/notification/types'
import { AuditModel } from '../../../persistance/audit/model'
import { UserModel } from '../../../persistance/user/model'
import { ResultStatusType, EventType } from '../../../types/misc-types'
import { ItemType } from '../../../persistance/item/types'
import { RolesEnum } from '../../../types/roles'

// Controllers

type getNodeController = expressTypes.Controller<{ agid: string }, {}, {}, INodeUI, localsTypes.ILocals>
 
export const getNode: getNodeController = async (req, res) => {
  const { agid } = req.params
  const { decoded } = res.locals
	try {
    // Validate that agid belongs to organisation by passing optional CID param to _getNode
    // Get node
    const data = await NodeModel._getNode(agid, decoded.org)
    return responseBuilder(HttpStatusCode.OK, res, null, data)
	} catch (err) {
    const error = errorHandler(err)
    logger.error({ msg: error.message, id: res.locals.reqId })
    return responseBuilder(error.status, res, error.message)
	}
}

type getNodesController = expressTypes.Controller<{}, {}, {}, INodeUI[], localsTypes.ILocals>
 
export const getNodes: getNodesController = async (_req, res) => {
  const { decoded } = res.locals
	try {
    const nodes = (await OrganisationModel._getOrganisation(decoded.org)).hasNodes
    const data = await NodeModel._getAllNodes(nodes)
    return responseBuilder(HttpStatusCode.OK, res, null, data)
	} catch (err) {
    const error = errorHandler(err)
    logger.error({ msg: error.message, id: res.locals.reqId })
    return responseBuilder(error.status, res, error.message)
	}
}

type postNodeController = expressTypes.Controller<{}, INodeCreate, {}, null, localsTypes.ILocals>
 
export const createNode: postNodeController = async (req, res) => {
  const { name, type, password, communities } = req.body
  const { decoded } = res.locals
	try {
    // Create node
    const agid = await NodeService.createOne(decoded.org, name, type, password)

    // process adding to communities 
    try {
      if (communities) {
        for (const community of communities) {
          await CommunityService.addNode(community, decoded.org, agid)
        }
      }
    } catch (error) {
      logger.warn('Node ' + agid + ' can not be added to community')
    }
    const myUser = await UserModel._getUser(decoded.uid)
    // Audit
    await AuditModel._createAudit({
      ...res.locals.audit,
      actor: { id: decoded.uid, name: myUser.name },
      target: { id: agid, name: name }, 
      type: EventType.nodeCreated,
      labels: { ...res.locals.audit.labels, status: ResultStatusType.SUCCESS }
    })
    return responseBuilder(HttpStatusCode.OK, res, null, null)
	} catch (err) {
    const error = errorHandler(err)
    logger.error({ msg: error.message, id: res.locals.reqId })
    return responseBuilder(error.status, res, error.message)
	}
}

type putNodeController = expressTypes.Controller<{ agid: string }, INodeUpdate, {}, null, localsTypes.ILocals>
 
export const updateNode: putNodeController = async (req, res) => {
  const data = req.body
  const { agid } = req.params
  const { decoded } = res.locals
	try {
    const node = await NodeModel._getDoc(agid)
    if (node.cid !== decoded.org) {
      return responseBuilder(HttpStatusCode.FORBIDDEN, res, 'Node does not belong to your organisation')
    }
    await NodeService.updateOne(agid, data)
    // TBD: Consider updating password too 
    
    // Notification
    const myOrgName = (await OrganisationModel._getOrganisation(decoded.org)).name
    const myUserName = (await UserModel._getUser(decoded.uid)).name
    let eventType = EventType.nodeUpdated
    if ('key' in data) {
      eventType = EventType.nodeUpdatedKey
    }
    await NotificationModel._createNotification({
      owner: decoded.org,
      actor: { id: decoded.org, name: myOrgName },
      target: { id: agid, name: node.name },
      type: EventType.nodeUpdated,
      status: NotificationStatus.INFO
    })
    // Audit
    await AuditModel._createAudit({
      ...res.locals.audit,
      actor: { id: decoded.uid, name: myUserName },
      target: { id: agid, name: node.name },
      type: eventType,
      labels: { ...res.locals.audit.labels, status: ResultStatusType.SUCCESS }
    })

    return responseBuilder(HttpStatusCode.OK, res, null, null)
	} catch (err) {
    const error = errorHandler(err)
    logger.error({ msg: error.message, id: res.locals.reqId })
    return responseBuilder(error.status, res, error.message)
	}
}

type removeNodeController = expressTypes.Controller<{ agid: string }, {}, {}, null, localsTypes.ILocals>
 
export const removeNode: removeNodeController = async (req, res) => {
  const { agid } = req.params
  const { decoded } = res.locals
	try {
    // Validate that agid belongs to organisation by passing optional CID param to _getNode
    const myUser = await UserModel._getUser(decoded.uid)
    const myNode = await NodeModel._getNode(agid)
    if (myUser.cid !== myNode.cid) {
      throw new MyError('You are not allowed to remove this node', HttpStatusCode.FORBIDDEN)
    }
    // Remove node
    await NodeService.removeOne(agid, decoded.org)
    // Audit
    await AuditModel._createAudit({
      ...res.locals.audit,
      actor: { id: decoded.uid, name: myUser.name },
      target: { id: agid, name: myNode.name }, 
      type: EventType.nodeRemoved,
      labels: { ...res.locals.audit.labels, status: ResultStatusType.SUCCESS }
    })
    return responseBuilder(HttpStatusCode.OK, res, null, null)
	} catch (err) {
    const error = errorHandler(err)
    logger.error({ msg: error.message, id: res.locals.reqId })
    return responseBuilder(error.status, res, error.message)
	}
}

type getKeyController = expressTypes.Controller<{ agid: string }, {}, {}, string | null, localsTypes.ILocals>
 
export const getKey: getKeyController = async (req, res) => {
  const { agid } = req.params
	try {
    const key = await NodeModel._getKey(agid)
    return responseBuilder(HttpStatusCode.OK, res, null, key)
	} catch (err) {
    const error = errorHandler(err)
    logger.error({ msg: error.message, id: res.locals.reqId })
    return responseBuilder(error.status, res, error.message)
	}
}

type removeKeyController = expressTypes.Controller<{ agid: string }, {}, {}, null, localsTypes.ILocals>
 
export const removeKey: removeKeyController = async (req, res) => {
  const { agid } = req.params
  const { decoded } = res.locals
	try {
    await NodeModel._removeKey(agid)
    const myUser = await UserModel._getUser(decoded.uid)
    const myNode = await NodeModel._getNode(agid)

    if (myUser.cid !== myNode.cid) {
      throw new MyError('You are not allowed to remove key from this node', HttpStatusCode.FORBIDDEN)
    }
    // Audit
    await AuditModel._createAudit({
      ...res.locals.audit,
      actor: { id: decoded.uid, name: myUser.name },
      target: { id: agid, name: myNode.name },
      type: EventType.nodeUpdatedKey,
      labels: { ...res.locals.audit.labels, status: ResultStatusType.SUCCESS }
    })
    return responseBuilder(HttpStatusCode.OK, res, null, null)
	} catch (err) {
    const error = errorHandler(err)
    logger.error({ msg: error.message, id: res.locals.reqId })
    return responseBuilder(error.status, res, error.message)
	}
}

type updateDefaultItemOwnerController = expressTypes.Controller<{ agid: string }, DefaultOwnerTypeUpdate, {}, null, localsTypes.ILocals>
 
export const updateDefaultOwner: updateDefaultItemOwnerController = async (req, res) => {
  const { agid } = req.params
  const update = req.body
  const { decoded } = res.locals
	try {
    const myNode = await NodeModel._getNode(agid)
    // check if node belongs to your organisation
    if (myNode.cid !== decoded.org) {  
      return responseBuilder(HttpStatusCode.FORBIDDEN, res, 'Node does not belong to your organisation')
    }
    // role check
    if (update.Device !== undefined && update.Device !== null) {
      const user = await UserModel._getUser(update.Device)
      if (!user.roles.includes(RolesEnum.DEV_OWNER)) {
        throw new Error('User needs to has DEV_OWNER role ')
      }
    }
    if (update.Service !== undefined && update.Service !== null) {
      const user = await UserModel._getUser(update.Service)
      if (!user.roles.includes(RolesEnum.SERV_PROVIDER)) {
        throw new Error('User needs to has SERV_PROVIDER role ')
      }
    }
    
    // remove
    if (update.Device === null && myNode.defaultOwner && myNode.defaultOwner.Device) {
      await NodeModel._removeDefaultOwner(agid, ItemType.DEVICE)
      await UserModel._removeNodeFromUser(myNode.defaultOwner.Device, agid, ItemType.DEVICE)
    }
    if (update.Service === null && myNode.defaultOwner && myNode.defaultOwner.Service) {
      await NodeModel._removeDefaultOwner(agid, ItemType.SERVICE)
      await UserModel._removeNodeFromUser(myNode.defaultOwner.Service, agid, ItemType.SERVICE)
    }

    // update
    if (update.Device) {
      // update Node and user
      await NodeModel._addDefaultOwner(agid,update.Device, ItemType.DEVICE)
      await UserModel._addNodeToUser(update.Device, agid, ItemType.DEVICE)
    }
    if (update.Service) {
      // update Node and user
      await NodeModel._addDefaultOwner(agid,update.Service, ItemType.SERVICE)
      await UserModel._addNodeToUser(update.Service, agid, ItemType.SERVICE)
    }
    
    // Audit
    const myUser = await UserModel._getUser(decoded.uid)
    await AuditModel._createAudit({
      ...res.locals.audit,
      actor: { id: decoded.uid, name: myUser.name },
      target: { id: agid, name: myNode.name },
      type: EventType.nodeUpdated,
      labels: { ...res.locals.audit.labels, status: ResultStatusType.SUCCESS }
    })
    return responseBuilder(HttpStatusCode.OK, res, null, null)
	} catch (err) {
    const error = errorHandler(err)
    logger.error({ msg: error.message, id: res.locals.reqId })
    return responseBuilder(error.status, res, error.message)
	}
}
