import { Document, Model } from 'mongoose'
import { SearchResult } from '../../types/misc-types'
import { ItemType } from '../../persistance/item/types'
import { RolesEnum } from '../../types/roles' 

export enum UserVisibility {
    PRIVATE = 0,
    FRIENDS_ONLY = 1,
    PUBLIC = 2
}

export enum UserStatus {
    ACTIVE = 'active',
    DELETED = 'deleted'
}
export interface HasNodeType {
    agid: string,
    type: ItemType
}
export interface IUser {
    // context: string
    uid: string, // Auroral Id
    firstName: string, // User property
    lastName: string, // User property
    name: string, // fullName / User property
    email: string, // Username/Unique / User property
    contactMail: string, // Fallback mail / User property
    cid: string, // Organisation Auroral Id
    occupation: string, // User property
    location: string, // User property
    avatar: string, // Base64 encoded Image or URI
    status: UserStatus,
    accessLevel: UserVisibility, // User privacy
    roles: RolesEnum[], // User application roles
    // Next four might be removed, we will keep relation among entities 
    // but we might not store IDs 'physically' in user document
    hasNotifications: string[], // Contains notifications ids
    hasAudits: string[], // Contains audits ids
    hasItems: string[], // Contains items ids
    hasNodes: string[], // Contains nodes in which is user default item owner 
    // hasContracts: string[], // Contains contracts ids
    // Timestamps
    lastUpdated: number,
    created: number
}

export interface IUserUI {
    name: string, // fullName
    email: string, // Username/Unique
    contactMail: string,
    uid: string,
    cid: string,
    occupation: string,
    location: string,
    avatar: string,
    lastUpdated: number,
    created: number
}

export interface IUserUIProfile extends IUserUI {
    firstName: string,
    lastName: string,
    status: UserStatus,
    accessLevel: UserVisibility,
    roles: RolesEnum[]
}

// Input to create a new User
export interface IUserCreate {
    uid: string,
    firstName: string,
    lastName: string,
    email: string, // Username/Unique
    contactMail?: string,
    cid: string, // organisation id
    occupation?: string,
    location?: string,
    avatar?: string,
    roles: RolesEnum[]
}

// Input to update a User
export interface IUserUpdate {
    firstName?: string,
    lastName?: string,
    contactMail?: string,
    occupation?: string,
    location?: string,
    avatar?: string,
    accessLevel?: UserVisibility,
    roles?: RolesEnum[]
}

export interface IUserDocument extends IUser, Document {
    _updateUser: (this: IUserDocument, data: IUserUpdate) => Promise<void>
    _updateUserRoles: (this: IUserDocument, roles: RolesEnum[]) => Promise<void>
    _removeUser: (this: IUserDocument) => Promise<void>
}

export interface IUserModel extends Model<IUserDocument> {
    _getUser: (
        this: IUserModel,
        uid: string
    ) => Promise<IUserUIProfile>
    _getUserByRole: (
        this: IUserModel,
        role: RolesEnum
    ) => Promise<IUserUI[]>
    _getDoc: (
        this: IUserModel,
        uid: string
    ) => Promise<IUserDocument>
    _createUser: (
        this: IUserModel,
        data: IUserCreate
    ) => Promise<IUserDocument>
    _findDuplicatesUser: (
        this: IUserModel,
        email: string
    ) => Promise<boolean>
    _getAllUsers: (
        this: IUserModel,
        accessLevel: UserVisibility[],
        users: string[]
    ) => Promise<IUserUI[]>
    _addItemToUser: (
        this: IUserModel,
        uid: string,
        oid: string
    ) => Promise<void>
    _removeItemFromUser: (
        this: IUserModel,
        uid: string,
        oid: string
    ) => Promise<void>
    _addNodeToUser: (
        this: IUserModel,
        uid: string,
        agid: string,
        type: ItemType
    ) => Promise<void>
    _removeNodeFromUser: (
        this: IUserModel,
        uid: string,
        agid: string,
        type: ItemType
    ) => Promise<void>
    _addContract: (
        this: IUserModel,
        uid: string,
        ctid: string
    ) => Promise<void>
    _removeContract: (
        this: IUserModel,
        uid: string,
        ctid: string
    ) => Promise<void>
    _count: (
        this: IUserModel,
    ) => Promise<number>
    _search: (
        this: IUserModel,
        cid: string,
        knows: string[],
        text: string,
        limit: number,
        offset: number
    ) => Promise<SearchResult[]>
}
