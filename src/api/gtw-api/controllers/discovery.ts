// Controller common imports
import { expressTypes, localsTypes } from '../../../types/index'
import { HttpStatusCode } from '../../../utils/http-status-codes'
import { logger } from '../../../utils/logger'
import { responseBuilder } from '../../../utils/response-builder'
import { errorHandler, MyError } from '../../../utils/error-handler'
import { CommunityModel } from '../../../persistance/community/model'
import { OrganisationModel } from '../../../persistance/organisation/model'
import { GtwItemInfo, GtwNodeInfo } from '../../../types/misc-types'
import { ContractModel } from '../../../persistance/contract/model'
import { ItemModel } from '../../../persistance/item/model'
import { NodeModel } from '../../../persistance/node/model'

// Controller specific imports

// Controllers

type getCommunitiesController = expressTypes.Controller<{}, {}, {}, { commId: string, name: string, description: string }[], localsTypes.ILocals>
 
export const getCommunities: getCommunitiesController = async (req, res) => {
	const { decoded } = res.locals
	try {
		if (decoded) {
			const communities = await CommunityModel._getCommunitiesByAgid(decoded.iss)
			return responseBuilder(HttpStatusCode.OK, res, null, communities)
		} else {
			logger.error('Gateway unauthorized access attempt')
			return responseBuilder(HttpStatusCode.UNAUTHORIZED, res, 'Gateway unauthorized access attempt')
		}
	} catch (err) {
		const error = errorHandler(err)
		logger.error(error.message)
		return responseBuilder(error.status, res, error.message)
	}
}

type getNodesInOrgController = expressTypes.Controller<{ cid: string }, {}, {}, GtwNodeInfo[], localsTypes.ILocals>
 
export const getNodesInOrganisation: getNodesInOrgController = async (req, res) => {
	const { decoded } = res.locals
	const { cid } = req.params
	try {
		if (decoded) {
			const myCid = (await NodeModel._getNode(decoded.iss)).cid
			const myOrg = await OrganisationModel._getOrganisation(myCid)
			if (!cid || cid === myCid) {
				const nodes = myOrg.hasNodes.map(node => {
					return { cid: myOrg.cid, agid: node, company: myOrg.name }
				})
				return responseBuilder(HttpStatusCode.OK, res, null, nodes)
			} else {
				let nodeInCommunity = false
				const partnership = await CommunityModel._getPartnershipByCids(myOrg.cid, cid)
				const nodes = []  as GtwNodeInfo[]
				partnership.organisations.forEach(org => {
					org.nodes.forEach((node) => {
						// requested org
						if (org.cid === cid) {
							nodes.push({ cid: org.cid, company: org.name, agid: node })
						}
						// test if my node is part of that 
						if (node === decoded.iss) {
							nodeInCommunity = true
						}
					})
				})
				if (!nodeInCommunity) {
					return responseBuilder(HttpStatusCode.OK, res, null, [] as GtwNodeInfo[])
				}
				return responseBuilder(HttpStatusCode.OK, res, null, nodes)
			}
		} else {
			logger.error('Gateway unauthorized access attempt')
			return responseBuilder(HttpStatusCode.UNAUTHORIZED, res, 'Gateway unauthorized access attempt')
		}
	} catch (err) {
		const error = errorHandler(err)
		logger.error(error.message)
		return responseBuilder(error.status, res, error.message)
	}
}

type getNodesInCommunityController = expressTypes.Controller<{ commId: string }, {}, {}, GtwNodeInfo[], localsTypes.ILocals>
 
export const getNodesInCommunity: getNodesInCommunityController = async (req, res) => {
	const { decoded } = res.locals
	const { commId } = req.params
	try {
		if (decoded) {
			if (!commId) {
				return responseBuilder(HttpStatusCode.BAD_REQUEST, res, 'CommID not provided')
			}
			const myCid = (await NodeModel._getNode(decoded.iss)).cid
			const community = await CommunityModel._getCommunity(commId)
			const nodes = [] as GtwNodeInfo[]
			let nodeInCommunity = false
			community.organisations.forEach((org) => {
				org.nodes.forEach((node) => {
					if (node === decoded.iss) {
						nodeInCommunity = true
					}
					nodes.push({ company: org.name, cid: org.cid, agid: node })
				}) 
			})
			if (!nodeInCommunity) {
				return responseBuilder(HttpStatusCode.OK, res, null, [] as GtwNodeInfo[])
			}
			return responseBuilder(HttpStatusCode.OK, res, null, nodes)
		} else {
			logger.error('Gateway unauthorized access attempt')
			return responseBuilder(HttpStatusCode.UNAUTHORIZED, res, 'Gateway unauthorized access attempt')
		}
	} catch (err) {
		const error = errorHandler(err)
		logger.error(error.message)
		return responseBuilder(error.status, res, error.message)
	}
}

type getItemsInOrganisationController = expressTypes.Controller<{  }, {}, {}, GtwItemInfo[], localsTypes.ILocals>
 
export const getItemsInOrganisation: getItemsInOrganisationController = async (req, res) => {
	const { decoded } = res.locals
	try {
		if (decoded) {
			const myCid = (await NodeModel._getNode(decoded.iss)).cid
			const organisation = await OrganisationModel._getOrganisation(myCid)
			const items =  (await ItemModel._getAllCompanyItems(myCid)).map((item) => {
				return { ...item, company: organisation.name }
			})
			return responseBuilder(HttpStatusCode.OK, res, null, items)
		} else {
			logger.error('Gateway unauthorized access attempt')
			return responseBuilder(HttpStatusCode.UNAUTHORIZED, res, 'Gateway unauthorized access attempt')
		}
	} catch (err) {
		const error = errorHandler(err)
		logger.error(error.message)
		return responseBuilder(error.status, res, error.message)
	}
}

type getItemsInContractController = expressTypes.Controller<{ ctid: string }, {}, {}, GtwItemInfo[], localsTypes.ILocals>
 
export const getItemsInContract: getItemsInContractController = async (req, res) => {
	const { decoded } = res.locals
	const { ctid } = req.params
	try {
		if (decoded) {
			if (!ctid) {
				return responseBuilder(HttpStatusCode.BAD_REQUEST, res, 'ctid not provided')
			}
			const myCid = (await NodeModel._getNode(decoded.iss)).cid
			const contract = await ContractModel._getContract(ctid)
			if (!contract.organisations.includes(myCid)) {
				return responseBuilder(HttpStatusCode.OK, res, null, [] as GtwItemInfo[])
			}
			const items =  await ContractModel._getContractItemsGtw(ctid)
			return responseBuilder(HttpStatusCode.OK, res, null, items)
		} else {
			logger.error('Gateway unauthorized access attempt')
			return responseBuilder(HttpStatusCode.UNAUTHORIZED, res, 'Gateway unauthorized access attempt')
		}
	} catch (err) {
		const error = errorHandler(err)
		logger.error(error.message)
		return responseBuilder(error.status, res, error.message)
	}
}
