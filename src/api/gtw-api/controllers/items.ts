// Controller common imports
import { expressTypes, localsTypes } from '../../../types/index'
import { HttpStatusCode } from '../../../utils/http-status-codes'
import { logger } from '../../../utils/logger'
import { responseBuilder } from '../../../utils/response-builder'

// Controller specific imports
import { IItemCreate, IItemUpdate } from '../../../persistance/item/types'
import { NodeModel } from '../../../persistance/node/model'
import { ItemModel } from '../../../persistance/item/model'

// Controllers

type registrationController = expressTypes.Controller<{}, { thingDescriptions: IItemCreate[] }, {}, null, localsTypes.ILocalsGtw>
 
export const registration: registrationController = async (req, res) => {
  const { thingDescriptions } = req.body
  const { decoded } = res.locals
	try {
    if (decoded) {
      const agid = decoded.iss
      const cid = (await NodeModel._getNode(agid)).cid
      // Async registration of items
      thingDescriptions.forEach(async (it) => { 
        await ItemModel._createItem({ ...it, agid, cid }) 
        // TBD: Add to CS
        // TBD: Add notifications and audits
      })
      logger.info('Gateway with id ' + agid + ' registered items')
      return responseBuilder(HttpStatusCode.OK, res, null, null)
    } else {
      logger.error('Gateway unauthorized access attempt')
      return responseBuilder(HttpStatusCode.UNAUTHORIZED, res, null, null)
    }
	} catch (err) {
		logger.error(err.message)
		return responseBuilder(HttpStatusCode.INTERNAL_SERVER_ERROR, res, err)
	}
}

type neighbourhoodController = expressTypes.Controller<{ oid: string }, {}, {}, null, localsTypes.ILocalsGtw>
 
export const neighbourhood: neighbourhoodController = async (req, res) => {
  const { oid } = req.params
  const { decoded } = res.locals
	try {
    if (decoded) {
      // TBD: Retrieve from CS visible jids
      return responseBuilder(HttpStatusCode.OK, res, null, null)
    } else {
      logger.error('Gateway unauthorized access attempt')
      return responseBuilder(HttpStatusCode.UNAUTHORIZED, res, null, null)
    }
	} catch (err) {
		logger.error(err.message)
		return responseBuilder(HttpStatusCode.INTERNAL_SERVER_ERROR, res, err)
	}
}

type deleteItemsController = expressTypes.Controller<{}, { oids: string[] }, {}, null, localsTypes.ILocalsGtw>
 
export const deleteItems: deleteItemsController = async (req, res) => {
  const { oids } = req.body
  const { decoded } = res.locals
	try {
    if (decoded) {
      const agid = decoded.iss
      oids.forEach(async (it) => {
        try {
          const item = await ItemModel._getDoc(it)
          if (agid !== item.agid) {
            throw new Error('Cannot remove ' + it + ' because it does not belong to ' + agid)
          }
          await item._removeItem()
          // TBD: Remove oid from CS
          // TBD: Remove oid from user
          // TBD: Remove contracts
          // TBD: Audits and notifications
          logger.info(it + ' was removed from ' + agid)
        } catch (error) {
          logger.error(error)
        }
      })
      return responseBuilder(HttpStatusCode.OK, res, null, null)
    } else {
      logger.error('Gateway unauthorized access attempt')
      return responseBuilder(HttpStatusCode.UNAUTHORIZED, res, null, null)
    }
	} catch (err) {
		logger.error(err.message)
		return responseBuilder(HttpStatusCode.INTERNAL_SERVER_ERROR, res, err)
	}
}

type updateItemController = expressTypes.Controller<{}, { thingDescriptions: IItemUpdate[] }, {}, null, localsTypes.ILocalsGtw>
 
export const updateItem: updateItemController = async (req, res) => {
  const { thingDescriptions } = req.body
  const { decoded } = res.locals
	try {
    if (decoded) {
      const agid = decoded.iss
      thingDescriptions.forEach(async (it) => {
        try {
          const item = await ItemModel._getDoc(it.oid)
          if (agid !== item.agid) {
            throw new Error('Cannot update ' + it + ' because it does not belong to ' + agid)
          }
          await item._updateItem(it)
          // TBD: Update contracts if needed
          // TBD: Audits and notifications
          logger.info(it.oid + ' was updated')
        } catch (error) {
          logger.error(error)
        }
      })
      return responseBuilder(HttpStatusCode.OK, res, null, null)
    } else {
      logger.error('Gateway unauthorized access attempt')
      return responseBuilder(HttpStatusCode.UNAUTHORIZED, res, null, null)
    }
	} catch (err) {
		logger.error(err.message)
		return responseBuilder(HttpStatusCode.INTERNAL_SERVER_ERROR, res, err)
	}
}
