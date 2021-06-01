import { Document, Model } from 'mongoose'
import { RolesEnum } from '../../types/roles' 

export enum UISkins {
    BLUE = 'blue',
    RED = 'red',
    GREEN = 'green',
    PURPLE = 'purple',
    YELLOW = 'yellow',
    BLACK = 'black'
}

export enum OrganisationStatus {
    ACTIVE = 'active',
    DELETED = 'deleted'
}

export interface IOrganisation {
    name: string, // Company Name
    cid: string,
    businessId: string,
    location: string,
    skinColor: UISkins,
    avatar: string,
    notes: string,
    status: OrganisationStatus,
    hasNotifications: string[], // Contains notifications ids
    hasAudits: string[],
    hasUsers: string[],
    hasNodes: string[],
    knows: string[],
    knowsRequestsFrom: string[],
    knowsRequestsTo: string[],
    lastUpdated: number,
    created: number
    // auto: boolean // Activate for fast registration
}

export interface IOrganisationUI {
    name: string,
    cid: string,
    businessId: string,
    location: string,
    skinColor: UISkins,
    avatar: string,
    notes: string,
    status: OrganisationStatus,
    hasNotifications: string[],
    hasAudits: string[],
    hasUsers: string[],
    hasNodes: string[],
    knows: string[],
    knowsRequestsFrom: string[],
    knowsRequestsTo: string[],
    lastUpdated: number,
    created: number
}

// Input to create a new Organisation
export interface IOrganisationCreate {
    cid: string,
    name: string,
    businessId?: string,
    location: string,
    avatar?: string, // If not present add default
    notes?: string // If not present is null
}

// Input to update a Organisation
export interface IOrganisationUpdate {
    name?: string,
    businessId?: string,
    location?: string,
    skinColor?: UISkins,
    avatar?: string,
    notes?: string
}

export interface OrgConfiguration {
    skinColor: UISkins
}

export interface FriendshipsData {
    isNeighbour: boolean
    canSendNeighbourRequest: boolean
    canCancelNeighbourRequest: boolean
    canAnswerNeighbourRequest: boolean
}

export interface IOrganisationDocument extends IOrganisation, Document {
    _updateOrganisation: (this: IOrganisationDocument, data: IOrganisationUpdate) => Promise<void>
    _removeOrganisation: (this: IOrganisationDocument) => Promise<void>
}

export interface IOrganisationModel extends Model<IOrganisationDocument> {
    _getOrganisation: (
        this: IOrganisationModel,
        cid: string
    ) => Promise<IOrganisationUI>
    _getOrganisations: (
        this: IOrganisationModel,
        cid: string,
        type: number,
        offset: number
    ) => Promise<IOrganisationUI[]>
    _getDoc: (
        this: IOrganisationModel,
        cid: string
    ) => Promise<IOrganisationDocument>
    _getConfiguration: (
        this: IOrganisationModel,
        cid: string
    ) => Promise<OrgConfiguration>
    _createOrganisation: (
        this: IOrganisationModel,
        data: IOrganisationCreate
    ) => Promise<IOrganisationDocument>
    _findDuplicatesCompany: (
        this: IOrganisationModel,
        name: string
    ) => Promise<boolean>
    _addUserToCompany: (
        this: IOrganisationModel,
        cid: string,
        uid: string
    ) => Promise<void>
    _removeUserFromCompany: (
        this: IOrganisationModel,
        cid: string,
        uid: string
    ) => Promise<void>
    _addNodeToCompany: (
        this: IOrganisationModel,
        cid: string,
        agid: string
    ) => Promise<void>
    _removeNodeFromCompany: (
        this: IOrganisationModel,
        cid: string,
        agid: string
    ) => Promise<void>
}
