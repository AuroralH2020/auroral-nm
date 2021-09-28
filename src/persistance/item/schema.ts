import mongoose from 'mongoose'
import { getItem, getDoc, createItem, getAllItems, addUserToItem, removeUserFromItem } from './statics'
import { updateItem, removeItem } from './methods'
import { IItemDocument, IItemModel, ItemType, ItemStatus, ItemPrivacy } from './types'

const Schema = mongoose.Schema

const itemTypes = Object.values(ItemType)
const statuses = Object.values(ItemStatus)
const privacyLevels = Object.values(ItemPrivacy)

const ItemSchema = new Schema<IItemDocument, IItemModel>({
    oid: { type: String, index: true, required: true },
    name: { type: String, required: true },
    cid: { type: String, required: true }, // unique organisation id
    agid: { type: String, required: true }, // agent that has item id
    uid: { type: String, required: false }, // user owner id
    status: { type: String, default: ItemStatus.DISABLED, enum: statuses },
    type: { type: String, required: true, enum: itemTypes },
    accessLevel: { type: Number, default: ItemPrivacy.PRIVATE, enum: privacyLevels },
    avatar: String,
    description: String,
    // semanticType: string,
    // interactionPatterns: ??[],
    // hasContracts: string[],
    // hasAudits: string[],
    // mode: Production and testing ??
    lastUpdated: { type: Number, default: new Date().getTime() },
    created: { type: Number, default: new Date().getTime() }
})

// Statics

ItemSchema.statics._getItem = getItem
ItemSchema.statics._getDoc = getDoc
ItemSchema.statics._createItem = createItem
ItemSchema.statics._getAllItems = getAllItems
ItemSchema.statics._addUserToItem = addUserToItem
ItemSchema.statics._removeUserFromItem = removeUserFromItem

// Methods

ItemSchema.methods._updateItem = updateItem
ItemSchema.methods._removeItem = removeItem // Not delete record, keep some info for future inspection if needed

// eslint-disable-next-line import/no-default-export
export default ItemSchema
