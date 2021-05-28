import mongoose from 'mongoose'
import { getOrganisation, getOrganisations, getDoc, createOrganisation, findDuplicatesCompany, getConfiguration } from './statics'
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
    lastUpdated: { type: Number, default: new Date().getTime() },
    created: { type: Number, default: new Date().getTime() }
    // auto: boolean // Activate for fast registration
})

// Statics

OrganisationSchema.statics._getOrganisation = getOrganisation
OrganisationSchema.statics._getOrganisations = getOrganisations
OrganisationSchema.statics._getDoc = getDoc
OrganisationSchema.statics._createOrganisation = createOrganisation
OrganisationSchema.statics._findDuplicatesCompany = findDuplicatesCompany
OrganisationSchema.statics._getConfiguration = getConfiguration

// Methods

OrganisationSchema.methods._updateOrganisation = updateOrganisation
OrganisationSchema.methods._removeOrganisation = removeOrganisation // Not delete record, keep some info for future inspection if needed

// eslint-disable-next-line import/no-default-export
export default OrganisationSchema