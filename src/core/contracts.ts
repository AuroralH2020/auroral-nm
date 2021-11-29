/**
 * Core functionality of NODES
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
import { errorHandler, ErrorSource, MyError } from '../utils/error-handler'
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
import { ContractService } from './index'
import { IAuditLocals } from '../types/locals-types'
import { OrganisationStatus } from '../persistance/organisation/types'
import { xmpp } from '../microservices/xmppClient'

// Functions

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
        const contracts = await ContractModel._getAllContracts(query, Number(args.offset))
        // TBD enrich data
        return contracts
    } catch (err) {
        const error = errorHandler(err)
        throw error
    }
}

export const testAfterRemoving = async (ctid: string): Promise<boolean> => {
    try {
        let contract = await ContractModel._getContract(ctid)
        if ((contract.organisations.length === 1 && contract.pendingOrganisations.length === 0)) {
            // last alone organisation left
            logger.debug('Removing last organisation')
            // remove last organisation
            await ItemModel._removeContractFromCompanyItems(contract.organisations[0], ctid)
            await ContractModel._removeOrgItemsFromContract(ctid, contract.organisations[0])
            await ContractModel._removeOrganisationFromContract(ctid, contract.organisations[0])
            await OrganisationModel._removeContract(contract.organisations[0], ctid)
        }
        contract = await ContractModel._getContract(ctid)
        if (contract.organisations.length === 0) {
            logger.debug('Last organisation was removed - removing contract')
            // Last organisation was removed -> remove contract
            const contractDoc = await ContractModel._getDoc(ctid)
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
            // Remove openfire group
            await cs.deleteGroup(ctid)
            // Send XMPP notification to agents
            const agids = await ContractModel._getNodesInContract(ctid)
            for (const agid of agids) {
                await xmpp.notifyContractChanged(agid, ctid)
            }
            return true
        }
        return false
    } catch (err) {
        const error = errorHandler(err)
        logger.debug(error.message)
        throw error
    }
}
export const createOne = async (cid: string, uid: string, termsAndConditions: string, organisations: string[], audit: IAuditLocals, description?: string): Promise<string> => {
    try {
        // get my data for notifications and audits
        const myOrg = await OrganisationModel._getOrganisation(cid)
        const myUser = await UserModel._getUser(uid)

        if (organisations.length !== 1) {
            throw new MyError('Contracts between multiple organisations are not allowed ', HttpStatusCode.BAD_REQUEST)
        }
        // test if user is trying to invite his organisation
        if (organisations[0] === cid) {
            throw new MyError('Can not invite own organisation', HttpStatusCode.BAD_REQUEST)
        }
        const org =  await OrganisationModel._getOrganisation(organisations[0])
        // test if org exists
        if (org.status !== OrganisationStatus.ACTIVE) {
            throw new MyError('Invited organisation is not active', HttpStatusCode.BAD_REQUEST)
        }
        if (!(org.knows).includes(cid)) {
            throw new MyError('You have to be friends to send contract request', HttpStatusCode.BAD_REQUEST)
        }
        // Test if same there is already contract with same org
        const org1AllContracts = org.hasContracts.concat(org.hasContractRequests)
        const org2AllContracts = myOrg.hasContracts.concat(myOrg.hasContractRequests)
        if (org1AllContracts.filter(value => org2AllContracts.includes(value)).length !== 0) {
            throw new MyError('You already have contract with given organisation', HttpStatusCode.BAD_REQUEST)
        }
        // Create contract
        const contractData: IContractCreate = { termsAndConditions, organisations: [cid], pendingOrganisations: organisations, description }
        // Create contract
        const contract = await ContractModel._createContract(contractData)
        // Add contract to first organisation
        await OrganisationModel._addContract(cid, contract.ctid)

        // Create Notifications and fill hasContracts for all organisations
        let contractName = 'contract: ' + myOrg.name
        for (const org of organisations) {
            await OrganisationModel._addContractRequest(org, contract.ctid)
            const remoteOrg = await OrganisationModel._getOrganisation(org)
            contractName += ' ' + remoteOrg.name
            await NotificationModel._createNotification({
                owner: org,
                actor: { id: cid, name: myOrg.name },
                target: { id: org, name: remoteOrg.name },
                object: { id: contract.ctid, name: 'Private contract' },
                type: EventType.contractRequest,
                status: NotificationStatus.WAITING
            })
        }
        // Audits
        await AuditModel._createAudit({
            ...audit,
            actor: { id: cid, name: myUser.name },
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

export const removeOrgFromContract = async (ctid: string, cid: string, uid: string, audit: IAuditLocals): Promise<void> => {
    // Remove org items from contract
    // const itemsToRemove = await ContractModel._getOrgItemsInContract(ctid, cid)
    await ItemModel._removeContractFromCompanyItems(cid, ctid)
    await ContractModel._removeOrgItemsFromContract(ctid, cid)
    // Remove org from contract
    await ContractModel._removeOrganisationFromContract(ctid, cid)
    await OrganisationModel._removeContract(cid, ctid)
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
    const removed = await ContractService.testAfterRemoving(ctid)
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
}

export const rejectContractRequest = async (ctid: string, cid: string, uid: string, audit: IAuditLocals): Promise<void> => {
    // Test if rejecting  is possible
    if (!(await OrganisationModel._getOrganisation(cid)).hasContractRequests.includes(ctid)) {
        throw new MyError('Can not reject this contract')
    }
    // Remove org from contract
    await ContractModel._removePendingOrganisationFromContract(ctid, cid)
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
    const removed = await ContractService.testAfterRemoving(ctid)
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
}
export const acceptContractRequest = async (ctid: string, cid: string, uid: string, audit: IAuditLocals): Promise<void> => {
    // Test if accepting is possible
    if (!(await OrganisationModel._getOrganisation(cid)).hasContractRequests.includes(ctid)) {
        throw new MyError('Can not accept this contract')
    }
    // Add org to contract
    await ContractModel._orgAcceptsContract(ctid, cid)
    // Update conract status
    const contract = await ContractModel._getDoc(ctid)
    await contract._updateStatus()
    // add contract to org (also remove from hasContractRequests)
    await OrganisationModel._addContract(cid, ctid)
    const notificationsToUpdate = await NotificationModel._findNotifications({
        owners: [cid],
        status: NotificationStatus.WAITING,
        type: EventType.contractRequest,
        'object.id': ctid ,
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
    // Send XMPP notification to agents
    const agids = await ContractModel._getNodesInContract(ctid)
    for (const agid of agids) {
        await xmpp.notifyContractChanged(agid, ctid)
    }
}

export const updateOne = async (ctid: string, data: IContractUpdate): Promise<string> => {
    try {
        // Create contract
        const contract = await ContractModel._getDoc(ctid)
        await contract._updateContract(data)
        // TBD Notification? and Audit
        return contract.ctid
    } catch (err) {
        const error = errorHandler(err)
        logger.error(error.message)
        throw error
    }
}
export const addItem = async (ctid: string, oid: string, rw: boolean, enabled: boolean): Promise<void> => {
    try {
        // Create contract
        const item = await ItemModel._getItem(oid)
        const user = await UserModel._getUser(item.uid)
        const contract = await ContractModel._getContract(ctid)
        if (item.status !== ItemStatus.ENABLED || item.accessLevel === ItemPrivacy.PRIVATE) {
            throw  new MyError('You have to include only ENABLED and not PRIVATE items', HttpStatusCode.BAD_REQUEST)
        }
        if (enabled) {
            // add to openfire group if enabled == true
            await cs.addUserToGroup(oid, ctid)
        }
        // test if item is already included in contract
        if ((contract.items).some((item) => {
            return item.oid === oid
            })) {
            throw  new MyError('Item is already included in contract', HttpStatusCode.BAD_REQUEST)
        }
        // Add item to contract
        const contractItem : ContractItemType = { enabled, rw, type: item.type, oid, cid: item.cid, uid: item.uid, userMail: user.email }
        await ContractModel._addItem(ctid, contractItem)
        // Add contract to item
        await ItemModel._addContract(oid, ctid)
        // Send XMPP notification to agents
        const agids = await ContractModel._getNodesInContract(ctid)
        for (const agid of agids) {
            await xmpp.notifyContractChanged(agid, ctid)
        }
        // TODO notifications if sent from gateway
    } catch (err) {
        const error = errorHandler(err)
        logger.error(error.message)
        throw error
    }
}

export const editItem = async (ctid: string, oid: string, data: IContractItemUpdate): Promise<void> => {
    try {
        const item = await ContractModel._getItem(ctid, oid)
        if (!item) {
            throw new MyError('Can not edit item which is not in contract', HttpStatusCode.BAD_REQUEST)
        }
        // Edit item
        await ContractModel._editItem(ctid, oid, data)
        // enabled has changed
        if (data.enabled !== undefined && data.enabled !== item.enabled) {
            if (data.enabled) {
                // Add to openfire group
                await cs.addUserToGroup(oid, ctid)
            } else {
                // Remove from openfire group
                await cs.deleteUserFromGroup(oid, ctid)
            }
        }
        // Send XMPP notification to agents
        const agids = await ContractModel._getNodesInContract(ctid)
        for (const agid of agids) {
            await xmpp.notifyContractChanged(agid, ctid)
        }
    } catch (err) {
        const error = errorHandler(err)
        logger.error(error.message)
        throw error
    }
}

export const removeItems = async (ctid: string, oids: string[]): Promise<void> => {
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
            } catch  {
                logger.error('One item was not removed: ' + oid)
            }
            // remove openfire group
            await cs.deleteUserFromGroup(oid, ctid)
        }))
        // Send XMPP notification to agents
        const agids = await ContractModel._getNodesInContract(ctid)
        for (const agid of agids) {
            await xmpp.notifyContractChanged(agid, ctid)
        }
    } catch (err) {
        const error = errorHandler(err)
        logger.error(error.message)
        throw error
    }
}

