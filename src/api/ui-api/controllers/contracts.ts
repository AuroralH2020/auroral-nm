// Controller common imports
import { expressTypes, localsTypes } from '../../../types/index'
import { HttpStatusCode, logger, responseBuilder } from '../../../utils'
import { errorHandler, MyError } from '../../../utils/error-handler'

// Controller specific imports
import { OrganisationModel } from '../../../persistance/organisation/model'
import { NotificationModel } from '../../../persistance/notification/model'
import { ContractModel } from '../../../persistance/contract/model'
import { ContractService } from '../../../core'
import {
    ContractItemType,
    ContractStatus,
    ContractType,
    IContractUI,
    IContractUpdate
} from '../../../persistance/contract/types'
import { ContractItemSelect } from '../../../persistance/item/types'
import { EventType } from '../../../types/misc-types'
import { NotificationStatus } from '../../../persistance/notification/types'
import { ItemModel } from '../../../persistance/item/model'
import { getNotDiscoverableNodesInContract } from '../../../core/contracts'

// Controllers

type getContractController = expressTypes.Controller<{ ctid: string }, {}, {}, IContractUI, localsTypes.ILocals>

export const getContract: getContractController = async (req, res) => {
    const { ctid } = req.params
    const { decoded } = res.locals
    try {
        // Get contract
        const contract = await ContractModel._getContractUI(ctid)
        // Test if org participates
        if (!((contract.organisations).includes(decoded.cid)) && !((contract.pendingOrganisations).includes(decoded.cid))) {
            throw new MyError('You are not allowed to view this contract', HttpStatusCode.BAD_REQUEST)
        }
        return responseBuilder(HttpStatusCode.OK, res, null, contract)
    } catch (err) {
        const error = errorHandler(err)
        logger.error({ msg: error.message, id: res.locals.reqId })
        return responseBuilder(error.status, res, error.message)
    }
}

type editContractController = expressTypes.Controller<{ ctid: string }, IContractUpdate, {}, {}, localsTypes.ILocals>

export const editContract: editContractController = async (req, res) => {
    const { ctid } = req.params
    const { decoded } = res.locals
    const data = req.body
    try {
        // Check contract ownership
        const contract = await ContractModel._getContractUI(ctid)
        if (!contract.organisations.includes(decoded.cid)) {
            throw new MyError('You are not allowed to edit this contract', HttpStatusCode.FORBIDDEN)
        }
        await ContractService.updateOne(ctid, data)
        return responseBuilder(HttpStatusCode.OK, res, null)
    } catch (err) {
        const error = errorHandler(err)
        logger.error({ msg: error.message, id: res.locals.reqId })
        return responseBuilder(error.status, res, error.message)
    }
}

type acceptContractController = expressTypes.Controller<{ ctid: string }, {}, {}, {}, localsTypes.ILocals>

export const acceptContract: acceptContractController = async (req, res) => {
    const { ctid } = req.params
    const { decoded } = res.locals
    try {
        await ContractService.acceptContractRequest(ctid, decoded.cid, decoded.sub, res.locals.audit, res.locals.token)
        return responseBuilder(HttpStatusCode.OK, res, null)
    } catch (err) {
        const error = errorHandler(err)
        logger.error({ msg: error.message, id: res.locals.reqId })
        return responseBuilder(error.status, res, error.message)
    }
}

type rejectContractController = expressTypes.Controller<{ ctid: string }, {}, {}, {}, localsTypes.ILocals>

export const rejectContract: rejectContractController = async (req, res) => {
    const { ctid } = req.params
    const { decoded } = res.locals
    try {
        await ContractService.rejectContractRequest(ctid, decoded.cid, decoded.sub, res.locals.audit, res.locals.token)
        return responseBuilder(HttpStatusCode.OK, res, null)
    } catch (err) {
        const error = errorHandler(err)
        logger.error({ msg: error.message, id: res.locals.reqId })
        return responseBuilder(error.status, res, error.message)
    }
}

type inviteOrganisationsController = expressTypes.Controller<{ ctid: string }, { cids: string[] }, {}, {}, localsTypes.ILocals>

export const inviteOrganisations: inviteOrganisationsController = async (req, res) => {
    const { ctid } = req.params
    const { cids } = req.body
    const { decoded } = res.locals
    try {
        // Test if company belongs to contract
        if (!(await OrganisationModel._getOrganisation(decoded.cid)).hasContracts.includes(ctid)) {
            throw new MyError('Can not invite to contract where you are not included')
        }
        // get my data
        const myOrg = await OrganisationModel._getOrganisation(decoded.cid)
        cids.forEach((cid) => {
            if (!(myOrg.knows).includes(cid)) {
                throw new MyError('You have to be friends to send contract request', HttpStatusCode.BAD_REQUEST)
            }
        })
        // invite organisations
        for (const cid of cids) {
            // Create Notifications and fill hasContracts for all organisations
            await OrganisationModel._addContractRequest(cid, ctid)
            const remoteOrg = await OrganisationModel._getOrganisation(cid)
            await NotificationModel._createNotification({
                owner: cid,
                actor: { id: decoded.cid, name: myOrg.name },
                target: { id: cid, name: remoteOrg.name },
                object: { id: ctid, name: 'Private contract' },
                type: EventType.contractRequest,
                status: NotificationStatus.WAITING
            })
        }
        // Update contract status
        const contract = await ContractModel._getDoc(ctid)
        await contract._updateStatus()
        return responseBuilder(HttpStatusCode.OK, res, null)
    } catch (err) {
        const error = errorHandler(err)
        logger.error({ msg: error.message, id: res.locals.reqId })
        return responseBuilder(error.status, res, error.message)
    }
}

type getContractsController = expressTypes.Controller<{}, {}, { type: ContractType, offset: number, status: ContractStatus }, IContractUI[], localsTypes.ILocals>

export const getContracts: getContractsController = async (req, res) => {
    const { decoded } = res.locals
    const { type, offset, status } = req.query
    try {
        const org = await OrganisationModel._getOrganisation(decoded.cid)
        const contracts = (org.hasContracts).concat(org.hasContractRequests)
        const data = await ContractService.getMany({ ctid: contracts, type, status, offset })
        return responseBuilder(HttpStatusCode.OK, res, null, data)
    } catch (err) {
        return responseBuilder(HttpStatusCode.OK, res, null, [] as IContractUI[])
    }
}

type getContractItemController = expressTypes.Controller<{ ctid: string }, {}, { offset: number }, ContractItemType[], localsTypes.ILocals>

export const getContractItems: getContractItemController = async (req, res) => {
    const { decoded } = res.locals
    const { offset } = req.query
    const { ctid } = req.params
    try {
        const contracts = (await OrganisationModel._getOrganisation(decoded.cid)).hasContracts
        contracts.concat((await OrganisationModel._getOrganisation(decoded.cid)).hasContractRequests)
        if (!contracts.includes(ctid)) {
            throw new MyError('You are not allowed to see contract details')
        }
        const items = await ContractModel._getContractItemsUI(ctid, offset)
        return responseBuilder(HttpStatusCode.OK, res, null, items)
    } catch (err) {
        const error = errorHandler(err)
        logger.error({ msg: error.message, id: res.locals.reqId })
        return responseBuilder(error.status, res, error.message)
    }
}

type postContractController = expressTypes.Controller<{}, { organisations: string[], termsAndConditions: string, description?: string }, {}, null, localsTypes.ILocals>

export const createContract: postContractController = async (req, res) => {
    const { organisations, termsAndConditions, description } = req.body
    const { decoded } = res.locals
    try {
        await ContractService.createOne({ cid: decoded.cid, uid: decoded.sub, termsAndConditions, organisations, description }, res.locals.audit, res.locals.token)
        return responseBuilder(HttpStatusCode.OK, res, null, null)
    } catch (err) {
        const error = errorHandler(err)
        logger.error({ msg: error.message, id: res.locals.reqId })
        return responseBuilder(error.status, res, error.message)
    }
}

type removeOrgFromContractCtrl = expressTypes.Controller<{ctid: string}, {}, {}, null, localsTypes.ILocals>

export const removeOrgFromContract: removeOrgFromContractCtrl = async (req, res) => {
    const { ctid } = req.params
    const { decoded } = res.locals
    try {
        // call service. There is everything handled
        await ContractService.removeOrgFromContract(ctid,decoded.cid, decoded.sub, res.locals.audit, res.locals.token)
        return responseBuilder(HttpStatusCode.OK, res, null, null)
    } catch (err) {
        const error = errorHandler(err)
        logger.error({ msg: error.message, id: res.locals.reqId })
        return responseBuilder(error.status, res, error.message)
    }
}

type addItemController = expressTypes.Controller<{ ctid: string, oid: string }, { rw: boolean, enabled?: boolean }, {}, null, localsTypes.ILocals>

export const addItem: addItemController = async (req, res) => {
    const { ctid, oid } = req.params
    const { rw, enabled } = req.body
    const { decoded } = res.locals
    try {
        const item = await ItemModel._getItem(oid)
        const org = await OrganisationModel._getOrganisation(decoded.cid)
        const contract = await ContractModel._getContract(ctid)
        if (!org.hasContracts.includes(ctid)) {
            throw new MyError('You are not allowed to add items to this contract', HttpStatusCode.BAD_REQUEST)
        }
        if (!contract.organisations.includes(item.cid)) {
            throw new MyError('Item can not be part of this contract', HttpStatusCode.BAD_REQUEST)
        }
        if (item.uid === decoded.sub) {
            // owner is inserting item
            const toEnable = enabled === undefined ? true : enabled
            await ContractService.addItem({ ctid, oid, rw, enabled: toEnable }, res.locals.token)
        } else {
            // someone else is inserting item
            await ContractService.addItem({ ctid, oid, rw, enabled: false }, res.locals.token)
            // TODO Notif and audits?
            // Notify owner of item
            const myOrg = await OrganisationModel._getOrganisation(decoded.cid)
            const itemOrg = await OrganisationModel._getOrganisation(item.cid)
            await NotificationModel._createNotification({
                owner: itemOrg.cid,
                actor: { id: decoded.cid, name: myOrg.name },
                target: { id: item.oid, name: item.name },
                object: { id: ctid, name: 'Private contract' },
                type: EventType.contractItemUpdated,
                status: NotificationStatus.INFO
            })
        }
        return responseBuilder(HttpStatusCode.OK, res, null, null)
    } catch (err) {
        const error = errorHandler(err)
        logger.error({ msg: error.message, id: res.locals.reqId })
        return responseBuilder(error.status, res, error.message)
    }
}

type editItemController = expressTypes.Controller<{ctid: string, oid: string}, {rw: boolean, enabled: boolean}, {}, null, localsTypes.ILocals>

export const editItem: editItemController = async (req, res) => {
    const { ctid, oid } = req.params
    const { rw, enabled } = req.body
    const { decoded } = res.locals
    try {
        const item = await ItemModel._getDoc(oid)
        if (item.cid !== decoded.cid) {
            throw new MyError('You are not allowed to edit this item', HttpStatusCode.FORBIDDEN)
        }
        await ContractService.editItem(ctid, oid, { enabled, rw }, res.locals.token)
        // TODO Notif and audits
        return responseBuilder(HttpStatusCode.OK, res, null, null)
    } catch (err) {
        const error = errorHandler(err)
        logger.error({ msg: error.message, id: res.locals.reqId })
        return responseBuilder(error.status, res, error.message)
    }
}

type removeItemController = expressTypes.Controller<{ctid: string, oid: string}, {}, {}, null, localsTypes.ILocals>

export const removeItem: removeItemController = async (req, res) => {
    const { ctid, oid } = req.params
    const { decoded } = res.locals
    try {
        const item = await ItemModel._getItem(oid)
        if (item.cid !== decoded.cid) {
            throw new MyError('You are not allowed to remove this item', HttpStatusCode.FORBIDDEN)
        }
        await ContractService.removeItems(ctid, [oid], decoded.cid, res.locals.token)
        // TODO Notif and audits
        return responseBuilder(HttpStatusCode.OK, res, null, null)
    } catch (err) {
        const error = errorHandler(err)
        logger.error({ msg: error.message, id: res.locals.reqId })
        return responseBuilder(error.status, res, error.message)
    }
}

type removeAllCompanyItemsCtrl = expressTypes.Controller<{ctid: string, cid: string}, {}, {}, null, localsTypes.ILocals>

export const removeAllCompanyItems: removeAllCompanyItemsCtrl = async (req, res) => {
    const { ctid, cid } = req.params
    const { decoded } = res.locals
    try {
        const items = await ContractModel._getOrgItemsInContract(ctid, cid)
        await ContractService.removeItems(ctid, items, decoded.cid, res.locals.token)
        // TODO Notif and audits
        return responseBuilder(HttpStatusCode.OK, res, null, null)
    } catch (err) {
        const error = errorHandler(err)
        logger.error({ msg: error.message, id: res.locals.reqId })
        return responseBuilder(error.status, res, error.message)
    }
}

type getCompanyItemsController = expressTypes.Controller<{ ctid: string }, {}, {}, ContractItemSelect[], localsTypes.ILocals>

export const getCompanyItems: getCompanyItemsController = async (req, res) => {
    const { ctid } = req.params
    const { decoded } = res.locals
    try {
        const orgItems = await ItemModel._getAllCompanyItemsContractView(decoded.cid ,ctid)
        return responseBuilder(HttpStatusCode.OK, res, null, orgItems)
    } catch (err) {
        const error = errorHandler(err)
        logger.error({ msg: error.message, id: res.locals.reqId })
        return responseBuilder(error.status, res, error.message)
    }
}

type checkNodesSharingController = expressTypes.Controller<{ctid: string}, {}, {}, { cid: string, nodes: string[], name: string } [], localsTypes.ILocals>

export const checkNodesSharing: checkNodesSharingController = async (req, res) => {
    const { ctid } = req.params
    const { decoded } = res.locals
    try {
        const result =  await getNotDiscoverableNodesInContract(ctid, decoded.cid)
        return responseBuilder(HttpStatusCode.OK, res, null, result)
    } catch (err) {
        const error = errorHandler(err)
        logger.error({ msg: error.message, id: res.locals.reqId })
        return responseBuilder(error.status, res, error.message)
    }
}

type fixNodeSharingController = expressTypes.Controller<{ ctid: string }, {}, {}, number, localsTypes.ILocals>

export const fixNodeSharing: fixNodeSharingController = async (req, res) => {
    const { ctid } = req.params
    const { decoded } = res.locals
    try {
        const fixedNodes = await ContractService.fixNotDiscoverableNodesInContract(ctid, decoded.cid)
        return responseBuilder(HttpStatusCode.OK, res, null, fixedNodes)
    } catch (err) {
        const error = errorHandler(err)
        logger.error({ msg: error.message, id: res.locals.reqId })
        return responseBuilder(error.status, res, error.message)
    }
}
