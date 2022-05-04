import mongoose from 'mongoose'
import { ItemDomainType } from '../../persistance/item/types'
import { addNodeToCommunity, addOrganisationToCommunity, createCommunity, getAllCommunitiesUI, getCommunitiesByAgid, getCommunity, getCommunityUI, getOrganisationsInCommunity, getPartnershipByCids, removeCommunity, removeNodeFromCommunity, removeOrgsWithoutNodes, search } from './statics'
import { communityOrganisation, CommunityType, ICommunityDocument, ICommunityModel  } from './types'

const Schema = mongoose.Schema

const communityType = Object.values(CommunityType)
const communityDomain = Object.values(ItemDomainType)

const CommunityOrganisationSchema = new Schema<communityOrganisation>({
    cid: { type: String, required: true },
    name: { type: String, required: true },
    nodes: [{ type: String, required: true }]
})

const CommunitySchema = new Schema<ICommunityDocument, ICommunityModel>({
    commId: { type: String, index: true, unique: true, required: true }, // unique community id
    name: { type: String, required: true },
    type: { type: String, default: CommunityType.COMMUNITY, enum: communityType },
    domain: { type: String, required: false, enum: communityDomain },
    description: { type: String, default: 'Community description' },
    organisations: [{ type: CommunityOrganisationSchema, default: [] }],
    lastUpdated: { type: Number, default: Date.now },
    created: { type: Number, default: Date.now }
})

// Statics
CommunitySchema.statics._getCommunity = getCommunity
CommunitySchema.statics._getCommunityUI = getCommunityUI
CommunitySchema.statics._getAllCommunitiesUI = getAllCommunitiesUI
CommunitySchema.statics._createCommunity = createCommunity
CommunitySchema.statics._removeCommunity = removeCommunity
CommunitySchema.statics._addNodeToCommunity = addNodeToCommunity
CommunitySchema.statics._removeNodeFromCommunity = removeNodeFromCommunity
CommunitySchema.statics._getOrganisationsInCommunity = getOrganisationsInCommunity
CommunitySchema.statics._addOrganisationToCommunity = addOrganisationToCommunity
CommunitySchema.statics._removeOrgsWithoutNodes = removeOrgsWithoutNodes
CommunitySchema.statics._getPartnershipByCids = getPartnershipByCids
CommunitySchema.statics._getCommunitiesByAgid = getCommunitiesByAgid
CommunitySchema.statics._search = search
// Methods

// eslint-disable-next-line import/no-default-export
export default CommunitySchema
