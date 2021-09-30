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
import { UserModel } from '../../../persistance/user/model'
import { NotificationStatus, NotificationType } from '../../../persistance/notification/types'
import { ItemModel } from '../../../persistance/item/model'

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
    logger.error(error.message)
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
    let notifType = NotificationType.itemUpdatedByUser
    if (data.status) { 
      if (data.status === ItemStatus.DISABLED) {
        notifType = NotificationType.itemDisabled
      }
      if (data.status === ItemStatus.ENABLED) {
        notifType = NotificationType.itemEnabled
      }
    }
    await NotificationModel._createNotification({
      owner: decoded.org,
      actor: { id: decoded.org, name: myOrgName },
      target: { id: oid, name: myItemName },
      type: notifType,
      status: NotificationStatus.INFO
    })
    return responseBuilder(HttpStatusCode.OK, res, null, null, true)
	} catch (err) {
    const error = errorHandler(err)
    logger.error(error.message)
    return responseBuilder(error.status, res, error.message)
	}
}

type RemoveOneController = expressTypes.Controller<{ oid: string }, {}, {}, null, localsTypes.ILocals>
 
export const removeOne: RemoveOneController = async (req, res) => {
  const { oid } = req.params
  const { decoded } = res.locals
	try {
    await ItemService.removeOne(oid, decoded.uid)
    // Send notification to company
    const myOrgName = (await OrganisationModel._getOrganisation(decoded.org)).name
    const myItemName = (await ItemModel._getItem(oid)).name
    await NotificationModel._createNotification({
      owner: decoded.org,
      actor: { id: decoded.org, name: myOrgName },
      target: { id: oid, name: myItemName },
      type: NotificationType.itemRemoved,
      status: NotificationStatus.INFO
    })
    return responseBuilder(HttpStatusCode.OK, res, null, null, true)
	} catch (err) {
    const error = errorHandler(err)
    logger.error(error.message)
    return responseBuilder(error.status, res, error.message)
	}
}
