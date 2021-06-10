// Controller common imports
import { expressTypes, localsTypes } from '../../../types/index'
import { HttpStatusCode } from '../../../utils/http-status-codes'
import { logger } from '../../../utils/logger'
import { responseBuilder } from '../../../utils/response-builder'

// Controller specific imports

// Controllers

type deleteAgentController = expressTypes.Controller<{ agid: string }, {}, {}, null, localsTypes.ILocalsGtw>
 
export const deleteAgent: deleteAgentController = async (req, res) => {
  const { agid } = req.params
  const { decoded } = res.locals
	try {
    if (decoded) {
      const myAgid = decoded.iss
      if (agid !== myAgid) {
        throw new Error('You are not authorized to remove this agent ' + agid)
      }
      // TBD: Remove agent
      // TBD: Remove agent from CS
      // TBD: Remove OIDS under agent --> Update contracts accordingly
      // TBD: Remove agent from organisation
      // TBD: Send notifications and audits
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
