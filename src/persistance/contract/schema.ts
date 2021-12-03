import mongoose from 'mongoose'
import {
    createContract,
    getAllContracts,
    getContract,
    getDoc,
    removeOrganisationFromContract,
    removeOrgItemsFromContract,
    getOrgItemsInContract,
    orgAcceptsContract,
    addItem,
    editItem,
    removeItems,
    removePendingOrganisationFromContract,
    getContractUI,
    getContractItemsUI,
    getContractItems,
    getCommonPrivateContracts,
    getItem,
    removeItemFromAllContracts,
    // getNodesInContract, 
    getItemsInContractByAgid
} from './statics'
import { removeContract, updateContract, updateStatus } from './methods'
import { ContractItemType, ContractStatus, ContractType, IContractDocument, IContractModel } from './types'
import { ItemType } from '../item/types'

const Schema = mongoose.Schema

const contractTypes = Object.values(ContractType)
const statuses = Object.values(ContractStatus)
const itemTypes = Object.values(ItemType)

const ContractItemSchema = new Schema<ContractItemType>({
    enabled: { type: Boolean, default: false },
    rw: { type: Boolean, default: false },
    oid: { type: String, required: true },
    uid: { type: String, required: true },
    userMail: { type: String, required: true },
    cid: { type: String, required: true },
    type: { type: String, enum: itemTypes },
    _id: false
})

const ContractSchema = new Schema<IContractDocument, IContractModel>({
    ctid: { type: String, index: true, unique: true, required: true }, // unique contract id
    termsAndConditions: { type: String, required: true },
    description: { type: String, default: 'Private contract' },
    type: { type: String, default: ContractType.PRIVATE, enum: contractTypes },
    organisations: [{ type: String, default: [] }],
    pendingOrganisations: [{ type: String, default: [] }],
    removedOrganisations: [{ type: String, default: [] }],
    items: [{ type: ContractItemSchema, default: [] }],
    status: { type: String, default: ContractStatus.PENDING, enum: statuses },
    lastUpdated: { type: Number, default: Date.now },
    created: { type: Number, default: Date.now }
})

// Statics
ContractSchema.statics._getContract = getContract
ContractSchema.statics._getContractUI = getContractUI
ContractSchema.statics._getDoc = getDoc
ContractSchema.statics._createContract = createContract
ContractSchema.statics._getAllContracts = getAllContracts
ContractSchema.statics._removeOrganisationFromContract = removeOrganisationFromContract
ContractSchema.statics._removePendingOrganisationFromContract = removePendingOrganisationFromContract
ContractSchema.statics._removeOrgItemsFromContract = removeOrgItemsFromContract
ContractSchema.statics._getOrgItemsInContract = getOrgItemsInContract
ContractSchema.statics._orgAcceptsContract = orgAcceptsContract
ContractSchema.statics._addItem = addItem
ContractSchema.statics._getItem = getItem
ContractSchema.statics._editItem = editItem
ContractSchema.statics._removeItems = removeItems
ContractSchema.statics._removeItemFromAllContracts = removeItemFromAllContracts
ContractSchema.statics._getContractItemsUI = getContractItemsUI
ContractSchema.statics._getContractItems = getContractItems
ContractSchema.statics._getCommonPrivateContracts = getCommonPrivateContracts
// ContractSchema.statics._getNodesInContract = getNodesInContract
ContractSchema.statics._getItemsInContractByAgid = getItemsInContractByAgid

// Methods

ContractSchema.methods._updateContract = updateContract
ContractSchema.methods._removeContract = removeContract // Not delete record, keep some info for future inspection if needed
ContractSchema.methods._updateStatus = updateStatus

// eslint-disable-next-line import/no-default-export
export default ContractSchema
