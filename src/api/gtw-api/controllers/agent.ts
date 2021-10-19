// Controller common imports
import { expressTypes, localsTypes } from '../../../types/index'
import { HttpStatusCode } from '../../../utils/http-status-codes'
import { logger } from '../../../utils/logger'
import { responseBuilder } from '../../../utils/response-builder'
import { errorHandler } from '../../../utils/error-handler'

// Controller specific imports
import { NodeModel } from '../../../persistance/node/model'
import { OrganisationModel } from '../../../persistance/organisation/model'
import { RelationshipType } from '../../../types/misc-types'
import { NodeService } from '../../../core'

// Controllers

type deleteAgentController = expressTypes.Controller<{ agid: string }, {}, {}, null, localsTypes.ILocalsGtw>
 
export const deleteAgent: deleteAgentController = async (req, res) => {
  const { agid } = req.params
  const { decoded } = res.locals
	try {
    if (decoded) {
      // Validate that authorised to remove node
      const myAgid = decoded.iss
      if (agid !== myAgid) {
        throw new Error('You are not authorized to remove this agent ' + agid)
      }
      // Remove node
      await NodeService.removeOne(agid)
      logger.info('Gateway with id ' + agid + ' was removed')
      return responseBuilder(HttpStatusCode.OK, res, null, null)
    } else {
      logger.error('Gateway unauthorized access attempt')
      return responseBuilder(HttpStatusCode.UNAUTHORIZED, res, null, null)
    }
	} catch (err) {
    const error = errorHandler(err)
		logger.error(error.message)
		return responseBuilder(error.status, res, error.message)
	}
}

type getAgentItemsController = expressTypes.Controller<{ agid: string }, {}, {}, string[], localsTypes.ILocalsGtw>
 
export const getAgentItems: getAgentItemsController = async (req, res) => {
  const { agid } = req.params
  const { decoded } = res.locals
	try {
    if (decoded) {
      const myAgid = decoded.iss
      if (agid !== myAgid) {
        throw new Error('You are not authorized to access this agent ' + agid)
      }
      const data = (await NodeModel._getNode(agid)).hasItems
      return responseBuilder(HttpStatusCode.OK, res, null, data)
    } else {
      logger.error('Gateway unauthorized access attempt')
      return responseBuilder(HttpStatusCode.UNAUTHORIZED, res, null)
    }
	} catch (err) {
    const error = errorHandler(err)
		logger.error(error.message)
		return responseBuilder(error.status, res, error.message)
	}
}

type getAgentRelationship = expressTypes.Controller<{ agid: string }, {}, {}, RelationshipType, localsTypes.ILocalsGtw>
 
export const getRelationship: getAgentRelationship = async (req, res) => {
  const { agid } = req.params
  const { decoded } = res.locals
	try {
    if (decoded) {
      // get data from Mongo
      const myNodeCid = (await NodeModel._getNode(decoded.iss)).cid
      const reqNodeCid = (await NodeModel._getNode(agid)).cid
      const myOrg = await OrganisationModel._getOrganisation(myNodeCid)
      let relation = RelationshipType.OTHER
      // Search if my company node 
      if (myNodeCid === reqNodeCid) {
        relation = RelationshipType.ME
      } 
      // Search if friends node 
      if (myOrg.knows.includes(reqNodeCid)) {
        relation = RelationshipType.FRIEND 
      }
      return responseBuilder(HttpStatusCode.OK, res, null, relation)
    } else {
      logger.error('Gateway unauthorized access attempt')
      return responseBuilder(HttpStatusCode.UNAUTHORIZED, res, null)
    }
	} catch (err) {
    const error = errorHandler(err)
		logger.error(error.message)
		return responseBuilder(error.status, res, error.message)
	}
}
