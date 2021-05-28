import { Document, Model } from 'mongoose'
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

export interface IUser {
    uid: string, // unique user id
    firstName: string,
    lastName: string,
    name: string, // fullName
    email: string, // Username/Unique
    contactMail: string,
    cid: string, // unique organisation id
    occupation: string,
    location: string,
    avatar: string,
    status: UserStatus,
    accessLevel: UserVisibility,
    roles: RolesEnum[],
    hasNotifications: string[], // Contains notifications ids
    hasAudits: string[],
    hasItems: string[],
    hasContracts: string[],
    lastUpdated: number,
    created: number
}

export interface IUserUI {
    firstName: string,
    lastName: string,
    name: string, // fullName
    email: string, // Username/Unique
    contactMail: string,
    cid: string,
    occupation: string,
    location: string,
    avatar: string,
    status: UserStatus,
    accessLevel: UserVisibility,
    roles: RolesEnum[],
    lastUpdated: number,
    created: number
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
    ) => Promise<IUserUI>
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
}
