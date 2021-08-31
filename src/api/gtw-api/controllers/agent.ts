// Controller common imports
import { expressTypes, localsTypes } from '../../../types/index'
import { HttpStatusCode } from '../../../utils/http-status-codes'
import { logger } from '../../../utils/logger'
import { responseBuilder } from '../../../utils/response-builder'

// Controller specific imports
import { NodeModel } from '../../../persistance/node/model'
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
		logger.error(err.message)
		return responseBuilder(HttpStatusCode.INTERNAL_SERVER_ERROR, res, err)
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
		logger.error(err.message)
		return responseBuilder(HttpStatusCode.INTERNAL_SERVER_ERROR, res, err)
	}
}
