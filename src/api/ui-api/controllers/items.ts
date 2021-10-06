// Controller common imports
import { expressTypes, localsTypes } from '../../../types/index'
import { HttpStatusCode } from '../../../utils/http-status-codes'
import { logger } from '../../../utils/logger'
import { responseBuilder } from '../../../utils/response-builder'
import { errorHandler } from '../../../utils/error-handler'

// Controller specific imports
import { ItemService } from '../../../core'
import { IItemUI, IItemUpdate, ItemStatus, ItemType } from '../../../persistance/item/types'
import { OrganisationModel } from '../../../persistance/organisation/model'
import { NotificationModel } from '../../../persistance/notification/model'
import { AuditModel } from '../../../persistance/audit/model'
import { UserModel } from '../../../persistance/user/model'
import { NotificationStatus } from '../../../persistance/notification/types'
import { ItemModel } from '../../../persistance/item/model'
import { ResultStatusType, EventType } from '../../../types/misc-types'

// Controllers

type getManyController = expressTypes.Controller<{}, {}, { type: ItemType, offset: number, filter: number }, IItemUI[], localsTypes.ILocals>
 
export const getMany: getManyController = async (req, res) => {
  const { type, offset, filter } = req.query
  const { decoded } = res.locals
	try {
        const data = await ItemService.getMany(decoded.org, type, offset, filter)
        return responseBuilder(HttpStatusCode.OK, res, null, data)
	} catch (err) {
    const error = errorHandler(err)
    logger.error({ msg: error.message, id: res.locals.reqId })
    return responseBuilder(error.status, res, error.message)
	}
}

type getOneController = expressTypes.Controller<{ oid: string }, {}, {}, IItemUI, localsTypes.ILocals>
 
export const getOne: getOneController = async (req, res) => {
  const { oid } = req.params
  const { decoded } = res.locals
	try {
    const data = await ItemService.getOne(decoded.org, oid)
    return responseBuilder(HttpStatusCode.OK, res, null, data)
	} catch (err) {
    const error = errorHandler(err)
    return responseBuilder(error.status, res, error.message)
	}
}

type UpdateOneController = expressTypes.Controller<{ oid: string }, IItemUpdate, {}, null, localsTypes.ILocals>
 
export const updateOne: UpdateOneController = async (req, res) => {
  const { oid } = req.params
  const data = req.body
  const { decoded } = res.locals
	try {
    await ItemService.updateOne(oid, data, decoded.uid)
    // Send notification to company
    const myOrgName = (await OrganisationModel._getOrganisation(decoded.org)).name
    const myItemName = (await ItemModel._getItem(oid)).name
    const myUserName = (await UserModel._getUser(decoded.uid)).name
    let eventType = EventType.itemUpdatedByUser
    if (data.status) { 
      if (data.status === ItemStatus.DISABLED) {
        eventType = EventType.itemDisabled
      }
      if (data.status === ItemStatus.ENABLED) {
        eventType = EventType.itemEnabled
      }
    }
    // Notification
    await NotificationModel._createNotification({
      owner: decoded.org,
      actor: { id: decoded.org, name: myOrgName },
      target: { id: oid, name: myItemName },
      type: eventType,
      status: NotificationStatus.INFO
    })
    // Audit
    await AuditModel._createAudit({
      ...res.locals.audit,
      actor: { id: decoded.uid, name: myUserName },
      target: { id: oid, name: myItemName },
      type: eventType,
      labels: { ...res.locals.audit.labels, status: ResultStatusType.SUCCESS }
    })
    return responseBuilder(HttpStatusCode.OK, res, null, null, true)
	} catch (err) {
    const error = errorHandler(err)
    logger.error({ msg: error.message, id: res.locals.reqId })
    return responseBuilder(error.status, res, error.message)
	}
}

type RemoveOneController = expressTypes.Controller<{ oid: string }, {}, {}, null, localsTypes.ILocals>
 
export const removeOne: RemoveOneController = async (req, res) => {
  const { oid } = req.params
  const { decoded } = res.locals
	try {
    const myOrgName = (await OrganisationModel._getOrganisation(decoded.org)).name
    const myItemName = (await ItemModel._getItem(oid)).name
    const myUserName = (await UserModel._getUser(decoded.uid)).name
    await ItemService.removeOne(oid, decoded.uid)
    // Notification
    await NotificationModel._createNotification({
      owner: decoded.org,
      actor: { id: decoded.org, name: myOrgName },
      target: { id: oid, name: myItemName },
      type: EventType.itemRemoved,
      status: NotificationStatus.INFO
    })
    // Audit
    await AuditModel._createAudit({
      ...res.locals.audit,
      actor: { id: decoded.uid, name: myUserName },
      target: { id: oid, name: myItemName },
      type: EventType.itemRemoved,
      labels: { ...res.locals.audit.labels, status: ResultStatusType.SUCCESS }
    })
    return responseBuilder(HttpStatusCode.OK, res, null, null, true)
	} catch (err) {
    const error = errorHandler(err)
    logger.error({ msg: error.message, id: res.locals.reqId })
    return responseBuilder(error.status, res, error.message)
	}
}
