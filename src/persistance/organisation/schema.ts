import mongoose from 'mongoose'
import { 
    getOrganisation, 
    getOrganisations, 
    getDoc, 
    createOrganisation, 
    findDuplicatesCompany, 
    getConfiguration, 
    addUserToCompany,
    removeUserFromCompany,
    addNodeToCompany,
    removeNodeFromCompany,
    addIncomingFriendReq,
    delIncomingFriendReq,
    addOutgoingFriendReq,
    delOutgoingFriendReq,
    addFriendship,
    delFriendship
} from './statics'
import { updateOrganisation, removeOrganisation } from './methods'
import { IOrganisationDocument, IOrganisationModel, OrganisationStatus, UISkins } from './types'

const Schema = mongoose.Schema

const statuses = Object.values(OrganisationStatus)
const skins = Object.values(UISkins)

const OrganisationSchema = new Schema<IOrganisationDocument, IOrganisationModel>({
    name: { type: String, required: true }, // Company Name
    cid: { type: String, index: true, required: true },
    businessId: String, // INFO
    location: String, // INFO
    avatar: String, // INFO
    notes: String, // INFO
    skinColor: { type: String, default: UISkins.GREEN, enum: skins }, // Settings
    status: { type: String, default: OrganisationStatus.ACTIVE, enum: statuses }, 
    hasNotifications: [{ type: String, default: [] }],
    hasAudits: [{ type: String, default: [] }],
    hasUsers: [{ type: String, default: [] }],
    hasNodes: [{ type: String, default: [] }],
    knows: [{ type: String, default: [] }],
    knowsRequestsFrom: [{ type: String, default: [] }],
    knowsRequestsTo: [{ type: String, default: [] }],
    lastUpdated: { type: Number, default: Date.now },
    created: { type: Number, default: Date.now }
    // auto: boolean // Activate for fast registration
})

// Statics

OrganisationSchema.statics._getOrganisation = getOrganisation
OrganisationSchema.statics._getOrganisations = getOrganisations
OrganisationSchema.statics._getDoc = getDoc
OrganisationSchema.statics._createOrganisation = createOrganisation
OrganisationSchema.statics._findDuplicatesCompany = findDuplicatesCompany
OrganisationSchema.statics._getConfiguration = getConfiguration
OrganisationSchema.statics._addUserToCompany = addUserToCompany
OrganisationSchema.statics._removeUserFromCompany = removeUserFromCompany
OrganisationSchema.statics._addNodeToCompany = addNodeToCompany
OrganisationSchema.statics._removeNodeFromCompany = removeNodeFromCompany
OrganisationSchema.statics._addIncomingFriendReq = addIncomingFriendReq
OrganisationSchema.statics._delIncomingFriendReq = delIncomingFriendReq
OrganisationSchema.statics._addOutgoingFriendReq = addOutgoingFriendReq
OrganisationSchema.statics._delOutgoingFriendReq = delOutgoingFriendReq
OrganisationSchema.statics._addFriendship = addFriendship
OrganisationSchema.statics._delFriendship = delFriendship

// Methods

OrganisationSchema.methods._updateOrganisation = updateOrganisation
OrganisationSchema.methods._removeOrganisation = removeOrganisation // Not delete record, keep some info for future inspection if needed

// eslint-disable-next-line import/no-default-export
export default OrganisationSchema
