/**
 * Core functionality of DB CONSISTENCY checks
 */

import { ItemModel } from "../persistance/item/model"
import { BrokenItemInfoType, ItemStatus } from "../persistance/item/types"
import { ItemService } from "../core"
import { cs } from "../microservices/commServer"
import { ContractModel } from "../persistance/contract/model"
import { logger } from '../utils/logger'


export const fixItemsConsistency = async (dryrun: Boolean = false): Promise<BrokenItemInfoType[]> => {
    const brokenItems = await ItemModel._getBrokenItemsWithoutActiveNode()
    if (brokenItems.length === 0) {
        logger.info('No broken items found')
    }
    logger.info(`Found ${brokenItems.length} broken items`)
    if(dryrun) {
        logger.info('Dryrun, skipping fix of broken items')
        return brokenItems
    }
    for (const item of brokenItems) {
        logger.info(`Item ${item.oid} is broken`)
        // if item.status == ENABLED -> remove item from user
        if(item.status === ItemStatus.ENABLED) {
            logger.info(`Item ${item.oid} is ENABLED, removing from user`)
            // try to disbale item -> remove from user
            safeTry(ItemService.updateOne,[item.oid, { status: ItemStatus.DISABLED }])
        }
        // try to remove from Openfire
        safeTry(cs.deleteUser,[item.oid])
        // remove from contracts
        safeTry(ContractModel._removeItemFromAllContracts,[item.oid])
        //  hasCommunities is not used -> we can ignore it
        // remove item
        console.log('removing item')
        const i = await ItemModel._getDoc(item.oid)
        i._removeItem()
    }
    return brokenItems

}

// try catch function to handle errors
export const safeTry = async (func: Function, ...args: any[]): Promise<any> => {
    try {
        return await func(...args)
    } catch (err) {
    }
}
