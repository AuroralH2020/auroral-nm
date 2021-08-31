import { Document, Model } from 'mongoose'

export enum ItemType {
    DEVICE = 'Device',
    SERVICE = 'Service'
}

export enum ItemStatus {
    DISABLED = 'Disabled',
    ENABLED = 'Enabled',
    DELETED = 'Deleted'
}

export enum ItemPrivacy {
    PUBLIC = 2,
    FOR_FRIENDS = 1,
    PRIVATE = 0
}

export interface IItem {
    // context: string
    name: string, // Name of item given by user
    oid: string, // Auroral Id
    agid: string, // Node Auroral Id
    uid: string, // User Auroral Id
    cid: string, // Organisation Auroral Id
    avatar?: string, // Base64 encoded Image or URI
    accessLevel: ItemPrivacy, // Privacy level of the item
    type: ItemType, // Subtype of the item
    status: ItemStatus,
    // semanticType: string,
    // interactionPatterns: ??[],
    // hasContracts: string[],
    // hasAudits: string[],
    // mode: Production and testing ??
    // Timestamps
    lastUpdated: number,
    created: number,
    // Query enrichment
    companyName?: string, // Organisation Name: Is added after the get query
    online?: boolean // Is online in CS
}

// Input to create a new Item
export interface IItemCreate {
    name: string, // fullName
    type: ItemType,
    oid: string
    // semanticType: string,
    // interactionPatterns: ??[]
}

// Input to create a new Item
export interface IItemCreatePost {
    name: string, // fullName
    agid: string,
    cid: string, // unique organisation id
    type?: ItemType,
    oid?: string
    // semanticType: string,
    // interactionPatterns: ??[]
}

// Input to create a new Item
export interface IItemUpdate {
    oid: string,
    name?: string, // fullName
    agid?: string,
    avatar?: string,
    accessLevel?: ItemPrivacy,
    status?: ItemStatus
    // interactionPatterns: ??[]
}

export type GetAllQuery = {
    cid?: string | { $in: string[] },
    type: ItemType,
    accessLevel?: ItemPrivacy |
                { $or: ItemPrivacy[] },
    status?: ItemStatus | 
            { $ne: ItemStatus }
}

export interface IItemDocument extends IItem, Document {
    _updateItem: (this: IItemDocument, data: IItemUpdate) => Promise<IItemDocument>
    _removeItem: (this: IItemDocument) => Promise<void>
}

export interface IItemModel extends Model<IItemDocument> {
    _getItem: (
        this: IItemModel,
        oid: string
    ) => Promise<IItem>
    _getDoc: (
        this: IItemModel,
        oid: string
    ) => Promise<IItemDocument>
    _createItem: (
        this: IItemModel,
        data: IItemCreatePost
    ) => Promise<IItemDocument>
    _getAllItems: (
        this: IItemModel,
        params: GetAllQuery,
        offset: number
    ) => Promise<IItem[]>
}
