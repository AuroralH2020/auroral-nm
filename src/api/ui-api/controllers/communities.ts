// Controller common imports
import { CommunityModel } from '../../../persistance/community/model'
import { CommunityType, ICommunity, ICommunityCreate, ICommunityUIList } from '../../../persistance/community/types'
import { expressTypes, localsTypes } from '../../../types/index'
import { HttpStatusCode, logger, responseBuilder } from '../../../utils'
import { errorHandler, MyError } from '../../../utils/error-handler'
import { CommunityService } from '../../../core'
import { OrganisationModel } from '../../../persistance/organisation/model'
import { ItemDomainType } from '../../../persistance/item/types'

// Controller specific imports

// Controllers

type getCommunityController = expressTypes.Controller<{ commId: string }, {}, {}, ICommunity, localsTypes.ILocals>

export const getCommunity: getCommunityController = async (req, res) => {
    const { commId } = req.params 
    try {
        // Get community
        const community = await CommunityModel._getCommunityUI(commId)
        // Test if org participates ???
        return responseBuilder(HttpStatusCode.OK, res, null, community)
    } catch (err) {
        const error = errorHandler(err)
        logger.error({ msg: error.message, id: res.locals.reqId })
        return responseBuilder(error.status, res, error.message)
    }
}

type getCommunitiesController = expressTypes.Controller<{}, {}, { type?: CommunityType, offset: number, domain: ItemDomainType }, ICommunityUIList[], localsTypes.ILocals>

export const getCommunities: getCommunitiesController = async (req, res) => {
    const { decoded } = res.locals
    const { type, offset, domain } = req.query
    try {
        const communities = await CommunityModel._getAllCommunitiesUI(type ? type : CommunityType.COMMUNITY,  offset ? offset : 0, domain, decoded.org)
        return responseBuilder(HttpStatusCode.OK, res, null, communities)
    } catch (err) {
        const error = errorHandler(err)
        logger.error({ msg: error.message, id: res.locals.reqId })
        return responseBuilder(error.status, res, error.message)
    }
}

type postCommunityController = expressTypes.Controller<{}, { nodes: string[], name: string, description?: string, domain: ItemDomainType }, {}, null, localsTypes.ILocals>

export const createCommunity: postCommunityController = async (req, res) => {
    const { nodes, name, description, domain } = req.body
    const { decoded } = res.locals
    try {
        const org = await OrganisationModel._getOrganisation(decoded.org)
        // test if some nodes are included
        if (!nodes || nodes.length === 0) {
            throw new MyError('Please include at least one node', HttpStatusCode.BAD_REQUEST)
        }
        // test if including only my nodes
        nodes.forEach(node => {
            if (!org.hasNodes.includes(node)) {
                throw new MyError('Node [' + node + '] is not registered under your company', HttpStatusCode.BAD_REQUEST)
            }
        })
        const data = {
            name,
            description,
            organisations: [{
                cid: org.cid,
                name: org.name,
                nodes
            }],
            domain,
            type: CommunityType.COMMUNITY,
        } as ICommunityCreate
        await CommunityService.createOne(data)
        return responseBuilder(HttpStatusCode.CREATED, res, null, null)
    } catch (err) {
        const error = errorHandler(err)
        logger.error({ msg: error.message, id: res.locals.reqId })
        return responseBuilder(error.status, res, error.message)
    }
}

type addNodeToCommunityController = expressTypes.Controller<{commId: string, agid: string}, {}, {}, null, localsTypes.ILocals>

export const addNodeToCommunity: addNodeToCommunityController = async (req, res) => {
    const { commId, agid } = req.params
    const { decoded } = res.locals
    try {
        const org = await OrganisationModel._getOrganisation(decoded.org)
        if (!org.hasNodes.includes(agid)) {
            throw new MyError('Node [' + agid + '] is not registered under your company', HttpStatusCode.BAD_REQUEST)
        }
        await CommunityService.addNode(commId, org.cid, agid)
        return responseBuilder(HttpStatusCode.CREATED, res, null, null)
    } catch (err) {
        const error = errorHandler(err)
        logger.error({ msg: error.message, id: res.locals.reqId })
        return responseBuilder(error.status, res, error.message)
    }
}

type removeNodeFromCommunityController = expressTypes.Controller<{commId: string, agid: string}, {}, {}, null, localsTypes.ILocals>

export const removeNodeFromCommunity: removeNodeFromCommunityController = async (req, res) => {
    const { commId, agid } = req.params
    const { decoded } = res.locals
    try {
        const org = await OrganisationModel._getOrganisation(decoded.org)
        if (!org.hasNodes.includes(agid)) {
            throw new MyError('Node [' + agid + '] is not registered under your company', HttpStatusCode.BAD_REQUEST)
        }
        await CommunityService.removeNode(commId, org.cid, agid)
        return responseBuilder(HttpStatusCode.OK, res, null, null)
    } catch (err) {
        const error = errorHandler(err)
        logger.error({ msg: error.message, id: res.locals.reqId })
        return responseBuilder(error.status, res, error.message)
    }
}

