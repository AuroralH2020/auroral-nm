import mongoose from 'mongoose'
import { createExternalUser, getByKeyid, getExternalUsersByCid, removeExternalUser } from './statics'
import { GrantType, IExternalUserDocument, IExternalUserModel } from './types'

const Schema = mongoose.Schema

const ACLObjectSchema = new Schema({
    cid: { type: [String], default: [] },
    agid: { type: [String], default: [] },
    oid: { type: [String], default: [] },
},{ _id: false })

const GrantTypes = Object.values(GrantType)

const ExternalUserSchema = new Schema<IExternalUserDocument, IExternalUserModel>({
    keyid: { type: String, index: true, required: true, unique: true },
    cid: { type: String, required: true },
    name: { type: String, required: true },
    secretKey: { type: String, required: true },
    grantType: [{ type: String, required: true, enum: GrantType, default: ['dataAccess'] }],
    ACL: { type: ACLObjectSchema, default: { cid: [], agid: [], oid: [] } }, // Optional
    domain: { type: String, default: 'NONE' }, // not used
    ttl: { type: Number, default: 0 },    // not used
    created: { type: Number, default: Date.now }
})

// Statics

ExternalUserSchema.statics._createExternalUser = createExternalUser
ExternalUserSchema.statics._removeExternalUser = removeExternalUser
ExternalUserSchema.statics._getExternalUsersByCid = getExternalUsersByCid
ExternalUserSchema.statics._getByKeyid = getByKeyid

// Methods

// eslint-disable-next-line import/no-default-export
export default ExternalUserSchema
