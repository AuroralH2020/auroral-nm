import mongoose from 'mongoose'
import { RolesEnum } from '../../types/roles'
import { getUser, getDoc, createUser, findDuplicatesUser, getAllUsers, getUserByRole, addItemToUser, removeItemFromUser, count, addNodeToUser, removeNodeFromUser } from './statics'
import { updateUser, updateUserRoles, removeUser } from './methods'
import { IUserDocument, IUserModel, UserVisibility, UserStatus, HasNodeType } from './types'
import { ItemType } from '../../persistance/item/types'

const Schema = mongoose.Schema

const roles = Object.values(RolesEnum)
const visibilities = Object.values(UserVisibility)
const statuses = Object.values(UserStatus)
const itemTypes = Object.values(ItemType)

const HasNodeSchema = new Schema<HasNodeType>({
    agid: { type: String, required: true },
    type: { type: String, required: true, enum: itemTypes },
    _id: false
})

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
    hasContracts: [{ type: String, default: [] }], // Contains contracts ids
    hasAudits: [{ type: String, default: [] }],
    hasItems: [{ type: String, default: [] }],
    hasNodes: [{ type: HasNodeSchema, default: [] }],
    lastUpdated: { type: Number, default: Date.now },
    created: { type: Number, default: Date.now }
})

// Statics

UserSchema.statics._getUser = getUser
UserSchema.statics._getUserByRole = getUserByRole
UserSchema.statics._getDoc = getDoc
UserSchema.statics._createUser = createUser
UserSchema.statics._findDuplicatesUser = findDuplicatesUser
UserSchema.statics._getAllUsers = getAllUsers
UserSchema.statics._addItemToUser = addItemToUser
UserSchema.statics._removeItemFromUser = removeItemFromUser
UserSchema.statics._addNodeToUser = addNodeToUser
UserSchema.statics._removeNodeFromUser = removeNodeFromUser
UserSchema.statics._count = count

// Methods

UserSchema.methods._updateUser = updateUser
UserSchema.methods._updateUserRoles = updateUserRoles
UserSchema.methods._removeUser = removeUser // Not delete record, keep some info for future inspection if needed

// eslint-disable-next-line import/no-default-export
export default UserSchema
