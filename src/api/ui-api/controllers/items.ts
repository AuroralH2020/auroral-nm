// Controller common imports
import { expressTypes, localsTypes } from '../../../types/index'
import { HttpStatusCode } from '../../../utils/http-status-codes'
import { logger } from '../../../utils/logger'
import { responseBuilder } from '../../../utils/response-builder'
import { errorHandler } from '../../../utils/error-handler'

// Controller specific imports
import { ItemService } from '../../../core'
import { IItemUI, IItemUpdate, ItemStatus, ItemType, ItemPrivacy, GetByOwnerQuery, ItemDomainType } from '../../../persistance/item/types'
import { OrganisationModel } from '../../../persistance/organisation/model'
import { NotificationModel } from '../../../persistance/notification/model'
import { AuditModel } from '../../../persistance/audit/model'
import { UserModel } from '../../../persistance/user/model'
import { NotificationStatus } from '../../../persistance/notification/types'
import { ItemModel } from '../../../persistance/item/model'
import { ResultStatusType, EventType } from '../../../types/misc-types'
import { ContractModel } from '../../../persistance/contract/model'

// Controllers

type getManyController = expressTypes.Controller<{}, {}, { type: ItemType, domain: ItemDomainType,  offset: number, filter: number }, IItemUI[], localsTypes.ILocals>
 
export const getMany: getManyController = async (req, res) => {
  const { type, offset, filter, domain } = req.query
  const { decoded } = res.locals
	try {
      const data = await ItemService.getMany(decoded.cid, type, offset, filter, domain)
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
    const data = await ItemService.getOne(decoded.cid, oid)
    const contract = await  ContractModel._getCommonPrivateContracts(decoded.cid, data.cid)
    if (contract.length > 0) {
      // there is common contract
      if (data.hasContracts.includes(contract[0].ctid)) {
        data.contract = {
          ctid: contract[0].ctid,
          contracted: true,
          contractable: false
        }
      } else {
        data.contract = {
          ctid: contract[0].ctid,
          contracted: false,
          contractable: true
        }
      }
    }
    return responseBuilder(HttpStatusCode.OK, res, null, data)
	} catch (err) {
    const error = errorHandler(err)
    return responseBuilder(error.status, res, error.message)
	}
}

type getByCompanyController = expressTypes.Controller<{ cid: string }, {}, { type: ItemType, offset: number }, IItemUI[], localsTypes.ILocals>
 
export const getByCompany: getByCompanyController = async (req, res) => {
  const { cid } = req.params
  const { type, offset } = req.query
  const { decoded } = res.locals
  try {
    const reqParam: GetByOwnerQuery = {
      cid,
      type,
      status: ItemStatus.ENABLED
    }
    const foreignOrg = (await OrganisationModel._getOrganisation(cid))
    if (foreignOrg.knows.includes(decoded.cid)) {
      // We are friends
      reqParam.$or = [{ accessLevel: ItemPrivacy.FOR_FRIENDS }, { accessLevel: ItemPrivacy.PUBLIC }]
    } else if (cid === decoded.cid) {
      // My org
      reqParam.status = { $ne: ItemStatus.DELETED }
    } else {
      // Foreign company 
      reqParam.$or = [{ accessLevel: ItemPrivacy.PUBLIC }]
    }
    const data = await ItemModel._getByOwner(reqParam, Number(offset))
      return responseBuilder(HttpStatusCode.OK, res, null, data)
  } catch (err) {
    const error = errorHandler(err)
    logger.error({ msg: error.message, id: res.locals.reqId })
    return responseBuilder(error.status, res, error.message)
  }
}

type GetByUserController = expressTypes.Controller<{ uid: string }, {}, { type: ItemType, offset: number }, IItemUI[], localsTypes.ILocals>

export const getByUser: GetByUserController = async (req, res) => {
  const { uid } = req.params
  const { type, offset } = req.query
  const { decoded } = res.locals
  try {
    const reqUser = (await UserModel._getUser(uid))
    const reqParam: GetByOwnerQuery = {
      cid: reqUser.cid,
      uid,
      status: ItemStatus.ENABLED,
      type,
    }
    const foreignOrg = (await OrganisationModel._getOrganisation(reqUser.cid))
    if (foreignOrg.knows.includes(decoded.cid)) {
      // We are friends
      reqParam.$or = [{ accessLevel: ItemPrivacy.FOR_FRIENDS }, { accessLevel: ItemPrivacy.PUBLIC }]
    } else if (reqUser.cid === decoded.cid) {
      // My org
      reqParam.status = { $ne: ItemStatus.DELETED }
    } else {
      // Foreign company 
      reqParam.$or = [{ accessLevel: ItemPrivacy.PUBLIC }]
    }
    const data = await ItemModel._getByOwner(reqParam, Number(offset))
    return responseBuilder(HttpStatusCode.OK, res, null, data)
  } catch (err) {
    const error = errorHandler(err)
    logger.error({ msg: error.message, id: res.locals.reqId })
    return responseBuilder(error.status, res, error.message)
  }
}

type UpdateOneController = expressTypes.Controller<{ oid: string }, IItemUpdate, {}, null, localsTypes.ILocals>
 
export const updateOne: UpdateOneController = async (req, res) => {
  const { oid } = req.params
  const data = req.body
  const { decoded } = res.locals
	try {
    await ItemService.updateOne(oid, data, decoded.sub)
    // Send notification to company
    const myOrgName = (await OrganisationModel._getOrganisation(decoded.cid)).name
    const myItemName = (await ItemModel._getItem(oid)).name
    const myUserName = (await UserModel._getUser(decoded.sub)).name
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
      owner: decoded.cid,
      actor: { id: decoded.cid, name: myOrgName },
      target: { id: oid, name: myItemName },
      type: eventType,
      status: NotificationStatus.INFO
    })
    // Audit
    await AuditModel._createAudit({
      ...res.locals.audit,
      actor: { id: decoded.sub, name: myUserName },
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
    const myOrgName = (await OrganisationModel._getOrganisation(decoded.cid)).name
    const myItemName = (await ItemModel._getItem(oid)).name
    const myUserName = (await UserModel._getUser(decoded.sub)).name
    await ItemService.removeOne(oid, decoded.sub)
    // Notification
    await NotificationModel._createNotification({
      owner: decoded.cid,
      actor: { id: decoded.cid, name: myOrgName },
      target: { id: oid, name: myItemName },
      type: EventType.itemRemoved,
      status: NotificationStatus.INFO
    })
    // Audit
    await AuditModel._createAudit({
      ...res.locals.audit,
      actor: { id: decoded.sub, name: myUserName },
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
