/**
 * Core functionality of NODES
 */

// Imports
import { logger } from '../utils/logger'
import { cs } from '../microservices/commServer'
import { OrganisationModel } from '../persistance/organisation/model'
import { INodeCreatePost, NodeType } from '../persistance/node/types'
import { NodeModel } from '../persistance/node/model'
import { ItemService } from '../core'
import { errorHandler } from '../utils/error-handler'

// Constants
const PUBLIC_NODES = 'PUBLIC_NODES' // CS group for nodes

// Functions
export const createOne = async (cid: string, name: string, type: NodeType, password: string): Promise<string> => {
    try {
        const nodeData: INodeCreatePost = { name, type, cid }
        // Create node
        const node = await NodeModel._createNode(nodeData)
        // Add node to organisation
        await OrganisationModel._addNodeToCompany(cid, node.agid)
        // Create node user in CS
        await cs.postUser(node.agid, password)
        // Add to organisation group in commServer
        await cs.addUserToGroup(node.agid, cid)
        // Add to nodes group in commServer (Initially public)
        await cs.addUserToGroup(node.agid, PUBLIC_NODES)
        return node.agid
    } catch (err) {
        const error = errorHandler(err)
        logger.error(error.message)
        throw error
    }
}

/**
 * 
 * @param agid 
 * @param cid Optional: If present _getDoc will validate if agid belongs to organisation
 */
export const removeOne = async (agid: string, cid?: string): Promise<void> => {
    try {
        // Get Node
        const node = await NodeModel._getDoc(agid, cid)
        // Remove items under node
        node.hasItems.forEach(async it => {
            await ItemService.removeOne(it)
        })
        // Remove node from organisation
        await OrganisationModel._removeNodeFromCompany(node.cid, agid)
        // Remove node
        await node._removeNode()
        // Remove from nodes group in commServer (Initially public)
        await cs.deleteUserFromGroup(node.agid, PUBLIC_NODES)
        // Delete node user from CS
        await cs.deleteUser(node.agid)
    } catch (err) {
        const error = errorHandler(err)
        logger.error(error.message)
        throw error
    }
}
