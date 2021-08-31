/**
 * Core functionality of ITEMS
 */

// Imports
import * as crypto from 'crypto'
import { logger } from '../utils/logger'
import { cs } from '../microservices/commServer'
import { ItemModel } from '../persistance/item/model'
import { UserModel } from '../persistance/user/model'
import { NodeModel } from '../persistance/node/model'
import { OrganisationModel } from '../persistance/organisation/model'
import { IItem, IItemCreate, ItemType, GetAllQuery, ItemStatus, ItemPrivacy } from '../persistance/item/types'

// Functions

/**
 * Get Items
 */
 export const getMany = async (cid: string, type: ItemType, offset: number, filter: number): Promise<IItem[]> => {
    try {
        // Get your organisation data
        const myOrganisation = await OrganisationModel._getOrganisation(cid)
        // Find out if you need to get partnerships
        const organisations = filter !== 5 ? cid : { $in: [cid].concat(myOrganisation.knows) }
        // Get my company Name
        const myCompanyName = myOrganisation.name
        // Build query based on filter
        const query: GetAllQuery = buildGetManyQuery(organisations, type, filter)
        // Get and return items
        const data = await ItemModel._getAllItems(query, Number(offset))
        // Enrich Data and return
        return Promise.all(data.map(async (it) => {
            return {
                ...it,
                companyName: cid === it.cid ? myCompanyName : (await OrganisationModel._getOrganisation(it.cid)).name,
                online: (await cs.getSessions(it.oid)).sessions.length >= 1
            }
        }))
    } catch (error) {
        logger.error(error.message)
        throw new Error(error.message)
    }
}

/**
 * Create Item
 */
 export const createOne = async (item: IItemCreate, agid: string, cid: string): Promise<string> => {
    try {
        // Add item to Mongo
        await ItemModel._createItem({ ...item, agid, cid }) 
        // Create password for CS
        const password: string = crypto.randomBytes(8).toString('base64')
        // Add to CS
        await cs.postUser(item.oid, password)
        // Add to agent
        await NodeModel._addItemToNode(agid, item.oid)
        // TBD: Add notifications and audits
        return password
    } catch (error) {
        logger.error(error.message)
        throw new Error(error.message)
    }
}

/**
 * Remove Item
 * @param oid 
 * @param agid optional: If present validate item belongs to that agent 
 */
export const removeOne = async (oid: string, agid?: string): Promise<void> => {
    try {
        // Get item
        const item = await ItemModel._getDoc(oid)
        // Validate agid provided by agent
        if (agid && agid !== item.agid) {
            throw new Error('Cannot remove ' + oid + ' because it does not belong to ' + agid)
        }
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
        // TBD: Remove contracts
        // TBD: Audits and notifications
    } catch (error) {
        logger.error(error.message)
        throw new Error(error.message)
    }
}

// Private functions

const buildGetManyQuery = (cid: string | { $in: string[] }, type: ItemType, filter: number): GetAllQuery => {
    switch (Number(filter)) {
        case 0:
            // My disabled devices
            return {
                cid,
                type,
                accessLevel: ItemPrivacy.PRIVATE,
                status: ItemStatus.DISABLED
            }
        case 1:
            // My private devices
            return {
                cid,
                type,
                accessLevel: ItemPrivacy.PRIVATE,
                status: { $ne: ItemStatus.DELETED }
            }
        case 2:
            // My devices for friends
            return {
                cid,
                type,
                accessLevel: ItemPrivacy.FOR_FRIENDS,
                status: { $ne: ItemStatus.DELETED }
            }
        case 3:
            // My public devices
            return {
                cid,
                type,
                accessLevel: ItemPrivacy.PUBLIC,
                status: { $ne: ItemStatus.DELETED }
            }
        case 4:
            // My devices
            return {
                cid,
                type,
                status: { $ne: ItemStatus.DELETED }
            }
        case 5:
            // Friend's devices
            return {
                cid,
                type,
                accessLevel: { $or: [ItemPrivacy.FOR_FRIENDS, ItemPrivacy.PUBLIC] },
                status: { $ne: ItemStatus.DELETED }
            }
        case 6:
            // All public devices
            return {
                type,
                accessLevel: ItemPrivacy.PUBLIC,
                status: { $ne: ItemStatus.DELETED }
            }
        default:
            // Defaults to option 4
            logger.warn('Getting items from default option...')
            return {
                cid,
                type,
                accessLevel: ItemPrivacy.PUBLIC,
                status: { $ne: ItemStatus.DELETED }
            }
    }
}
