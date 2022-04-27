/**
 * Core functionality of COMMUNITIES
 */

// Imports
import { logger } from 'elastic-apm-node'
import { cs } from '../microservices/commServer'
import { errorHandler, MyError } from '../utils/error-handler'
import { CommunityModel } from '../persistance/community/model'
import { CommunityType, ICommunityCreate } from '../persistance/community/types'
import { NodeModel } from '../persistance/node/model'
import { OrganisationModel } from '../persistance/organisation/model'
import { HttpStatusCode } from '../utils'

// Functions

export const createOne = async (data: ICommunityCreate): Promise<void> => {
    try {
        // get my data for notifications and audits
        const community = await CommunityModel._createCommunity(data)
        if (data.type && data.type !== CommunityType.PARTNERSHIP) {
            for (const organisation of data.organisations) {
                if (organisation.nodes.length === 0) {
                    throw new MyError('You are trying to add company without nodes')
                }
            }
        }
       
        // create cs group (with name)
        if (data.type === CommunityType.PARTNERSHIP) {
            await cs.postGroup(community.commId, community.description)
        } else {
            await cs.postGroup(community.commId, community.name)
        }
        // forEach organisation and node
        for (const organisation of data.organisations) {
            for (const node of organisation.nodes) {
                // add commId to organisation model
                await NodeModel._addToCommunity(node, community.commId)
                // add node to cs group
                await cs.addUserToGroup(node, community.commId) 
            }
        }
        // TODO audit?
        // TODO notif?
    } catch (err) {
        const error = errorHandler(err)
        logger.error(error.message)
        throw error
    }
}

 export const removeOne = async (commId: string): Promise<void> => {
    try {
        // create cs group
        const community = await CommunityModel._getCommunity(commId)

        // forEach organisation and node
        for (const organisation of community.organisations) {
            for (const node of organisation.nodes) {
                // remove commId from organisation
                await NodeModel._removeFromCommunity(node, community.commId)
                // add node to cs group
                await cs.deleteUserFromGroup(node, community.commId) 
            }
        }
        await CommunityModel._removeCommunity(commId)
        await cs.deleteGroup(commId)
        // TODO audit?
        // TODO notif?
    } catch (err) {
        const error = errorHandler(err)
        logger.error(error.message)
        throw error
    }
}

export const addNode = async (commId: string, cid: string, agid: string): Promise<void> => {
    try {
        // test if community exists
        const organisations = await CommunityModel._getOrganisationsInCommunity(commId)
        const community = await CommunityModel._getCommunityUI(commId)

        // community to node
        await NodeModel._addToCommunity(agid, commId)
        if (!organisations.includes(cid)) {
            if (community.type && community.type === CommunityType.PARTNERSHIP) {
                throw new MyError('Partnerships are realtionships between two organisations. Please use community')
            }
            // organisation needs to be added
            // get org details
            const org = await OrganisationModel._getOrganisation(cid)
            // add org to community
            await CommunityModel._addOrganisationToCommunity(commId, { name: org.name, cid: org.cid })
        }

        // node to community
        await CommunityModel._addNodeToCommunity(commId, cid, agid)
       
        // node to cs group
        await cs.addUserToGroup(agid, commId) 

        // TODO audit?
        // TODO notif?
    } catch (err) {
        const error = errorHandler(err)
        logger.error(error.message)
        throw new MyError(error.message, HttpStatusCode.BAD_REQUEST)
    }
}

export const removeNode = async (commId: string, cid: string, agid: string): Promise<void> => {
    try {
        // test if community exists
        await CommunityModel._getCommunity(commId)
        // remove node
        await CommunityModel._removeNodeFromCommunity(commId, cid, agid)
        // remove community from node
        await NodeModel._removeFromCommunity(agid, commId)
        // remove Organisations without node
        // create cs group
        await cs.deleteUserFromGroup(agid, commId) 
        // remove org from community and remove comm if required
        await processCommunity(commId)
        // TODO audit?
        // TODO notif?
    } catch (err) {
        const error = errorHandler(err)
        logger.error(error.message)
        throw error
    }
}

export const removePartneship = async (cid1: string, cid2: string): Promise<void> => {
    try {
        // TODO audit?
        // TODO notif?
    } catch (err) {
        const error = errorHandler(err)
        logger.error(error.message)
        throw error
    }
}

// PRIVATE FUNCTIONS

const processCommunity = async(commId: string): Promise<void> => {
    await CommunityModel._removeOrgsWithoutNodes(commId)
    if ((await CommunityModel._getOrganisationsInCommunity(commId)).length === 0) {
        // remove community from MongoDB
        await CommunityModel._removeCommunity(commId)
        // remove cs group
        await cs.deleteGroup(commId)
    } 
}
