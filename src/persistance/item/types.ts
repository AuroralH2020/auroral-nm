import { Document, Model } from 'mongoose'
import { getAllCompanyItemsContractView } from './statics'

export enum ItemType {
    DEVICE = 'Device',
    SERVICE = 'Service',
    MARKETPLACE = 'Marketplace'
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

export enum ItemDomainType {
    ENERGY = 'Energy',
    UNDEFINED = 'Undefined',
    MOBILITY = 'Mobility',
    HEALTH = 'Health',
    FARMING = 'Farming',
    TOURISM = 'Tourism',
    WEATHER = 'Weather',
    INDOORQUALITY = 'Indoor quality'
}

export type ItemLabelsObj = {
    domain: ItemDomainType,
}
export interface ContractItemSelect {
    rw: boolean,
    enabled: boolean,
    name: string,
    oid: string,
    uid: string,
    owner: string,
    status: ItemStatus,
    accessLevel: ItemPrivacy,
    type: ItemType,
    labels: ItemLabelsObj,
    contracted: boolean
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
    description?: string,
    labels: ItemLabelsObj,
    // semanticType: string,
    // interactionPatterns: ??[],
    hasContracts: string[],  // NOT USED
    hasCommunities: string[],  // NOT USED
    // hasAudits: string[],
    // mode: Production and testing ??
    // Timestamps
    lastUpdated: number,
    created: number
}

// Interface used to send item  privacy value to Nodes
export interface IItemPrivacy {
    oid: string, // Auroral Id
    privacy: ItemPrivacy, // Privacy level of the item
}

// Interface to Items returned to UI
export interface IItemUI extends IItem {
    // Query enrichment
    companyName?: string, // Organisation Name: Is added after the get query
    online?: boolean // Is online in CS
    owner?: { // User owner info
        name: string,
        email: string
    },
    gateway?: { // Item gateway
        name: string
    }
    labels: ItemLabelsObj,
    contract?:{
        contracted: boolean,
        ctid: string,
        contractable: boolean
    }
}

// Input to create a new Item
export interface IItemCreate {
    name: string, // fullName
    type: ItemType,
    oid: string,
    labels: ItemLabelsObj
    // semanticType: string,
    // interactionPatterns: ??[]
}

// Input to create a new Item
export interface IItemCreatePost {
    name: string, // fullName
    agid: string,
    cid: string, // unique organisation id
    type?: ItemType,
    oid?: string,
    labels?: ItemLabelsObj
    // semanticType: string,
    // interactionPatterns: ??[]
}

// Input to update Item
export interface IItemUpdate {
    oid?: string,
    name?: string, // fullName
    agid?: string,
    avatar?: string,
    accessLevel?: ItemPrivacy,
    status?: ItemStatus,
    description?: string,
    labels?: ItemLabelsObj
    // interactionPatterns: ??[]
}

// Input update Item from gateway
export interface IGatewayItemUpdate {
    oid: string,
    name?: string, // fullName
    avatar?: string,
    description?: string,
    labels?: ItemLabelsObj
}

export type GetAllQuery = {
    cid?: string | { $in: string[] },
    type: ItemType,
    accessLevel?: ItemPrivacy,
    $or?: { accessLevel: ItemPrivacy }[],
    'labels.domain'?:  ItemDomainType,
    status?: ItemStatus |{ $ne: ItemStatus }
}

export type GetByOwnerQuery = {
    cid: string,
    uid?: string, 
    type: ItemType,
    accessLevel?: ItemPrivacy,
    $or?: { accessLevel?: ItemPrivacy }[],
    status: ItemStatus | 
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
    _getItemsPrivacy: (
        this: IItemModel,
        oids: string[],
    ) => Promise<IItemPrivacy[]>
    _getByOwner: (
        this: IItemModel,
        params: GetByOwnerQuery,
        offset: number,
    )=> Promise<IItem[]>
    _addUserToItem: (
        this: IItemModel,
        oid: string,
        uid: string
    ) => Promise<void>
    _removeUserFromItem: (
        this: IItemModel,
        oid: string
    ) => Promise<void>
    _addContract: (
        this: IItemModel,
        oid: string,
        ctid: string
    ) => Promise<void>
    _removeContract: (
        this: IItemModel,
        oid: string,
        ctid: string
    ) => Promise<void>
    _removeContractFromCompanyItems: (
        this: IItemModel,
        cid: string,
        ctid: string
    ) => Promise<void>
    _getAllCompanyItemsContractView: (
        this: IItemModel,
        cid: string,
        ctid: string
    ) => Promise<ContractItemSelect[]>
    _count: (
        this: IItemModel,
    ) => Promise<number>
}
