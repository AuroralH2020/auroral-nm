import { Document, Model } from 'mongoose'
import { RolesEnum } from '../../types/roles' 

export interface IAccount {
    username: string, // = registration email
    passwordHash: string,
    uid: string, // user ID
    cid: string, // organisation ID
    contactMail?: string,
    roles: RolesEnum[],
    tempSecret: string,  // Validate if mailTokens are current
    lastLogin?: number,
    // originIp: string[], // IPs originating request for the user
    // realm: string[], // Realms where authentication was initiated (App originating)
    lastUpdated: number,
    created: number,
    verified: boolean
}

export interface IAccountUI {
    username: string, // = registration email
    uid: string, // user ID
    cid: string, // organisation ID
    contactMail?: string,
    roles: RolesEnum[],
    lastLogin?: number,
    lastUpdated: number,
    created: number
}

// Input to create a new account
export interface IAccountRegistrationPre {
    username: string, // = registration email
    password: string,
    cid: string, // organisation ID
    contactMail?: string,
    roles: RolesEnum[]
}

// Processed account input to insert in dB
export interface IAccountRegistrationPost {
    username: string, // = registration email
    passwordHash: string,
    cid: string, // organisation ID
    contactMail?: string,
    roles: RolesEnum[]
}

export interface IAccountDocument extends IAccount, Document {
    _updatePasswordHash: (this: IAccountDocument, passwordHash: string) => Promise<void>
    _updateTempSecret: (this: IAccountDocument) => Promise<string>
    _verifyAccount: (this: IAccountDocument) => Promise<void>
    _updateRoles: (this: IAccountDocument, roles: RolesEnum[]) => Promise<void>
}

export interface IAccountModel extends Model<IAccountDocument> {
    _getAccount: (
        this: IAccountModel,
        username: string
    ) => Promise<IAccountUI>
    _getHash: (
        this: IAccountModel,
        username: string
    ) => Promise<string>
    _getDoc: (
        this: IAccountModel,
        username: string
    ) => Promise<IAccountDocument>
    _getDocByUid: (
        this: IAccountModel,
        uid: string
    ) => Promise<IAccountDocument>
    _createAccount: (
        this: IAccountModel,
        data: IAccountRegistrationPost
    ) => Promise<IAccountDocument>
    _verifyAccount: (
        this: IAccountModel,
        username: string,
        uid: string
    ) => Promise<void>
    _isVerified: (
        this: IAccountModel,
        username: string
    ) => Promise<boolean>
    _deleteAccount: (
        this: IAccountModel,
        username: string
    ) => Promise<void>
}
