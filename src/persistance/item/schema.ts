import mongoose from 'mongoose'
import {
    getItem,
    getDoc,
    createItem,
    getAllItems,
    addUserToItem,
    removeUserFromItem,
    getByOwner,
    getItemsPrivacy,
    addContractToItem, removeContractFromItem, removeContractFromCompanyItems, getAllCompanyItemsContractView, count, search, getAllCompanyItems
} from './statics'
import { updateItem, removeItem } from './methods'
import { IItemDocument, IItemModel, ItemType, ItemStatus, ItemPrivacy, ItemLabelsObj, ItemDomainType } from './types'

const Schema = mongoose.Schema

const itemTypes = Object.values(ItemType)
const statuses = Object.values(ItemStatus)
const privacyLevels = Object.values(ItemPrivacy)
const domainType = Object.values(ItemDomainType)

const ItemLabelsObjSchema = new Schema<ItemLabelsObj>({
    domain: { type: String, required: true, enum: domainType, default: ItemDomainType.UNDEFINED }
}, { _id: false })

const ItemSchema = new Schema<IItemDocument, IItemModel>({
    oid: { type: String, index: true, unique: true, required: true },
    name: { type: String, required: true },
    cid: { type: String, required: true }, // unique organisation id
    agid: { type: String, required: true }, // agent that has item id
    uid: { type: String, required: false }, // user owner id
    status: { type: String, default: ItemStatus.DISABLED, enum: statuses },
    type: { type: String, required: true, enum: itemTypes },
    accessLevel: { type: Number, default: ItemPrivacy.PRIVATE, enum: privacyLevels },
    labels: { type: ItemLabelsObjSchema, required: true, default: { domain: ItemDomainType.UNDEFINED } },
    avatar: String,
    description: String,
    hasContracts: [{ type: String, default: [] }],
    hasCommunities: [{ type: String, default: [] }],
    // semanticType: string,
    // interactionPatterns: ??[],
    // hasAudits: string[],
    // mode: Production and testing ??
    lastUpdated: { type: Number, default: Date.now },
    created: { type: Number, default: Date.now }
})

// Statics

ItemSchema.statics._getItem = getItem
ItemSchema.statics._count = count
ItemSchema.statics._getDoc = getDoc
ItemSchema.statics._createItem = createItem
ItemSchema.statics._getAllItems = getAllItems
ItemSchema.statics._getAllCompanyItems = getAllCompanyItems
ItemSchema.statics._addUserToItem = addUserToItem
ItemSchema.statics._removeUserFromItem = removeUserFromItem
ItemSchema.statics._getItemsPrivacy = getItemsPrivacy
ItemSchema.statics._getByOwner = getByOwner
ItemSchema.statics._addContract = addContractToItem
ItemSchema.statics._removeContract = removeContractFromItem
ItemSchema.statics._removeContractFromCompanyItems = removeContractFromCompanyItems
ItemSchema.statics._getAllCompanyItemsContractView = getAllCompanyItemsContractView
ItemSchema.statics._search = search

// Methods

ItemSchema.methods._updateItem = updateItem
ItemSchema.methods._removeItem = removeItem // Not delete record, keep some info for future inspection if needed

// eslint-disable-next-line import/no-default-export
export default ItemSchema
