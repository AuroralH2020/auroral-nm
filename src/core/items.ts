/**
 * Core functionality of ITEMS
 */

// Imports
import { logger } from '../utils/logger'
import { cs } from '../microservices/commServer'
import { ItemModel } from '../persistance/item/model'
import { UserModel } from '../persistance/user/model'
import { NodeModel } from '../persistance/node/model'

// Functions

export const removeOne = async (oid: string): Promise<void> => {
    try {
        // Get item
        const item = await ItemModel._getDoc(oid)
        // Remove item from user
        if (item.uid) {
            await UserModel._removeItemFromUser(item.uid, oid)
        }
        // Remove item from node
        if (item.agid) {
            await NodeModel._removeItemFromNode(item.agid, oid)
        }
        // Remove item in CS
        await cs.deleteUser(oid)
        // Remove item in Mongo
        await item._removeItem()
    } catch (error) {
        logger.error(error.message)
        throw new Error(error.message)
    }
}
