import { Document, Model } from 'mongoose'

export interface ISession {
    sessionId: string,
    secretHash: string,
    uid: string,
    originIp: string,
    lastUpdated: number,
    created: number,
}

export interface ISessionCreate {
    uid: string,
    originIp: string,
    secretHash: string
}

export interface ISessionDocument extends ISession, Document {
    _verifySession: (this: ISessionDocument) => Promise<void>
}

export interface ISessionModel extends Model<ISessionDocument> {
    _getSession: (
        this: ISessionModel,
        sessionId: string
    ) => Promise<ISession>
    _createSession: (
        this: ISessionModel,
        data: ISessionCreate
    ) => Promise<ISessionDocument>
    _getDoc: (
        this: ISessionModel,
        sessionId: string
    ) => Promise<ISessionDocument>
    _deleteSession: (
        this: ISessionModel,
        sessionId: string
    ) => Promise<void>
}
