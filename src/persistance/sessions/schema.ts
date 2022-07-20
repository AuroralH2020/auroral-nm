import mongoose from 'mongoose'
import { ISessionDocument, ISessionModel } from './types'
import { createSession, deleteSession, getSession } from './statics'

const Schema = mongoose.Schema

const SessionSchema = new Schema<ISessionDocument, ISessionModel>({
    sessionId: { type: String, index: true, unique: true, required: true },
    secretHash: { type: String, required: true },
    uid: { type: String, required: true },
    originIp: String, 
    lastUpdated: { type: Number, default: Date.now },
    created: { type: Number, default: Date.now }, 
    createdDate: { type: Date, index: { expires: 604800 }, default: Date.now } // one week TTL
})

SessionSchema.statics._createSession = createSession
SessionSchema.statics._getSession = getSession
SessionSchema.statics._deleteSession = deleteSession

// eslint-disable-next-line import/no-default-export
export default SessionSchema
