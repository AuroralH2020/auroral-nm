// Controller common imports
import { expressTypes, localsTypes } from '../../../types/index'
import { HttpStatusCode } from '../../../utils/http-status-codes'
import { logger } from '../../../utils/logger'
import { responseBuilder } from '../../../utils/response-builder'

// Controller specific imports
import { INodeCreate, INodeUI, INodeUpdate } from '../../../persistance/node/types'
import { NodeModel } from '../../../persistance/node/model'
import { OrganisationModel } from '../../../persistance/organisation/model'
import { NodeService } from '../../../core'

// Controllers

type getNodeController = expressTypes.Controller<{ agid: string }, {}, {}, INodeUI, localsTypes.ILocals>
 
export const getNode: getNodeController = async (req, res) => {
  const { agid } = req.params
  const { decoded } = res.locals
	try {
    // TBD: Validate that agid belongs to organisation
    const data = await NodeModel._getNode(agid, decoded.org)
    return responseBuilder(HttpStatusCode.OK, res, null, data)
	} catch (err) {
		logger.error(err.message)
		return responseBuilder(HttpStatusCode.INTERNAL_SERVER_ERROR, res, err)
	}
}

type getNodesController = expressTypes.Controller<{}, {}, {}, INodeUI[], localsTypes.ILocals>
 
export const getNodes: getNodesController = async (req, res) => {
  const { decoded } = res.locals
	try {
    const nodes = (await OrganisationModel._getOrganisation(decoded.org)).hasNodes
    const data = await NodeModel._getAllNodes(nodes)
    return responseBuilder(HttpStatusCode.OK, res, null, data)
	} catch (err) {
		logger.error(err.message)
		return responseBuilder(HttpStatusCode.INTERNAL_SERVER_ERROR, res, err)
	}
}

type postNodeController = expressTypes.Controller<{}, INodeCreate, {}, null, localsTypes.ILocals>
 
export const createNode: postNodeController = async (req, res) => {
  const { name, type, password } = req.body
  const { decoded } = res.locals
	try {
    await NodeService.createOne(decoded.org, name, type, password)
    return responseBuilder(HttpStatusCode.OK, res, null, null)
	} catch (err) {
		logger.error(err.message)
		return responseBuilder(HttpStatusCode.INTERNAL_SERVER_ERROR, res, err)
	}
}

type putNodeController = expressTypes.Controller<{ agid: string }, INodeUpdate, {}, null, localsTypes.ILocals>
 
export const updateNode: putNodeController = async (req, res) => {
  const data = req.body
  const { agid } = req.params
  const { decoded } = res.locals
	try {
    const node = await NodeModel._getDoc(agid, decoded.org)
    const updatedNode = await node._updateNode(data) 
    // TBD: Update node in commServer
    // TBD: Add notification
    // TBD: Add audit
    // TBD: Consider updating password too 
    return responseBuilder(HttpStatusCode.OK, res, null, null)
	} catch (err) {
		logger.error(err.message)
		return responseBuilder(HttpStatusCode.INTERNAL_SERVER_ERROR, res, err)
	}
}

type removeNodeController = expressTypes.Controller<{ agid: string }, {}, {}, null, localsTypes.ILocals>
 
export const removeNode: removeNodeController = async (req, res) => {
  const { agid } = req.params
  const { decoded } = res.locals
	try {
    await NodeService.removeOne(agid, decoded.org)
    return responseBuilder(HttpStatusCode.OK, res, null, null)
	} catch (err) {
		logger.error(err.message)
		return responseBuilder(HttpStatusCode.INTERNAL_SERVER_ERROR, res, err)
	}
}

type getKeyController = expressTypes.Controller<{ agid: string }, {}, {}, string | null, localsTypes.ILocals>
 
export const getKey: getKeyController = async (req, res) => {
  const { agid } = req.params
	try {
    const key = await NodeModel._getKey(agid)
    return responseBuilder(HttpStatusCode.OK, res, null, key)
	} catch (err) {
		logger.error(err.message)
		return responseBuilder(HttpStatusCode.INTERNAL_SERVER_ERROR, res, err)
	}
}

type removeKeyController = expressTypes.Controller<{ agid: string }, {}, {}, null, localsTypes.ILocals>
 
export const removeKey: removeKeyController = async (req, res) => {
  const { agid } = req.params
  const { decoded } = res.locals
	try {
    await NodeModel._removeKey(agid)
    return responseBuilder(HttpStatusCode.OK, res, null, null)
	} catch (err) {
		logger.error(err.message)
		return responseBuilder(HttpStatusCode.INTERNAL_SERVER_ERROR, res, err)
	}
}
