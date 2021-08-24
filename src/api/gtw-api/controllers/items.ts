// Controller common imports
import * as crypto from 'crypto'
import { expressTypes, localsTypes } from '../../../types/index'
import { HttpStatusCode } from '../../../utils/http-status-codes'
import { logger } from '../../../utils/logger'
import { responseBuilder } from '../../../utils/response-builder'

// Controller specific imports
import { cs } from '../../../microservices/commServer'
import { IItemCreate, IItemUpdate } from '../../../persistance/item/types'
import { NodeModel } from '../../../persistance/node/model'
import { ItemModel } from '../../../persistance/item/model'

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
    if (decoded) {
      const agid = decoded.iss ? decoded.iss : req.body.agid
      const cid = (await NodeModel._getNode(agid)).cid
      // Async registration of items
      await Promise.all(req.body.items.map(async (it): Promise<boolean> => {
        try {
          // Add item to Mongo
          await ItemModel._createItem({ ...it, agid, cid }) 
          // Create password for CS
          const password: string = crypto.randomBytes(8).toString('base64')
          // Add to CS
          await cs.postUser(it.oid, password)
          // Add to agent
          await NodeModel._addItemToNode(agid, it.oid)
          // TBD: Add notifications and audits
          // Create response
          response.push({ name: it.name, oid: it.oid, password })
          return true
        } catch (error) {
          // Create response
          response.push({ name: it.name, oid: it.oid, password: null, error: true })
          return false
        }
      }))
      logger.info('Gateway with id ' + agid + ' registered items')
      return responseBuilder(HttpStatusCode.OK, res, null, response)
    } else {
      logger.error('Gateway unauthorized access attempt')
      return responseBuilder(HttpStatusCode.UNAUTHORIZED, res, null, response)
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
          // Remove item from mongo
          await item._removeItem()
          // Remove oid from CS
          await cs.deleteUser(it)
          // Remove oid from agent
          await NodeModel._removeItemFromNode(agid, it)
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
