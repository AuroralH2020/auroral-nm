// Controller common imports
import { Config } from '../../../config'
import { expressTypes, localsTypes } from '../../../types/index'
import { HttpStatusCode } from '../../../utils/http-status-codes'
import { logger } from '../../../utils/logger'
import { responseBuilder } from '../../../utils/response-builder'
import { errorHandler, MyError } from '../../../utils/error-handler'

// Controller specific imports
import { NodeModel } from '../../../persistance/node/model'
import { IItemPrivacy } from '../../../persistance/item/types'
import { OrganisationModel } from '../../../persistance/organisation/model'
import { OrgGatewayType } from '../../../persistance/organisation/types'
import { ItemModel } from '../../../persistance/item/model'
import { RelationshipType } from '../../../types/misc-types'
import { NodeService } from '../../../core'
import { ContractModel } from '../../../persistance/contract/model'
import { agentContractType } from '../../../persistance/contract/types'

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

type getPartnerController = expressTypes.Controller<{ cid: string }, {}, {}, OrgGatewayType, localsTypes.ILocalsGtw>
// returns name and nodes AGIDs for given CID 
export const getPartner: getPartnerController = async (req, res) => {
  const { cid } = req.params
  const { decoded } = res.locals
  try {
    if (decoded) {
      const myCid = (await NodeModel._getNode(decoded.iss)).cid
      const knows = (await OrganisationModel._getOrganisation(myCid)).knows
      if (!(cid in knows)) {
        return responseBuilder(HttpStatusCode.UNAUTHORIZED, res, 'You are not allowed to access this partner')
      }
      const org = await OrganisationModel._getOrganisation(cid)
      return responseBuilder(HttpStatusCode.OK, res, null, { nodes: org.hasNodes, name: org.name })
    } else {
      logger.error('Gateway unauthorized access attempt')
      return responseBuilder(HttpStatusCode.UNAUTHORIZED, res, null)
    }
  } catch (err) {
    const error = errorHandler(err)
    logger.error(error.message)
    return responseBuilder(error.status, res, 'Not valid CID')
  }
}

type getPartnersController = expressTypes.Controller<{}, {}, {}, [string], localsTypes.ILocalsGtw>
// returns nodes organisation knows array 
export const getPartners: getPartnersController = async (_req, res) => {
  const { decoded } = res.locals
  try {
    if (decoded) {
      // get data from Mongo
      const cid = (await NodeModel._getNode(decoded.iss)).cid
      const knows = (await OrganisationModel._getOrganisation(cid)).knows
      return responseBuilder(HttpStatusCode.OK, res, null, knows)
    } else {
      logger.error('Gateway unauthorized access attempt')
      return responseBuilder(HttpStatusCode.UNAUTHORIZED, res, null)
    }
  } catch (err) {
    const error = errorHandler(err)
    logger.error(error.message)
    return responseBuilder(error.status, res, 'Organisation does not exists')
  }
}

type getCidController = expressTypes.Controller<{ reqid: string }, {}, {}, string, localsTypes.ILocalsGtw>
// returns CID for given OID or AGID
export const getCid: getCidController = async (req, res) => {
  const { reqid } = req.params
  const { decoded } = res.locals
  try {
    if (decoded) {
      // get data from Mongo
      let reqNodeCid
      try {
        // test id reqid is agid
        reqNodeCid = (await NodeModel._getNode(reqid)).cid
      } catch (err: unknown) {
        // test id reqid is oid
        reqNodeCid = (await ItemModel._getItem(reqid)).cid
      }
      return responseBuilder(HttpStatusCode.OK, res, null, reqNodeCid)
    } else {
      logger.error('Gateway unauthorized access attempt')
      return responseBuilder(HttpStatusCode.UNAUTHORIZED, res, null)
    }
  } catch (err) {
    const error = errorHandler(err)
    logger.error(error.message)
    return responseBuilder(error.status, res, 'Not valid AGID or OID')
  }
}

type getAgentRelationship = expressTypes.Controller<{ reqid: string }, {}, {}, RelationshipType, localsTypes.ILocalsGtw>

export const getRelationship: getAgentRelationship = async (req, res) => {
  const { reqid } = req.params
  const { decoded } = res.locals
  try {
    if (decoded) {
      // get data from Mongo
      let reqNodeCid
      try {
        // test id reqid is agid
        reqNodeCid = (await NodeModel._getNode(reqid)).cid
      } catch (err: unknown) {
        // test id reqid is oid
        reqNodeCid = (await ItemModel._getItem(reqid)).cid
      }
      const myNodeCid = (await NodeModel._getNode(decoded.iss)).cid
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
    return responseBuilder(error.status, res, 'Not valid AGID or OID')
  }
}

type getAgentPrivacy = expressTypes.Controller<{}, {}, {}, IItemPrivacy[], localsTypes.ILocalsGtw>

export const getPrivacy: getAgentPrivacy = async (_req, res) => {
  const { decoded } = res.locals
	try {
    if (decoded) {
      const myNode = (await NodeModel._getNode(decoded.iss))
      const answer = await ItemModel._getItemsPrivacy(myNode.hasItems)
      return responseBuilder(HttpStatusCode.OK, res, null, answer)
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

type getContractedItemsByCidCtrl = expressTypes.Controller<{cid: string }, {}, {}, agentContractType, localsTypes.ILocalsGtw>

export const getContractedItemsByCid: getContractedItemsByCidCtrl = async (req, res) => {
  const { decoded } = res.locals
  const { cid } = req.params
  try {
    if (decoded) {
      const myAgid = decoded.iss
      const node = await NodeModel._getNode(decoded.iss)
      const commonContract = await ContractModel._getCommonPrivateContracts(cid, node.cid)
      if (commonContract.length === 0) {
        // any contract between these companies
        const response : agentContractType = { cid, ctid: null, items: [] }
        return responseBuilder(HttpStatusCode.OK, res, null, response)
      }
      const agentItems = await ContractModel._getItemsInContractByAgid(commonContract[0].ctid, myAgid)
      if (agentItems.length > 0) {
        // return found values
        return responseBuilder(HttpStatusCode.OK, res, null, agentItems[0])
      } else {
        // return empty answer - any affected in contract
        const response : agentContractType = { cid, ctid: commonContract[0].ctid, items: [] }
        return responseBuilder(HttpStatusCode.OK, res, null, response)
      }
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

type getAgentPubkeyCtrl = expressTypes.Controller<{ agid: string }, {}, {}, string, localsTypes.ILocalsGtw>

export const getAgentPubkey: getAgentPubkeyCtrl = async (req, res) => {
  const { agid } = req.params
  const { decoded } = res.locals
  try {
    if (!decoded && Config.NODE_ENV === 'production') {
      logger.warn({ msg: 'Gateway unauthorized access attempt', id: res.locals.reqId })
      return responseBuilder(HttpStatusCode.UNAUTHORIZED, res, null)
    } 

    const node = await NodeModel._getDoc(agid)
    if (!node.hasKey) {
      throw new MyError('No public key found for this agent', HttpStatusCode.NOT_FOUND)
    }
    return responseBuilder(HttpStatusCode.OK, res, null, node.key)
  } catch (err) {
    const error = errorHandler(err)
    logger.error(error.message)
    return responseBuilder(error.status, res, error.message)
  }
}
