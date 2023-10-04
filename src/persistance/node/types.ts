import { Document, Model } from 'mongoose'
import { SearchResult } from '../../types/misc-types'
import { ItemType } from '../../persistance/item/types'

export enum NodeType {
    VICINITY = 'Vicinity',
    SHARQ = 'Sharq',
    AURORAL = 'Auroral'
}

export enum NodeStatus {
    ACTIVE = 'active',
    DELETED = 'deleted'
}

export type DefaultOwnerType = {
    Device: string,
    Service: string,
    Marketplace: string,
    Dataset: string
}

export type DefaultOwnerTypeUpdate = {
    Device?: string,
    Service?: string,
    Marketplace?: string,
}

export type VersionsType = {
    agent: string,
    gtw: string,
    wot: string,
}

export type NodeInfoType =  {
    versions?: VersionsType,
}
export interface INode {
    // context: string
    agid: string, // ID in Auroral
    name: string, // Name of Node given by User
    cid: string, // organisation id in Auroral
    type: NodeType, // Project the node belongs to
    // location: string,
    status: NodeStatus,
    defaultOwner: DefaultOwnerType,
    info?: NodeInfoType,
    visible: boolean, // True if is it discoverable in the P2P network
    hasItems: string[], // Ids of items under the node
    hasCommunities: string[] // Ids of communities where node is part of
    itemsCount: number, // Count of items (hasItems.length())
    hasKey: boolean, // Has token auth enabled for the node
    key: string | null, // Has public key to validate token
    // Timestamps
    lastUpdated: number, 
    created: number
}

export type INodeExternal = {
    agid: string, // ID in Auroral
    name: string, // Name of Node given by User
    cid: string, // organisation id in Auroral
    hasKey: boolean, // Has token auth enabled for the node
    visible: boolean, // True if is it discoverable in the P2P network
    defaultOwner: DefaultOwnerType,
    itemsCount: number, // Count of items (hasItems.length())
}

export interface INodeUI {
    agid: string, // unique Node id
    name: string,
    cid: string, // unique organisation id
    type: NodeType,
    info?: NodeInfoType,
    // location: string,
    status: NodeStatus,
    hasItems: string[],
    defaultOwner: DefaultOwnerType,
    itemsCount: number,
    hasKey: boolean,
    visible: boolean,
    lastUpdated: number,
    created: number
}

// Input to create a new Node
export interface INodeCreate {
    name: string,
    type: NodeType,
    password: string,
    communities?: string[]
    // location: string
}

// Input to create a new Node
export interface INodeCreatePost {
    name: string,
    type: NodeType,
    cid: string,
    // location: string
}

// Input to update a Node
export interface INodeUpdate {
    name?: string,
    key?: string,
    visible?: boolean
    // location: string
}

export interface INodeDocument extends INode, Document {
    _updateNode: (this: INodeDocument, data: INodeUpdate) => Promise<INodeDocument>
    _removeNode: (this: INodeDocument) => Promise<void>
}

export interface INodeModel extends Model<INodeDocument> {
    _getNode: (
        this: INodeModel,
        agid: string,
        cid?: string
    ) => Promise<INodeUI>
    _getDoc: (
        this: INodeModel,
        agid: string,
        cid?: string
    ) => Promise<INodeDocument>
    _createNode: (
        this: INodeModel,
        data: INodeCreatePost
    ) => Promise<INodeDocument>
    _getAllNodes: (
        this: INodeModel,
        nodes: string[]
    ) => Promise<INodeUI[]>
    _addItemToNode: (
        this: INodeModel,
        agid: string,
        oid: string
    ) => Promise<void>
    _removeItemFromNode: (
        this: INodeModel,
        agid: string,
        oid: string
    ) => Promise<void>
    _getKey: (
        this: INodeModel,
        agid: string
    ) => Promise<string | null>
    _removeKey: (
        this: INodeModel,
        agid: string
    ) => Promise<void>
    _addNodeInfo: (
        this: INodeModel,
        agid: string,
        info: NodeInfoType
    ) => Promise<void>
    _addDefaultOwner: (
        this: INodeModel,
        agid: string,
        uid: string,
        type?: ItemType 
    ) => Promise<string | null>
    _removeDefaultOwner: (
        this: INodeModel,
        agid: string,
        type: ItemType 
    ) => Promise<void>
    _addToCommunity: (
        this: INodeModel,
        agid: string,
        commId: string,
    ) => Promise<void>
    _removeFromCommunity: (
        this: INodeModel,
        agid: string,
        commId: string,
    ) => Promise<void>
    _count: (
        this: INodeModel,
    ) => Promise<number>
    _search: (
        this: INodeModel,
        cid: string,
        text: string,
        limit: number,
        offset: number
    ) => Promise<SearchResult[]>
}
