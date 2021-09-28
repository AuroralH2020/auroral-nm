/**
 * Core functionality of ITEMS
 */

// Imports
import * as crypto from 'crypto'
import { errorHandler, ErrorType } from '../utils/error-handler'
import { logger } from '../utils/logger'
import { cs } from '../microservices/commServer'
import { ItemModel } from '../persistance/item/model'
import { UserModel } from '../persistance/user/model'
import { NodeModel } from '../persistance/node/model'
import { OrganisationModel } from '../persistance/organisation/model'
import { IItemUI, IItemCreate, ItemType, GetAllQuery, ItemStatus, ItemPrivacy, IItemUpdate } from '../persistance/item/types'

// Functions

/**
 * Get Items
 */
 export const getMany = async (cid: string, type: ItemType, offset: number, filter: number): Promise<IItemUI[]> => {
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
    } catch (err) {
        const error = errorHandler(err)
        logger.error(error.message)
        throw new Error(error.message)
    }
}

/**
 * Get One Item
 */
 export const getOne = async (cid: string, oid: string): Promise<IItemUI> => {
    try {
        // Get Item
        const data = await ItemModel._getItem(oid)
        // Get User
        let owner
        if (data.uid) {
            const user = await UserModel._getUser(data.uid)
            owner = {
                name: user.name,
                email: user.email
            }
        }
        // Get Company
        const company = await OrganisationModel._getOrganisation(data.cid)
        // Get CS Status
        const csObject = await cs.getSessions(data.oid)
        // Get gateway info
        const gateway = await NodeModel._getNode(data.agid)
        // Enrich Data and return
        return {
                ...data,
                companyName: company.name,
                online: csObject.sessions.length >= 1,
                owner,
                gateway: {
                    name: gateway.name
                }
            }
    } catch (err) {
        const error = errorHandler(err)
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
    } catch (err) {
        const error = errorHandler(err)
        logger.error(error.message)
        throw new Error(error.message)
    }
}

/**
 * Remove Item
 * @param oid 
 * @param owner optional: If present validate item belongs to that agent or uid (Is an AGID or UID)
 */
export const removeOne = async (oid: string, owner?: string): Promise<void> => {
    try {
        // Get item
        const item = await ItemModel._getDoc(oid)
        // Validate agid provided by agent or uid by UI
        if (owner != null && owner !== item.agid && owner !== item.uid) {
            logger.error('Cannot remove ' + oid + ' because it does not belong to user or agent requester: ' + owner)
            throw new Error(ErrorType.UNAUTHORIZED)
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
    } catch (err) {
        const error = errorHandler(err)
        throw new Error(error.message)
    }
}

/**
 * Update item 
 * @param oid 
 * @param data 
 * @param owner optional: If present validate item belongs to that agent or uid (Is an AGID or UID)  
 */
export const updateOne = async (oid: string, data: IItemUpdate, owner?: string): Promise<void> => {
    try {
    // Get item
        const item = await ItemModel._getDoc(oid)
    // Validate agid provided by agent or uid by UI
        if (owner != null && owner !== item.agid && owner !== item.uid && item.status !== ItemStatus.DISABLED) {
            logger.error('Cannot update ' + oid + ' because it does not belong to user or agent requester: ' + owner)
            throw new Error(ErrorType.UNAUTHORIZED)
        }
    // TBD: Do checks before updating
    // Check contracts
    // Check conflicts
    // Authorizations
    // Dependencies
    
    // Update
        if (data.status && owner) {
            // Add privacy if disabling
            const dataWithPrivacy = data.status === ItemStatus.DISABLED ?
                { status: data.status, accessLevel: ItemPrivacy.PRIVATE } : 
                data
            // Update status
            await item._updateItem(dataWithPrivacy)
            // Add/remove item to/from user AND user from item
            if (data.status === ItemStatus.DISABLED) {
                await UserModel._removeItemFromUser(owner, oid)
                await ItemModel._removeUserFromItem(oid)
            } else {
                await UserModel._addItemToUser(owner, oid)
                await ItemModel._addUserToItem(oid, owner)
            }
        } else {
            await item._updateItem(data)
        }
    } catch (err) {
        const error = errorHandler(err)
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
