import mongoose from 'mongoose'
import { RolesEnum } from '../../types/roles'
import { getUser, getDoc, createUser, findDuplicatesUser, getAllUsers, getUserByRole } from './statics'
import { updateUser, updateUserRoles, removeUser } from './methods'
import { IUserDocument, IUserModel, UserVisibility, UserStatus } from './types'

const Schema = mongoose.Schema

const roles = Object.values(RolesEnum)
const visibilities = Object.values(UserVisibility)
const statuses = Object.values(UserStatus)

const UserSchema = new Schema<IUserDocument, IUserModel>({
    uid: { type: String, index: true, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    name: String, // fullName
    email: { type: String, unique: true, required: true }, // = registration email/username
    contactMail: String,
    cid: { type: String, required: true },
    occupation: String,
    location: String,
    avatar: String,
    status: { type: String, default: UserStatus.ACTIVE, enum: statuses },
    accessLevel: { type: String, required: true, enum: visibilities },
    roles: [{ type: String, required: true, enum: roles }],
    hasNotifications: [{ type: String, default: [] }], // Contains notifications ids
    hasAudits: [{ type: String, default: [] }],
    hasItems: [{ type: String, default: [] }],
    hasContracts: [{ type: String, default: [] }],
    lastUpdated: { type: Number, default: new Date().getTime() },
    created: { type: Number, default: new Date().getTime() }
})

// Statics

UserSchema.statics._getUser = getUser
UserSchema.statics._getUserByRole = getUserByRole
UserSchema.statics._getDoc = getDoc
UserSchema.statics._createUser = createUser
UserSchema.statics._findDuplicatesUser = findDuplicatesUser
UserSchema.statics._getAllUsers = getAllUsers

// Methods

UserSchema.methods._updateUser = updateUser
UserSchema.methods._updateUserRoles = updateUserRoles
UserSchema.methods._removeUser = removeUser // Not delete record, keep some info for future inspection if needed

// eslint-disable-next-line import/no-default-export
export default UserSchema
