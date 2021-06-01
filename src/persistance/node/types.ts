import { Document, Model } from 'mongoose'
import { RolesEnum } from '../../types/roles' 

export enum NodeType {
    VICINITY = 'Vicinity',
    SHARQ = 'Sharq',
    AURORAL = 'Auroral'
}

export enum NodeStatus {
    ACTIVE = 'active',
    DELETED = 'deleted'
}

export interface INode {
    agid: string, // unique Node id
    name: string, // fullName
    cid: string, // unique organisation id
    type: NodeType,
    // location: string,
    status: NodeStatus,
    hasItems: string[],
    itemsCount: number,
    hasKey: boolean,
    key: string | null,
    lastUpdated: number,
    created: number
}

export interface INodeUI {
    agid: string, // unique Node id
    name: string,
    cid: string, // unique organisation id
    type: NodeType,
    // location: string,
    status: NodeStatus,
    hasItems: string[],
    itemsCount: number,
    hasKey: boolean,
    lastUpdated: number,
    created: number
}

// Input to create a new Node
export interface INodeCreate {
    name: string,
    type: NodeType,
    password: string,
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
    key?: string
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
        cid: string
    ) => Promise<INodeUI>
    _getDoc: (
        this: INodeModel,
        agid: string,
        cid: string
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
        agid: string,
        cid: string
    ) => Promise<string | null>
    _removeKey: (
        this: INodeModel,
        agid: string,
        cid: string
    ) => Promise<void>
}
