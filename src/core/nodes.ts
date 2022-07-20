/**
 * Core functionality of NODES
 */

// Imports
import { logger } from '../utils/logger'
import { cs } from '../microservices/commServer'
import { OrganisationModel } from '../persistance/organisation/model'
import { INodeCreatePost, INodeUpdate, NodeType } from '../persistance/node/types'
import { NodeModel } from '../persistance/node/model'
import { CommunityService, ItemService } from '../core'
import { errorHandler } from '../utils/error-handler'
import { UserModel } from '../persistance/user/model'
import { ItemType } from '../persistance/item/types'

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
        // Add to nodes group in commServer (Initially public) DEPRECATED
        // await cs.addUserToGroup(node.agid, PUBLIC_NODES)
        return node.agid
    } catch (err) {
        const error = errorHandler(err)
        logger.error(error.message)
        throw error
    }
}

// Update
export const updateOne = async (agid: string, data: INodeUpdate): Promise<void> => {
    try {
        // Update node in commServer
        const node = await NodeModel._getDoc(agid)
        await node._updateNode(data)
        // if (data.visible !== undefined) {
        //     if (data.visible) {
        // TBD Think what to do here, do we set up master button to remove node from all groups?? Does it make sense??
        //     }
        // }
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
        // Remove node from communities where is included
        if (node.hasCommunities) {
            node.hasCommunities.forEach(async commId => {
                await CommunityService.removeNode(commId, node.cid,agid)
            })
        }
        // remove node from users
        if (node.defaultOwner) {
            if (node.defaultOwner.Device) {
                await UserModel._removeNodeFromUser(node.defaultOwner.Device, agid, ItemType.DEVICE)
            }
            if (node.defaultOwner.Service) {
                await UserModel._removeNodeFromUser(node.defaultOwner.Service, agid, ItemType.SERVICE)
            }
            if (node.defaultOwner.Marketplace) {
                await UserModel._removeNodeFromUser(node.defaultOwner.Marketplace, agid, ItemType.MARKETPLACE)
            }
        }
        // Remove node from organisation
        await OrganisationModel._removeNodeFromCompany(node.cid, agid)
        // Remove node
        await node._removeNode()
        // // Remove from nodes group in commServer (Initially public) DEPRECATED
        // await cs.deleteUserFromGroup(node.agid, PUBLIC_NODES)
        // Delete node user from CS
        await cs.deleteUser(node.agid)
    } catch (err) {
        const error = errorHandler(err)
        logger.error(error.message)
        throw error
    }
}
