import { Document, Model } from 'mongoose'
import { SearchResult } from '../../types/misc-types'
import { ItemDomainType } from '../../persistance/item/types'

export enum CommunityType {
    PARTNERSHIP = 'Partnership',
    COMMUNITY = 'Community',
}

// joined organisation object
export type communityOrganisation = {
    cid: string,
    name: string,
    nodes: string[]
}

export interface ICommunityCreate {
    name: string,
    domain?: ItemDomainType,
    type?: CommunityType,
    description?: string,
    organisations: communityOrganisation[], // Objects of joined organisations
}

export interface ICommunity {
    commId: string, // Auroral Id
    name: string,
    domain: ItemDomainType,
    type: CommunityType,
    description: string,
    organisations: communityOrganisation[], // CIDs of joined organisations  -> organisations pending deleted
    lastUpdated: number,
    created: number,
}

export interface ICommunityUIList  {
    commId: string, // Auroral Id
    name: string,
    domain: ItemDomainType
    type: CommunityType,
    description: string,
    organisationsNum: number,
    nodesNum: number
}

export interface ICommunityDocument extends ICommunity, Document {
    // _updateContract: (this: IContractDocument, data: ICommunityUpdate) => Promise<IContractDocument>
    _removeCommunity: (this: ICommunityDocument) => Promise<void>
    // _updateStatus: (this: ICommunityDocument,status?: CommunityStatus) => Promise<void>
}

export interface ICommunityModel extends Model<ICommunityDocument> {
    _createCommunity: (
        this: ICommunityModel,
        data: ICommunityCreate
    ) => Promise<ICommunityDocument>
    _removeCommunity: (
        this: ICommunityModel,
        commId: string
    ) => Promise<void>
    _getCommunity: (
        this: ICommunityModel,
        commId: string
    ) => Promise<ICommunity>
    _getCommunityUI: (
        this: ICommunityModel,
        commId: string
    ) => Promise<ICommunity>
    _getAllCommunitiesUI: (
        this: ICommunityModel,
        type: CommunityType,
        offset: Number,
        domain: ItemDomainType,
        cid: string
    ) => Promise<ICommunityUIList[]>
    _addNodeToCommunity: (
        this: ICommunityModel,
        commId: string,
        cid: string,
        agid: string,
    ) => Promise<void>
    _removeNodeFromCommunity: (
        this: ICommunityModel,
        commId: string,
        cid: string,
        agid: string,
    ) => Promise<void>
    _getOrganisationsInCommunity: (
        this: ICommunityModel,
        commId: string,
    ) => Promise<string[]>
    _addOrganisationToCommunity: (
        this: ICommunityModel,
        commId: string,
        org: { name: string, cid: string }
    ) => Promise<void>
    _removeOrgsWithoutNodes: (
        this: ICommunityModel,
        commId: string,
    ) => Promise<void>
    _getPartnershipByCids: (
        this: ICommunityModel,
        cid1: string,
        cid2: string
    ) => Promise<ICommunity>
    _getCommunitiesByAgid: (
        this: ICommunityModel,
        agid: string,
    ) => Promise<{name: string, description: string, commId: string}[]>
    _getDoc: (
        this: ICommunityModel,
        commId: string
    ) => Promise<ICommunityDocument>
    _search: (
        this: ICommunityModel,
        cid: string,
        text: string,
        limit: number,
        offset: number
    ) => Promise<SearchResult[]>
}
