// Controller common imports
import { expressTypes, localsTypes } from '../../../types/index'
import { HttpStatusCode } from '../../../utils/http-status-codes'
import { logger } from '../../../utils/logger'
import { responseBuilder } from '../../../utils/response-builder'
import { errorHandler } from '../../../utils/error-handler'

// Controller specific imports
import { cs } from '../../../microservices/commServer'
import { IItemCreate, IItemUpdate } from '../../../persistance/item/types'
import { NodeModel } from '../../../persistance/node/model'
import { ItemModel } from '../../../persistance/item/model'
import { ItemService } from '../../../core'
import { csUserRoster } from '../../../types/cs-types'
import { Config } from '../../../config'
import { OrganisationModel } from '../../../persistance/organisation/model'
import { NotificationModel } from '../../../persistance/notification/model'
import { UserModel } from '../../../persistance/user/model'
import { NotificationStatus, NotificationType } from '../../../persistance/notification/types'

// Types

type registrationResponse = {
  name: string
  oid: string
  password: string | null
  error?: boolean
}

// Controllers

type registrationController = expressTypes.Controller<{}, { agid: string, items: IItemCreate[] }, {}, registrationResponse[], localsTypes.ILocalsGtw>

export const registration: registrationController = async (req, res) => {
  // const { agid, thingDescriptions } = req.body
  const { decoded } = res.locals
	try {
    logger.debug('Registering items in node: ' + req.body.agid)
    const response: registrationResponse[] = []
    if (!decoded && Config.NODE_ENV === 'production') {
        logger.error('Gateway unauthorized access attempt')
        return responseBuilder(HttpStatusCode.UNAUTHORIZED, res, null, response)
    } else {
        if (!decoded) {
          logger.warn('Gateway anonymous access, it will be forbidden in production...')
        }
        const agid = decoded ? decoded.iss : req.body.agid
        const cid = (await NodeModel._getNode(agid)).cid
        // Async registration of items
        await Promise.all(req.body.items.map(async (it): Promise<boolean> => {
          try {
            // Create item
            const password = await ItemService.createOne(it, agid, cid)
            // Create response
            response.push({ name: it.name, oid: it.oid, password })
            // Create Notification
            const myOrgName = (await OrganisationModel._getOrganisation(cid)).name
            await NotificationModel._createNotification({
              owner: cid,
              actor: { id: cid, name: myOrgName },
              target: { id: it.oid, name: it.name },
              type: NotificationType.itemDiscovered,
              status: NotificationStatus.INFO
            })
            return true
          } catch (error) {
            // Create response
            response.push({ name: it.name, oid: it.oid, password: null, error: true })
            return false
          }
        }))
        logger.info('Gateway with id ' + agid + ' registered items')
        return responseBuilder(HttpStatusCode.OK, res, null, response)
    }
	} catch (err) {
    const error = errorHandler(err)
    logger.error(error.message)
    return responseBuilder(error.status, res, error.message)
	}
}

type neighbourhoodController = expressTypes.Controller<{ oid: string }, {}, {}, csUserRoster | undefined, localsTypes.ILocalsGtw>
 
export const neighbourhood: neighbourhoodController = async (req, res) => {
  const { oid } = req.params
  const { decoded } = res.locals
    try {
        if (!decoded && Config.NODE_ENV === 'production') {
            logger.error('Gateway unauthorized access attempt')
            return responseBuilder(HttpStatusCode.UNAUTHORIZED, res, null)
        } else {
            if (!decoded) {
              logger.warn('Gateway anonymous access, it will be forbidden in production...')
            }
            const neighbours = await cs.getUserRoster(oid)
            return responseBuilder(HttpStatusCode.OK, res, null, neighbours)
        }
	} catch (err) {
    const error = errorHandler(err)
    logger.error(error.message)
    return responseBuilder(error.status, res, error.message)
	}
}

type deleteItemsController = expressTypes.Controller<{}, { agid: string, oids: string[] }, {}, null, localsTypes.ILocalsGtw>
 
export const deleteItems: deleteItemsController = async (req, res) => {
  const { oids } = req.body
  const { decoded } = res.locals
	try {
      if (!decoded && Config.NODE_ENV === 'production') {
          logger.error('Gateway unauthorized access attempt')
          return responseBuilder(HttpStatusCode.UNAUTHORIZED, res, null)
      } else {
        if (!decoded) {
          logger.warn('Gateway anonymous access, it will be forbidden in production...')
        }
        const agid = decoded ? decoded.iss : req.body.agid
        oids.forEach(async (it) => {
          try {
            await ItemService.removeOne(it, agid)
            // Create Notification
            const myItem = (await ItemModel._getItem(it))
            const myOrg = (await OrganisationModel._getOrganisation(myItem.cid))
            await NotificationModel._createNotification({
              owner: myOrg.cid,
              actor: { id: myOrg.cid, name: myOrg.name },
              target: { id: myItem.oid, name: myItem.name },
              type: NotificationType.itemRemoved,
              status: NotificationStatus.INFO
            })
            logger.info(it + ' was removed from ' + agid)
          } catch (error) {
            const e = errorHandler(error)
            logger.error(e.message)
          }
        })
        return responseBuilder(HttpStatusCode.OK, res, null, null)
    }
	} catch (err) {
    const error = errorHandler(err)
    logger.error(error.message)
    return responseBuilder(error.status, res, error.message)
	}
}

type updateItemController = expressTypes.Controller<{}, { agid: string, thingDescriptions: IItemUpdate[] }, {}, null, localsTypes.ILocalsGtw>
 
export const updateItem: updateItemController = async (req, res) => {
  const { thingDescriptions } = req.body
  const { decoded } = res.locals
	try {
      if (!decoded && Config.NODE_ENV === 'production') {
          logger.error('Gateway unauthorized access attempt')
          return responseBuilder(HttpStatusCode.UNAUTHORIZED, res, null)
      } else {
          if (!decoded) {
            logger.warn('Gateway anonymous access, it will be forbidden in production...')
          }
          const agid = decoded ? decoded.iss : req.body.agid
            thingDescriptions.forEach(async (it) => {
              try {
                if (it.oid) {
                  const item = await ItemModel._getDoc(it.oid)
                  if (agid !== item.agid) {
                    throw new Error('Cannot update ' + it + ' because it does not belong to ' + agid)
                  }
                  await item._updateItem(it)
                  // Create Notification
                  const myOrg = (await OrganisationModel._getOrganisation(item.cid))
                  await NotificationModel._createNotification({
                    owner: myOrg.cid,
                    actor: { id: myOrg.cid, name: myOrg.name },
                    target: { id: item.oid, name: item.name },
                    type: NotificationType.itemUpdatedByNode,
                    status: NotificationStatus.INFO
                  })
                }
                // TBD: Update contracts if needed
                // TBD: Audits and notifications
                logger.info(it.oid + ' was updated')
              } catch (error) {
                const e = errorHandler(error)
                logger.error(e.message)
              }
            })
            return responseBuilder(HttpStatusCode.OK, res, null, null)
        }
	} catch (err) {
    const error = errorHandler(err)
    logger.error(error.message)
    return responseBuilder(error.status, res, error.message)
	}
}
