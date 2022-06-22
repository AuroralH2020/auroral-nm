import { Document, Model } from 'mongoose'

export interface ACLObject {
    cid: string[],
    agid: string[],
    oid: string[],
}

export interface IExternalUser {
    keyid: string
    name: string,
    secretKey: string,
    cid: string,
    ACL: ACLObject,
    domain: string, // not used
    ttl: number,    // not used
    created: Date,
}

// Input to create a new External user
export interface IExternalUserCreate {
    ACL: ACLObject,
    name: string,
    cid: string,
    secretKey: string,
    // domain: string,
    // ttl: number,
}

export interface  IExternalUserCreatePost {
    ACL: ACLObject,
    name: string,
    cid: string,
}

// UI
export interface IExternalUserUi {
    name: string,
    ACL: ACLObject,
    created: Date,
    keyid: string,
    ttl: number,
}
export interface IExternalUserCreatedUi {
    name: string,
    ACL: ACLObject,
    created: Date,
    keyid: string,
    ttl: number,
    secretKey: string
}

export interface IExternalUserDocument extends IExternalUser, Document {
}

export interface IExternalUserModel extends Model<IExternalUserDocument> {
    _createExternalUser: (
        this: IExternalUserModel,
        data: IExternalUserCreate
    ) => Promise<IExternalUserDocument>
    _removeExternalUser: (
        this: IExternalUserModel,
        keyid: string
    ) => Promise<void>
    _getByKeyid: (
        this: IExternalUserModel,
        keyid: string
    ) => Promise<IExternalUser>
    _getExternalUsersByCid: (
        this: IExternalUserModel,
        cid: string
    ) => Promise<IExternalUserUi[]>
    
}
