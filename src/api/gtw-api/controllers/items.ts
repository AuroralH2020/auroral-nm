// Controller common imports
import { expressTypes, localsTypes } from '../../../types/index'
import { HttpStatusCode } from '../../../utils/http-status-codes'
import { logger } from '../../../utils/logger'
import { responseBuilder } from '../../../utils/response-builder'
import { errorHandler, MyError } from '../../../utils/error-handler'

// Controller specific imports
import { cs } from '../../../microservices/commServer'
import { IGatewayItemUpdate, IItemCreate, IItemUpdate, ItemStatus } from '../../../persistance/item/types'
import { NodeModel } from '../../../persistance/node/model'
import { ItemModel } from '../../../persistance/item/model'
import { ItemService } from '../../../core'
import { csUserRoster } from '../../../types/cs-types'
import { ResultStatusType, EventType } from '../../../types/misc-types'
import { Config } from '../../../config'
import { OrganisationModel } from '../../../persistance/organisation/model'
import { NotificationModel } from '../../../persistance/notification/model'
import { AuditModel } from '../../../persistance/audit/model'
import { NotificationStatus } from '../../../persistance/notification/types'

// Types

type registrationResponse = {
  name: string
  oid: string
  password: string | null
  error?: boolean
}

type registrationUpdateResponse = {
  oid: string
  error?: boolean
}

type registrationRemoveResponse = {
  oid: string,
  statusCode: number,
  error?: string,
  success?: boolean,
}

// Controllers
type registrationController = expressTypes.Controller<{}, { agid: string, items: IItemCreate[] }, {}, registrationResponse[], localsTypes.ILocalsGtw>

export const registration: registrationController = async (req, res) => {
  const { decoded } = res.locals
  try {
    logger.debug('Registering items in node: ' + req.body.agid)
    const response: registrationResponse[] = []
    if (!decoded && Config.NODE_ENV === 'production') {
      logger.error('Gateway unauthorized access attempt')
      return responseBuilder(HttpStatusCode.UNAUTHORIZED, res, null, response)
    } 
    if (!decoded) {
        logger.warn('Gateway anonymous access, it will be forbidden in production...')
    }
    const agid = decoded ? decoded.agid : req.body.agid
    const node = await NodeModel._getNode(agid)

    const itemsToActivate: { oid:string, data:  IItemUpdate, uid: string }[] = []
    // Async registration of items
    await Promise.all(req.body.items.map(async (it): Promise<boolean> => {
      try {
        // Create item
        const password = await ItemService.createOne(it, agid, node.cid)
        // Autoenable item if configured
        if (node.defaultOwner && node.defaultOwner[it.type]) { 
          itemsToActivate.push({ oid: it.oid, data: { status: ItemStatus.ENABLED }, uid: node.defaultOwner[it.type] })
        }
        // Create response
        response.push({ name: it.name, oid: it.oid, password })
        // Create Notification
        const myOrgName = (await OrganisationModel._getOrganisation(node.cid)).name
        await NotificationModel._createNotification({
          owner: node.cid,
          actor: { id: node.cid, name: myOrgName },
          target: { id: it.oid, name: it.name },
          type: EventType.itemDiscovered,
          status: NotificationStatus.INFO
        })
        // Audit
        await AuditModel._createAudit({
          ...res.locals.audit,
          cid: node.cid,
          actor: { id: agid, name: node.name },
          target: { id: it.oid, name: it.name },
          type: EventType.itemDiscovered,
          labels: { ...res.locals.audit.labels, status: ResultStatusType.SUCCESS }
        })
        return true
      } catch (err) {
        // Create response
        const error = errorHandler(err)
        logger.error({ msg: error.message, id: res.locals.reqId })
        response.push({ name: it.name, oid: it.oid, password: null, error: true })
        return false
      }
    }))
    logger.info('Gateway with id ' + agid + ' registered items')
    for (const item of itemsToActivate) {
      setTimeout(() => { // enable item in 30seconds
        logger.info('Autoenabling item registered under: ' + agid)
        ItemService.updateOne(item.oid, item.data, item.uid)
      }, 30000)
    }
    return responseBuilder(HttpStatusCode.OK, res, null, response)
  } catch (err) {
    const error = errorHandler(err)
    logger.error({ msg: error.message, id: res.locals.reqId })
    return responseBuilder(error.status, res, error.message)
  }
}

type neighbourhoodController = expressTypes.Controller<{ oid: string }, {}, {}, csUserRoster | undefined, localsTypes.ILocalsGtw>

export const neighbourhood: neighbourhoodController = async (req, res) => {
  const { oid } = req.params
  const { decoded } = res.locals
  try {
    if (!decoded && Config.NODE_ENV === 'production') {
      logger.warn({ msg: 'Gateway unauthorized access attempt', id: res.locals.reqId })
      return responseBuilder(HttpStatusCode.UNAUTHORIZED, res, null)
    } else {
      if (!decoded) {
        logger.warn({ msg: 'Gateway anonymous access, it will be forbidden in production...', id: res.locals.reqId })
      }
      const neighbours = await cs.getUserRoster(oid)
      return responseBuilder(HttpStatusCode.OK, res, null, neighbours)
    }
  } catch (err) {
    const error = errorHandler(err)
    logger.error({ msg: error.message, id: res.locals.reqId })
    return responseBuilder(error.status, res, error.message)
  }
}

type deleteItemsController = expressTypes.Controller<{}, { agid: string, oids: string[] }, {}, registrationRemoveResponse[], localsTypes.ILocalsGtw>

export const deleteItems: deleteItemsController = async (req, res) => {
  const { oids } = req.body
  const { decoded } = res.locals
  try {
    if (!decoded && Config.NODE_ENV === 'production') {
      logger.warn({ msg: 'Gateway unauthorized access attempt', id: res.locals.reqId })
      return responseBuilder(HttpStatusCode.UNAUTHORIZED, res, null)
    } else {
      if (!decoded) {
        logger.warn({ msg: 'Gateway anonymous access, it will be forbidden in production...', id: res.locals.reqId })
      }
      const agid = decoded ? decoded.id : req.body.agid

      const items : registrationRemoveResponse[] =  await Promise.all(oids.map(async (it) => {      
        try {
          const myItem = (await ItemModel._getItem(it))
          const myNode = (await NodeModel._getNode(agid))
          const myOrg = (await OrganisationModel._getOrganisation(myItem.cid))
          await ItemService.removeOne(it, agid)
          // Create Notification
          await NotificationModel._createNotification({
            owner: myOrg.cid,
            actor: { id: agid, name: myNode.name },
            target: { id: myItem.oid, name: myItem.name },
            type: EventType.itemRemoved,
            status: NotificationStatus.INFO
          })
          // Audit
          await AuditModel._createAudit({
            ...res.locals.audit,
            actor: { id: agid, name: myNode.name },
            target: { id: myItem.oid, name: myItem.name },
            type: EventType.itemRemoved,
            labels: { ...res.locals.audit.labels, status: ResultStatusType.SUCCESS }
          })
          logger.info({ msg: it + 'was removed from ' + agid, id: res.locals.reqId })
          return { oid: it, statusCode: 200 } as registrationRemoveResponse
        } catch (error) {
          const e = errorHandler(error)
          logger.error({ msg: e.message, id: res.locals.reqId })
          return { oid: it, error: e.message, statusCode: e.status }
        }
      }))
      return responseBuilder(HttpStatusCode.OK, res, null, items)
    }
  } catch (err) {
    const error = errorHandler(err)
    logger.error({ msg: error.message, id: res.locals.reqId })
    return responseBuilder(error.status, res, error.message)
  }
}

type updateItemController = expressTypes.Controller<{}, { agid: string, items: IGatewayItemUpdate[] }, {}, registrationUpdateResponse[], localsTypes.ILocalsGtw>

export const updateItem: updateItemController = async (req, res) => {
  const {  agid, items } = req.body
  const { decoded } = res.locals
  try {
    logger.debug('Registering items in node: ' + agid)
    const response: registrationUpdateResponse[] = []

    if (!decoded && Config.NODE_ENV === 'production') {
      logger.error('Gateway unauthorized access attempt')
      return responseBuilder(HttpStatusCode.UNAUTHORIZED, res, null, response)
    } else {
      if (!decoded) {
        logger.warn('Gateway anonymous access, it will be forbidden in production...')
      }
      const reqAgid = decoded ? decoded.agid : agid
      const node = await NodeModel._getNode(reqAgid)
      // Async updating of items
      await Promise.all(items.map(async (it): Promise<boolean> => {
        try {
          // Test if AP contains this item
          if (!node.hasItems.includes(it.oid)) {
            throw new MyError('Trying to modify item that do not belong to this node (' + it.oid + ')')
          }
          // UpdateItem
          const item = await ItemModel._getDoc(it.oid)
          await item._updateItem(it)
          // Create response
          response.push({ oid: it.oid,error: false })

          // get updated item for notifications
          const updatedItem = await ItemModel._getItem(it.oid)

          // Create Notification
          const myOrgName = (await OrganisationModel._getOrganisation(node.cid)).name
          await NotificationModel._createNotification({
            owner: node.cid,
            actor: { id: node.cid, name: myOrgName },
            target: { id: updatedItem.oid, name: updatedItem.name },
            type: EventType.itemUpdatedByNode,
            status: NotificationStatus.INFO
          })
          // Audit
          await AuditModel._createAudit({
            ...res.locals.audit,
            cid: node.cid,
            actor: { id: reqAgid, name: node.name },
            target: { id: updatedItem.oid, name: updatedItem.name },
            type: EventType.itemUpdatedByNode,
            labels: { ...res.locals.audit.labels, status: ResultStatusType.SUCCESS }
          })
          return true
        } catch (err) {
          // Create response
          const error = errorHandler(err)
          logger.error({ msg: error.message,id: res.locals.reqId })
          response.push({ oid: it.oid, error: true })
          return false
        }
      }))
      return responseBuilder(HttpStatusCode.OK, res, null, response)
    }
  } catch (err) {
    const error = errorHandler(err)
    logger.error({ msg: error.message, id: res.locals.reqId })
    return responseBuilder(error.status, res, error.message)
  }
}

type getAgidByOidCtrl = expressTypes.Controller<{oid: string}, {}, {}, string, localsTypes.ILocalsGtw>

export const getAgidByOid: getAgidByOidCtrl = async (req, res) => {
  const { oid } = req.params
  const { decoded } = res.locals
  try {
    if (!decoded && Config.NODE_ENV === 'production') {
      logger.error('Gateway unauthorized access attempt')
      return responseBuilder(HttpStatusCode.UNAUTHORIZED, res, 'Gateway unauthorized access attempt')
    }
    try {
      // Check if 'oid' is actually agid
      await NodeModel._getNode(oid)
      return responseBuilder(HttpStatusCode.OK, res, null, oid)
    } catch (error) { 
      // Get AGID by oid
      const item = await ItemModel._getItem(oid)
      return responseBuilder(HttpStatusCode.OK, res, null, item.agid)
    }
  } catch (err) {
    const error = errorHandler(err)
    logger.error({ msg: error.message, id: res.locals.reqId })
    return responseBuilder(error.status, res, error.message)
  }
}
