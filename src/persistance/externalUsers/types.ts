import { Document, Model } from 'mongoose'

export interface ACLObject {
    cid: string[],
    agid: string[],
    oid: string[],
}

export enum GrantType {
    DATA_ACCESS = 'dataAccess',
    SERVICE_STORE = 'serviceStore',
    AP_EDIT = 'apEdit',
}
export interface IExternalUser {
    keyid: string
    name: string,
    grantType: GrantType[],
    secretKey: string,
    cid: string,
    ACL: ACLObject,
    domain: string, // not used
    ttl: number,    // not used
    created: Date,
}

// Input to create a new External user
export interface IExternalUserCreate {
    secretKey: string,
    name: string,
    cid: string,
    grantType?: GrantType[],
    ACL?: ACLObject,
    // domain: string,
    // ttl: number,
}

export interface  IExternalUserCreatePost {
    name: string,
    cid: string,
    grantType: GrantType[],
    ACL?: ACLObject,
}

// UI
export interface IExternalUserUi {
    name: string,
    created: Date,
    keyid: string,
    grantType: GrantType[],
    ttl: number,
    ACL: ACLObject,
}
export interface IExternalUserCreatedUi {
    name: string,
    created: Date,
    keyid: string,
    ttl: number,
    secretKey: string
    grantType: GrantType[],
    ACL: ACLObject,

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
