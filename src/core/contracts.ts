/**
 * Core functionality of CONTRACTS
 */

// Imports
import {
    ContractItemType,
    ContractStatus,
    GetAllQuery,
    getContractstOptions,
    IContractCreate,
    IContractItemUpdate,
    IContractUI,
    IContractUpdate
} from '../persistance/contract/types'
import { logger } from '../utils/logger'
import { errorHandler, MyError } from '../utils/error-handler'
import { ContractModel } from '../persistance/contract/model'
import { OrganisationModel } from '../persistance/organisation/model'
import { UserModel } from '../persistance/user/model'
import { ItemModel } from '../persistance/item/model'
import { ItemPrivacy, ItemStatus } from '../persistance/item/types'
import { HttpStatusCode } from '../utils'
import { NotificationModel } from '../persistance/notification/model'
import { NotificationStatus } from '../persistance/notification/types'
import { EventType, ResultStatusType } from '../types/misc-types'
import { cs } from '../microservices/commServer'
import { AuditModel } from '../persistance/audit/model'
import { IAuditLocals } from '../types/locals-types'
import { OrganisationStatus } from '../persistance/organisation/types'
import { xmpp } from '../microservices/xmppClient'
import { dlt } from '../microservices/dltConnector'
import { acceptDLTContract, addDLTContractItem, createDLTContract, rejectDLTContract, removeDLTContract, removeDLTContractItem, updateDLTContractItem } from './dlt'
import { CommunityModel } from '../persistance/community/model'
import { CommunityService } from '../core'

// Functions

/**
 * Get all my contracts
 * Allows filtering
 * @param args 
 * @returns 
 */
export const getMany = async (args: getContractstOptions): Promise<IContractUI[]> => {
    try {
        const query: GetAllQuery = {
            ctid: { $in: args.ctid },
            status: args.status ? args.status : { $ne: ContractStatus.DELETED },
        }
        if (args.type) {
            query.type = args.type
        }
        // Get your contracts data
        // TBD offset not working
        // TBD enrich data
        return await ContractModel._getAllContracts(query, Number(args.offset))
    } catch (err) {
        throw errorHandler(err)
    }
}

/**
 * Initialize a contract
 * Still waiting for organisations invited to join
 * @param cid 
 * @param uid 
 * @param termsAndConditions 
 * @param organisations 
 * @param audit 
 * @param description 
 * @returns 
 */
export const createOne = async (contractDetails: {cid: string, uid: string, termsAndConditions: string, organisations: string[], description?: string}, audit: IAuditLocals, token: string): Promise<string> => {
    try {
        // get my data for notifications and audits
        const myOrg = await OrganisationModel._getOrganisation(contractDetails.cid)
        const myUser = await UserModel._getUser(contractDetails.uid)

        if (contractDetails.organisations.length !== 1) {
            throw new MyError('Contracts between multiple organisations are not allowed ', HttpStatusCode.BAD_REQUEST)
        }
        // test if user is trying to invite his organisation
        if (contractDetails.organisations[0] === contractDetails.cid) {
            throw new MyError('Can not invite own organisation', HttpStatusCode.BAD_REQUEST)
        }
        const org =  await OrganisationModel._getOrganisation(contractDetails.organisations[0])
        // test if org exists
        if (org.status !== OrganisationStatus.ACTIVE) {
            throw new MyError('Invited organisation is not active', HttpStatusCode.BAD_REQUEST)
        }
        if (!(org.knows).includes(contractDetails.cid)) {
            throw new MyError('You have to be friends to send contract request', HttpStatusCode.BAD_REQUEST)
        }
        // Test if same there is already contract with same org
        const org1AllContracts = org.hasContracts.concat(org.hasContractRequests)
        const org2AllContracts = myOrg.hasContracts.concat(myOrg.hasContractRequests)
        if (org1AllContracts.filter(value => org2AllContracts.includes(value)).length !== 0) {
            throw new MyError('You already have contract with given organisation', HttpStatusCode.BAD_REQUEST)
        }
        // Create contract
        const contractData: IContractCreate = { termsAndConditions: contractDetails.termsAndConditions, organisations: [contractDetails.cid], pendingOrganisations: contractDetails.organisations, description: contractDetails.description }
        // Create contract
        const contract = await ContractModel._createContract(contractData)
        // Create contract in DLT
        await createDLTContract(token, contract)
        // Add contract to first organisation
        await OrganisationModel._addContract(contractDetails.cid, contract.ctid)

        // Create Notifications and fill hasContracts for all organisations
        let contractName = 'contract: ' + myOrg.name
        for (const x of contractDetails.organisations) {
            await OrganisationModel._addContractRequest(x, contract.ctid)
            const remoteOrg = await OrganisationModel._getOrganisation(x)
            contractName += ' ' + remoteOrg.name
            await NotificationModel._createNotification({
                owner: x,
                actor: { id: contractDetails.cid, name: myOrg.name },
                target: { id: x, name: remoteOrg.name },
                object: { id: contract.ctid, name: 'Private contract' },
                type: EventType.contractRequest,
                status: NotificationStatus.WAITING
            })
        }
        // Audits
        await AuditModel._createAudit({
            ...audit,
            actor: { id: contractDetails.cid, name: myUser.name },
            target: { id: contract.ctid,  name: 'Private contract' },
            object: { id: myOrg.cid, name: myOrg.name },
            type: EventType.contractCreated,
            labels: { ...audit.labels, status: ResultStatusType.SUCCESS }
        })
        // Create openfire group
        await cs.postGroup(contract.ctid, contractName)
        return contract.ctid
    } catch (err) {
        const error = errorHandler(err)
        logger.error(error.message)
        throw error
    }
}

/**
 * Update a contract
 * So far only description can be updated
 * @param ctid 
 * @param data 
 * @returns 
 */
 export const updateOne = async (ctid: string, data: IContractUpdate): Promise<string> => {
    try {
        // Create contract
        const contract = await ContractModel._getDoc(ctid)
        await contract._updateContract(data)
        // TBD Notification and Audit?
        return contract.ctid
    } catch (err) {
        const error = errorHandler(err)
        logger.error(error.message)
        throw error
    }
}

/**
 * Organisations decides to abandon a contract
 * @param ctid 
 * @param cid 
 * @param uid 
 * @param audit 
 */
export const removeOrgFromContract = async (ctid: string, cid: string, uid: string, audit: IAuditLocals, token: string): Promise<void> => {
    // Get contract organisations
    const contractCids = (await ContractModel._getContract(ctid)).organisations
    // Remove org items from contract
    // const itemsToRemove = await ContractModel._getOrgItemsInContract(ctid, cid)
    await ItemModel._removeContractFromCompanyItems(cid, ctid)
    await ContractModel._removeOrgItemsFromContract(ctid, cid)
    // Remove org from contract
    await ContractModel._removeOrganisationFromContract(ctid, cid)
    await OrganisationModel._removeContract(cid, ctid)
    // DLT update
    await removeDLTContract(token, ctid)

    const myUser = await UserModel._getUser(uid)
    const myOrg = await OrganisationModel._getOrganisation(cid)
    // Audits
    await AuditModel._createAudit({
        ...audit,
        actor: { id: uid, name: myUser.name },
        target: { id: ctid,  name: 'Private contract' },
        object: { id: myOrg.cid, name: myOrg.name },
        type: EventType.contractAbandoned,
        labels: { ...audit.labels, status: ResultStatusType.SUCCESS }
    })
    // Test if there is only one organisation -> remove contract
    const removed = await testAfterRemoving(ctid)
    if (removed) {
        await AuditModel._createAudit({
            ...audit,
            actor: { id: uid, name: myUser.name },
            target: { id: ctid,  name: 'Private contract' },
            object: { id: myOrg.cid, name: myOrg.name },
            type: EventType.contractDeleted,
            labels: { ...audit.labels, status: ResultStatusType.SUCCESS }
        })
    }
    // Send XMPP notification to all agents of the organisations involved in the contract
    for (const orgCid of contractCids) {
        const agids_0 = (await OrganisationModel._getOrganisation(orgCid)).hasNodes
        for (const agid of agids_0) {
            const foreignOrg = contractCids.filter(it => it !== orgCid)
            await xmpp.notifyContractRemoved(agid, {
                ctid,
                cid: foreignOrg[0] // Return the other organisation in the contract
            })
        }
    }
}
/**
 * Organisation rejects being included into a contract
 * @param ctid 
 * @param cid 
 * @param uid 
 * @param audit 
 */
export const rejectContractRequest = async (ctid: string, cid: string, uid: string, audit: IAuditLocals, token: string): Promise<void> => {
    // Get contract organisations
    const contractCids = (await ContractModel._getContract(ctid)).organisations
    // Test if rejecting  is possible
    if (!(await OrganisationModel._getOrganisation(cid)).hasContractRequests.includes(ctid)) {
        throw new MyError('Can not reject this contract')
    }
    // Remove org from contract
    await ContractModel._removePendingOrganisationFromContract(ctid, cid)
    // DLT update
    await rejectDLTContract(token, ctid)
    // Update contract status
    const contractDoc = await ContractModel._getDoc(ctid)
    await contractDoc._updateStatus()
    // remove contract from org (also remove from hasContractRequests)
    await OrganisationModel._removeContractRequest(cid, ctid)
    // Update notification
    const notificationsToUpdate = await NotificationModel._findNotifications({
        owners: [cid],
        status: NotificationStatus.WAITING,
        type: EventType.contractRequest,
        'object.id': ctid
    })
    // Update notification of contract request --> reject it
    for (const notif of notificationsToUpdate) {
        await NotificationModel._setRead(notif)
        await NotificationModel._setStatus(notif, NotificationStatus.REJECTED)
    }
    // Test if there is only one organisation -> remove contract
    const removed = await testAfterRemoving(ctid)
    if (removed) {
        // get my data
        const myOrg = await OrganisationModel._getOrganisation(cid)
        const myUser = await UserModel._getUser(uid)
        await AuditModel._createAudit({
            ...audit,
            actor: { id: uid, name: myUser.name },
            target: { id: ctid,  name: 'Private contract' },
            object: { id: myOrg.cid, name: myOrg.name },
            type: EventType.contractDeleted,
            labels: { ...audit.labels, status: ResultStatusType.SUCCESS }
        })
    }
    // Send XMPP notification to agents
    // Only org inviting could have items at this point
    const agids = (await OrganisationModel._getOrganisation(contractCids[0])).hasNodes
    for (const agid of agids) {
        await xmpp.notifyContractRemoved(agid, { ctid, cid })
    }
}

/**
 * Organisation accepts to be included into a contract
 * @param ctid 
 * @param cid 
 * @param uid 
 * @param audit 
 */
export const acceptContractRequest = async (ctid: string, cid: string, uid: string, audit: IAuditLocals, token: string): Promise<void> => {
    // Test if accepting is possible
    if (!(await OrganisationModel._getOrganisation(cid)).hasContractRequests.includes(ctid)) {
        throw new MyError('Can not accept this contract')
    }
    // Add org to contract
    await ContractModel._orgAcceptsContract(ctid, cid)
    // DLT update
    await acceptDLTContract(token, ctid)
    // Update conract status
    const contract = await ContractModel._getDoc(ctid)
    await contract._updateStatus()
    // add contract to org (also remove from hasContractRequests)
    await OrganisationModel._addContract(cid, ctid)
    const notificationsToUpdate = await NotificationModel._findNotifications({
        owners: [cid],
        status: NotificationStatus.WAITING,
        type: EventType.contractRequest,
        'object.id': ctid
    })
    // Update notification of contract request --> accept it
    for (const notif of notificationsToUpdate) {
        await NotificationModel._setRead(notif)
        await NotificationModel._setStatus(notif, NotificationStatus.ACCEPTED)
    }
    // Audits
    const myUser = await UserModel._getUser(uid)
    const myOrg = await OrganisationModel._getOrganisation(cid)
    await AuditModel._createAudit({
        ...audit,
        actor: { id: uid, name: myUser.name },
        target: { id: contract.ctid,  name: 'Private contract' },
        object: { id: myOrg.cid, name: myOrg.name },
        type: EventType.contractJoined,
        labels: { ...audit.labels, status: ResultStatusType.SUCCESS }
    })
    // TBD: NOT NEEDED AT THE MOMENT
    // Initial contract info is retrieved by agent when needed for the first time
    // Send XMPP notification to agents
    // const agids = await ContractModel._getNodesInContract(ctid)
    // for (const agid of agids) {
    //     await xmpp.notifyContractCreated(agid, { ctid, cids: contract.organisations })
    // }
}

/**
 * Add an item to a contract
 * @param ctid 
 * @param oid 
 * @param rw 
 * @param enabled 
 */
export const addItem = async (newItem: { ctid: string, oid: string, rw: boolean, enabled: boolean }, token: string): Promise<void> => {
    try {
        // Create contract
        const item = await ItemModel._getItem(newItem.oid)
        const user = await UserModel._getUser(item.uid)
        const contract = await ContractModel._getContract(newItem.ctid)
        if (item.status !== ItemStatus.ENABLED || item.accessLevel === ItemPrivacy.PRIVATE) {
            throw  new MyError('You have to include only ENABLED and not PRIVATE items', HttpStatusCode.BAD_REQUEST)
        }
        if (newItem.enabled) {
            // add to openfire group if enabled == true
            await cs.addUserToGroup(newItem.oid, newItem.ctid)
        }
        // test if item is already included in contract
        if ((contract.items).some((it) => {
            return it.oid === newItem.oid
            })) {
            throw  new MyError('Item is already included in contract', HttpStatusCode.BAD_REQUEST)
        }
        // Add item to contract
        const contractItem : ContractItemType = { enabled: newItem.enabled, rw: newItem.rw ? newItem.rw : false, type: item.type, oid: newItem.oid, cid: item.cid, uid: item.uid, userMail: user.email }
        await ContractModel._addItem(newItem.ctid, contractItem)
        // DLT update
        await addDLTContractItem(token, newItem.ctid, contractItem)
        // Add contract to item
        await ItemModel._addContract(newItem.oid, newItem.ctid)
        if (newItem.enabled) {
            // Get other organisations in contract
            const foreignOrg = contract.organisations.filter(it => it !== item.cid)
            // Send XMPP notification to node where the item belongs
            await xmpp.notifyContractItemUpdate(item.agid, { ctid: newItem.ctid, cid: foreignOrg[0], oid: newItem.oid, rw: newItem.rw })
        }
    } catch (err) {
        const error = errorHandler(err)
        logger.error(error.message)
        throw error
    }
}

/**
 * Update an item already included in a contract
 * Enable/disable or change rw
 * @param ctid 
 * @param oid 
 * @param data 
 */
export const editItem = async (ctid: string, oid: string, data: IContractItemUpdate, token: string): Promise<void> => {
    try {
        // Get item
        const itemAgid = (await ItemModel._getItem(oid)).agid
        const item = await ContractModel._getItem(ctid, oid)
        if (!item) {
            throw new MyError('Can not edit item which is not in contract', HttpStatusCode.BAD_REQUEST)
        }
        // Enabled property has changed --> Check if we need to remove from CS
        if (data.enabled !== undefined && data.enabled !== item.enabled) {
            if (data.enabled) {
                // Add to openfire group
                await cs.addUserToGroup(oid, ctid)
            } else {
                // Remove from openfire group
                await cs.deleteUserFromGroup(oid, ctid)
            }
        }
        // Edit item 
        await ContractModel._editItem(ctid, oid, data)
        // DLT update
        // Retrieve item after updates because DLT requires the whole item
        await updateDLTContractItem(token, ctid, await ContractModel._getItem(ctid, oid))
        // Item after updates
        const itemNew = await ContractModel._getItem(ctid, oid)
        // Send XMPP notification
        // IF item is enabled just update, ELSE send remove notification
        // Send notifications to node where the items belong and with org ID of the contracted org
        // Get other organisations in contract
        const organisations = (await ContractModel._getContract(ctid)).organisations
        const foreignOrg = organisations.filter(it => it !== item.cid)
        if (itemNew.enabled) {
            await xmpp.notifyContractItemUpdate(itemAgid, { ctid, cid: foreignOrg[0], oid, rw: itemNew.rw })
        } else {
            await xmpp.notifyContractItemRemoved(itemAgid, { ctid, cid: foreignOrg[0], oid })
        }
    } catch (err) {
        const error = errorHandler(err)
        logger.error(error.message)
        throw error
    }
}

/**
 * Remove an item from a contract
 * Accepts multiple items but all from same organisation
 * @param ctid 
 * @param oids 
 * @param cid
 */
export const removeItems = async (ctid: string, oids: string[], cid: string, token: string): Promise<void> => {
    try {
        // Remove array of items
        const items = await ContractModel._getContractItems(ctid)
        oids.forEach((oid) => {
            if (!items.includes(oid))  {
                throw  new MyError('Can not remove item which is not in contract', HttpStatusCode.BAD_REQUEST)
            }
        })
        await ContractModel._removeItems(ctid, oids)
        await Promise.all(oids.map(async (oid): Promise<void> => {
            try {
                await ItemModel._removeContract(oid, ctid)
                // DLT update
                await removeDLTContractItem(token, ctid, oid)
            } catch  {
                logger.error('One item was not removed: ' + oid)
            }
            // remove openfire group
            await cs.deleteUserFromGroup(oid, ctid)
        }))
        // Send XMPP notification
        // Send notifications to node where the items belong and with org ID of the contracted org
        // Get other organisations in contract
        const organisations = (await ContractModel._getContract(ctid)).organisations
        const foreignOrg = organisations.filter(it => it !== cid)
        const notifications = []
        const agids = (await OrganisationModel._getOrganisation(cid)).hasNodes
        for (const agid of agids) {
            for (const oid of oids) {
                notifications.push(xmpp.notifyContractItemRemoved(agid, { ctid, cid: foreignOrg[0], oid }))
            }
        }
        await Promise.all(notifications) // Execute async all notifs
    } catch (err) {
        const error = errorHandler(err)
        logger.error(error.message)
        throw error
    }
}

export const getNotDiscoverableNodesInContract = async (ctid: string, cid: string): Promise<{cid: string, nodes: string[], name: string}[]> => {
    const sharedNodes = []
    // get contract
    const contract = await ContractModel._getContract(ctid)
    if (!contract.organisations.includes(cid)) {
        throw new MyError('You are not part of this contract', HttpStatusCode.FORBIDDEN)
    }
    // Nodes owning items in contract 
    const nodesInContract: string[] = []
    for (const item of contract.items) {
        if (item.cid === cid && item.enabled) {
            nodesInContract.push((await ItemModel._getItem(item.oid)).agid)
        }
    }
    // Nodes shared in partnership (filter out own cid)
    for (const remoteOrg of contract.organisations.filter((org) => org !== cid)) {
        // Check if node is shared in partnership
        const partnership = await CommunityModel._getPartnershipByCids(cid, remoteOrg)
        const remoteOrgObject = partnership.organisations.filter((org) => org.cid === cid)[0]
        // Return CID of org that will gain access to the nodes, name of partnership and nodes
        sharedNodes.push({ cid: remoteOrg, name: partnership.description, nodes: remoteOrgObject.nodes })
    }
    // Filter out nodes shared in partnership
    const notSharedNodes = Array.from(sharedNodes).map(org => {
        return {
            cid: org.cid,
            name: org.name,
            // Array->Set->Array to remove duplicates
            nodes: Array.from(new Set(nodesInContract.filter(node => !org.nodes.includes(node))))
        }
    }).filter(org => org.nodes.length > 0)

    return notSharedNodes
}

export const fixNotDiscoverableNodesInContract = async (ctid: string, cid: string): Promise<number> => {
    const contract = await ContractModel._getContract(ctid)
    if (!contract.organisations.includes(cid)) {
        throw new MyError('You are not part of this contract', HttpStatusCode.FORBIDDEN)
    }
    const problematicOrgs = await getNotDiscoverableNodesInContract(ctid, cid)
    let fixedNodes = 0
    for (const org of problematicOrgs) {
        // get commid
        const commid = (await CommunityModel._getPartnershipByCids(cid, org.cid)).commId
        for (const node of org.nodes) {
            // add node to community/partnership
            await CommunityService.addNode(commid, cid, node)
            fixedNodes += 1
        }
    }
    return fixedNodes
}

// Private 

const testAfterRemoving = async (ctid: string): Promise<boolean> => {
    // If only one party in contract --> REMOVE ORG FROM CONTRACT
    const contract = await ContractModel._getContract(ctid)
    if ((contract.organisations.length === 1 && contract.pendingOrganisations.length === 0)) {
        // last alone organisation left
        logger.debug('Removing last organisation')
        // remove last organisation
        await ItemModel._removeContractFromCompanyItems(contract.organisations[0], ctid)
        await ContractModel._removeOrgItemsFromContract(ctid, contract.organisations[0])
        await ContractModel._removeOrganisationFromContract(ctid, contract.organisations[0])
        await OrganisationModel._removeContract(contract.organisations[0], ctid)
    }
    // If now contract is empty --> REMOVE CONTRACT
    const contractDoc = await ContractModel._getDoc(ctid)
    if (contractDoc.organisations.length === 0) {
        logger.debug('Last organisation was removed - removing contract')
        // Remove hasContractRequests from pending organisations
        contractDoc.pendingOrganisations.forEach(async(o) => {
            await OrganisationModel._removeContractRequest(o,ctid)
        })
        // Remove pending invitations
        const notificationsToUpdate = await NotificationModel._findNotifications({
            owners: contractDoc.pendingOrganisations,
            status: NotificationStatus.WAITING,
            type: EventType.contractRequest,
            'object.id': ctid
        })
        // Update notification of contract request --> reject it
        for (const notif of notificationsToUpdate) {
            await NotificationModel._setRead(notif)
            await NotificationModel._setStatus(notif, NotificationStatus.REJECTED)
        }
        // Mark contract as deleted, remove parties
        await contractDoc._removeContract()
        // Remove all items from group
        const cs_users = await cs.getGroup(ctid)
        for (const user of cs_users.members) {
            // Members contain domain, exclude it before calling cs
            const jid = user.indexOf('@') !== -1 ? user.substring(0, user.indexOf('@')) : user
            await cs.deleteUserFromGroup(jid, ctid)
        }
        // Remove openfire group
        await cs.deleteGroup(ctid)
        return true
    }
    return false
}

