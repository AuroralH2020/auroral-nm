/**
 * Core functionality of ITEMS
 */

// Imports
import * as crypto from 'crypto'
import { number } from 'joi'
import { errorHandler, ErrorSource, MyError } from '../utils/error-handler'
import { HttpStatusCode, logger } from '../utils'
import { cs } from '../microservices/commServer'
import { ItemModel } from '../persistance/item/model'
import { UserModel } from '../persistance/user/model'
import { NodeModel } from '../persistance/node/model'
import { OrganisationModel } from '../persistance/organisation/model'
import {
    GetAllQuery,
    IItemCreate,
    IItemDocument,
    ItemDomainType,
    IItemUI,
    IItemUpdate,
    ItemPrivacy,
    ItemStatus,
    ItemType
} from '../persistance/item/types'
import { xmpp } from '../microservices/xmppClient'
import { ContractModel } from '../persistance/contract/model'

// Functions

/**
 * Get Items
 */
 export const getMany = async (cid: string, type: ItemType, offset: number, filter: number, domain?: ItemDomainType): Promise<IItemUI[]> => {
    try {
        // Get your organisation data
        const myOrganisation = await OrganisationModel._getOrganisation(cid)
        // Find out if you need to get partnerships
        const organisations = Number(filter) !== 5 ? cid : { '$in': (myOrganisation.knows) }
        // Get my company Name
        const myCompanyName = myOrganisation.name
        // Build query based on filter
        const query: GetAllQuery = buildGetManyQuery(organisations, type, filter, domain)
        // Get and return items
        const data = await ItemModel._getAllItems(query, Number(offset))
        // Enrich Data and return
        return Promise.all(data.map(async (it) => {
            return {
                ...it,
                companyName: cid === it.cid ? myCompanyName : (await OrganisationModel._getOrganisation(it.cid)).name,
                online: (await cs.getSessions(it.oid)).session.length > 0
            }
        }))
    } catch (err) {
        throw errorHandler(err)
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
                online: csObject.session.length > 0,
                ttl: csObject.ttl,
                owner,
                gateway: {
                    name: gateway.name
                }
            }
    } catch (err) {
        const error = errorHandler(err)
        if (error.source === ErrorSource.ITEM) {
            throw new MyError(error.message, error.status, { source: error.source })
        } else {
            throw new MyError(error.message, error.status)
        }
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
        // logger.error(error.message)
        throw error
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
            throw new MyError('Item does not belong to requester', HttpStatusCode.FORBIDDEN)
        }
        // Remove item in CS
        await cs.deleteUser(oid)
        // Remove item from user
        if (item.uid) {
            await UserModel._removeItemFromUser(item.uid, oid)
        }
        // Remove item from node
        if (item.agid) {
            await NodeModel._removeItemFromNode(item.agid, oid)
        }
        // Remove item from contracts
        if (item.hasContracts.length > 0) {
            for (const con of item.hasContracts) {
                await ContractModel._removeItems(con, [item.oid])
            }
        }
        // Remove item in Mongo
        await item._removeItem()
        // Send notification to NODE
        await xmpp.notifyPrivacy(item.agid)
        // TBD: Audits and notifications
    } catch (err) {
        throw errorHandler(err)
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
            // logger.error('Cannot update ' + oid + ' because it does not belong to user or agent requester: ' + owner)
            throw new MyError('Item does not belong to requester', HttpStatusCode.FORBIDDEN)
        }
        // TBD: Do checks before updating
        // Check conflicts
        // Authorizations
        // Dependencies

        // check conflicts
        await checkBeforeItemUpdate(item.oid, data)
        // Update
        if (data.status && owner) {
            // Enable/Disable
            await updateStatus(item, data.status, owner, oid)
            // Send notification to NODE
            await xmpp.notifyPrivacy(item.agid)
        } else if (typeof data.accessLevel === 'number' && owner) {
            // If access level is less restrictive than user's then forbid
            await updateAccessLevel(item, data.accessLevel, owner)
            // Send notification to NODE
            await xmpp.notifyPrivacy(item.agid)
        } else {
            await item._updateItem(data)
            // no need for NODE to be updated
        }
    } catch (err) {
        throw errorHandler(err)
    }
}

// Private functions

const updateStatus = async (item: IItemDocument, status: ItemStatus , owner: string, oid: string) => {
    // Add privacy if disabling

    // Check conflicts
    await checkBeforeItemUpdate(item.oid,{ status })

    const dataWithPrivacy = status === ItemStatus.DISABLED ?
        { status, accessLevel: ItemPrivacy.PRIVATE } : 
        { status }
    // Update status
    await item._updateItem(dataWithPrivacy)
    if (status === ItemStatus.DISABLED) {
        // Remove item from user AND user from item
        await UserModel._removeItemFromUser(owner, oid)
        // Remove user from item document
        await ItemModel._removeUserFromItem(oid)
        // Remove item from CS organisation group
        await cs.deleteUserFromGroup(oid, item.cid)
    } else {
        // Add item to user
        await UserModel._addItemToUser(owner, oid)
        // Add item user to item document
        await ItemModel._addUserToItem(oid, owner)
        // Add item to CS organisation group
        await cs.addUserToGroup(oid, item.cid)
    }
}

const updateAccessLevel = async (item: IItemDocument, accessLevel: ItemPrivacy , owner: string) => {
    // TBD check also contracts when lowering privacy
    const user = await UserModel._getUser(owner)
    await checkBeforeItemUpdate(item.oid,{ accessLevel })
    if (user.accessLevel < accessLevel) {
        throw new MyError('User owner privacy must be less restrictive', HttpStatusCode.FORBIDDEN)
    } else {
        await item._updateItem({ accessLevel })
    }
}

const checkBeforeItemUpdate = async (oid: string, data: IItemUpdate) => {
    const item = await ItemModel._getItem(oid)
    // test if conflicting operations
    if (data.status || data.accessLevel !== undefined) {
        // test if item is in contract
        if (item.hasContracts && item.hasContracts.length > 0) {
            if (data.status === ItemStatus.DISABLED) {
                throw new MyError('Unable to disable item - it is included in contract', HttpStatusCode.BAD_REQUEST)
            }
            if (data.status === ItemStatus.DELETED) {
                throw new MyError('Unable to delete item - it is included in contract', HttpStatusCode.BAD_REQUEST)
            }
            if (data.accessLevel !== undefined && data.accessLevel < ItemPrivacy.FOR_FRIENDS) {
                throw new MyError('Item is included in contract - unable to set private access level', HttpStatusCode.BAD_REQUEST)
            }
        }
    }
}

const buildGetManyQuery = (cid: string | { $in: string[] }, type: ItemType, filter: number, domain?: ItemDomainType): GetAllQuery => {
    let query: GetAllQuery
    switch (Number(filter)) {
        case 0:
            // My disabled devices
            query = {
                cid,
                type,
                status: ItemStatus.DISABLED
            }
            break
        case 1:
            // My private devices
            query = {
                cid,
                type,
                accessLevel: ItemPrivacy.PRIVATE,
                status: { $ne: ItemStatus.DELETED }
            }
            break
        case 2:
            // My devices for friends
            query = {
                cid,
                type,
                accessLevel: ItemPrivacy.FOR_FRIENDS,
                status: { $ne: ItemStatus.DELETED }
            }
            break
        case 3:
            // My public devices
            query = {
                cid,
                type,
                accessLevel: ItemPrivacy.PUBLIC,
                status: { $ne: ItemStatus.DELETED }
            }
            break
        case 4:
            // My devices
            query = {
                cid,
                type,
                status: { $ne: ItemStatus.DELETED }
            }
            break
        case 5:
            // Friend's devices
            query = {
                cid,
                type,
                $or: [{ accessLevel: ItemPrivacy.FOR_FRIENDS } , { accessLevel: ItemPrivacy.PUBLIC }],
                status: { $ne: ItemStatus.DELETED }
            }
            break
        case 6:
            // All public devices
            query = {
                type,
                accessLevel: ItemPrivacy.PUBLIC,
                status: { $ne: ItemStatus.DELETED }
            }
            break
        default:
            // Defaults to option 4
            logger.warn('Getting items from default option...')
            query = {
                cid,
                type,
                accessLevel: ItemPrivacy.PUBLIC,
                status: { $ne: ItemStatus.DELETED }
            }
    }
    if (domain) {
        query['labels.domain'] = domain
    }
    return query
}
