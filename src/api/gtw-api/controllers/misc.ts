// Controller common imports
import { expressTypes, localsTypes } from '../../../types/index'
import { HttpStatusCode } from '../../../utils/http-status-codes'
import { logger } from '../../../utils/logger'
import { responseBuilder } from '../../../utils/response-builder'

// Controller specific imports
import { IRecordCreate } from '../../../persistance/record/types'
import { NodeModel } from '../../../persistance/node/model'
import { RecordModel } from '../../../persistance/record/model'
import { errorHandler } from '../../../utils/error-handler'
import { signAppToken, verifyToken } from '../../../auth-server/auth-server'
import { AuroralUserType, JWTAURORALToken } from '../../../types/jwt-types'
import { ensureUserExistsinDLT } from '../../../core/dlt'

// Controllers

// Validate gateway login
type handshakeController = expressTypes.Controller<{}, {}, {}, string, localsTypes.ILocalsGtw>
 
export const handshake: handshakeController = async (_req, res) => {
  const { decoded } = res.locals
	try {
    // Update -> forbid anonymous access
    if (!decoded) {
      return responseBuilder(HttpStatusCode.UNAUTHORIZED, res, null, 'Gateway unauthorized access attempt')
    }
    const token = await signAppToken(decoded.agid, AuroralUserType.NODE)
    const response = {
      ...token,
      exp: ((await verifyToken(token.token)) as unknown as JWTAURORALToken).exp
    }
    await ensureUserExistsinDLT(`${decoded.agid}@auroral.node.eu`, decoded.cid, `${decoded.agid}@auroral.node.eu`)
    return responseBuilder(HttpStatusCode.OK, res, null, JSON.stringify(response))
	} catch (err) {
    const error = errorHandler(err)
    logger.error(error.message)
    return responseBuilder(error.status, res, error.message)
	}
}

// Receive the count of messages from the Gateway
type sendCountersController = expressTypes.Controller<{}, { records: IRecordCreate[] }, {}, null, localsTypes.ILocalsGtw>
 
export const sendCounters: sendCountersController = async (req, res) => {
  const { decoded } = res.locals
  const { records } = req.body
	try {
    if (decoded) {
      const agid = decoded.agid
      const cid = (await NodeModel._getNode(agid)).cid
      // Async creation of records
      records.forEach(async (it) => { 
        await RecordModel._createRecord({ ...it, requestType: getType(it.messageType), agid, cid }) 
      })
      logger.info('Gateway with id ' + agid + ' stored its counters')
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

// Aggregate gateway counters to display in UI
// Can be added as scheduled task
// TBD: Add scheduler and service to aggregate counters

// Receive the count of messages from the Gateway
type getCountersController = expressTypes.Controller<{}, {}, {}, null, localsTypes.ILocalsGtw>
 
export const getCounters: getCountersController = async (_req, res) => {
  const { decoded } = res.locals
	try {
    if (decoded) {
      const agid = decoded.agid
      // TBD: Parse query params
      // TBD: Get records ( aggregated records )
      // TBD: Define return type of the controller
      logger.info('Gateway with id ' + agid + ' retrieved its counter statistics')
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

// Private function

function getType(x: string): string {
  const actions = ['CANCELTASK', 'GETLISTOFACTIONS', 'GETTASKSTATUS', 'STARTACTION']
  const events = ['GETEVENTCHANNELSTATUS', 'GETLISTOFEVENTS', 'SUBSCRIBETOEVENTCHANNEL', 'UNSUBSCRIBEFROMEVENTCHANNEL', 'EVENTMESSAGE']
  const properties = ['GETLISTOFPROPERTIES', 'GETPROPERTYVALUE', 'SETPROPERTYVALUE']
  const agent = ['GETTHINGDESCRIPTION','SENDNOTIFICATION']
  if (actions.indexOf(x) !== -1) {
    return 'action' 
  }
  if (events.indexOf(x) !== -1) {
    return 'event' 
  }
  if (properties.indexOf(x) !== -1) {
   return 'property' 
  }
  if (agent.indexOf(x) !== -1) {
    return 'info' 
  }
  return 'unknown'
}
