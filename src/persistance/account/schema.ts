import mongoose from 'mongoose'
import crypto from 'crypto'
import { RolesEnum } from '../../types/roles'
import { getAccount, getHash, getDoc, createAccount, verifyAccount, isVerified, deleteAccount, getDocByUid } from './statics'
import { updatePasswordHash, updateTempSecret, updateRoles } from './methods'
import { IAccountDocument, IAccountModel } from './types'

const Schema = mongoose.Schema

const roles = Object.values(RolesEnum)

const AccountSchema = new Schema<IAccountDocument, IAccountModel>({
    username: { type: String, unique: true, required: true, index: true }, // = registration email
    passwordHash: { type: String, required: true },
    cid: { type: String, required: true }, // organisation ID -- CID
    uid: String, // Add after verification
    contactMail: String,
    roles: [{ type: String, enum: roles }],
    tempSecret: { type: String, default: crypto.randomBytes(16).toString('base64') },  // Validate if mailTokens are current
    lastLogin: Date,
    // originIp: [String], // IPs originating request for the user
    // realm: [String], // Realms where authentication was initiated (App originating)
    lastUpdated: { type: Number, default: Date.now },
    created: { type: Number, default: Date.now },
    verified: { type: Boolean, default: false }
})

AccountSchema.statics._getAccount = getAccount
AccountSchema.statics._getHash = getHash
AccountSchema.statics._getDoc = getDoc
AccountSchema.statics._createAccount = createAccount
AccountSchema.statics._verifyAccount = verifyAccount
AccountSchema.statics._isVerified = isVerified
AccountSchema.statics._deleteAccount = deleteAccount
AccountSchema.statics._getDocByUid = getDocByUid

AccountSchema.methods._updatePasswordHash = updatePasswordHash
AccountSchema.methods._updateTempSecret = updateTempSecret
AccountSchema.methods._updateRoles = updateRoles

// eslint-disable-next-line import/no-default-export
export default AccountSchema
