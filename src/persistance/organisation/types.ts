import { Document, Model } from 'mongoose'

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
    // context: string
    name: string, // Company Name
    cid: string, // Company ID in AURORAL
    businessId: string, // Business ID / ICO / Registration Number
    location: string, // TBD: Update to object, so far just string
    skinColor: UISkins, // Configures the colour in the UI
    avatar: string, // Base64 encoded Image or URI
    notes: string, // Description of the company given by user
    status: OrganisationStatus,
    // Next four might be removed, we will keep relation among entities 
    // but we might not store IDs 'physically' in organisation document
    hasNotifications: string[], // Contains notifications IDs
    hasAudits: string[],
    hasUsers: string[],
    hasNodes: string[],
    // Stores IDs of other organsations (Friendship process)
    knows: string[],
    knowsRequestsFrom: string[],
    knowsRequestsTo: string[],
    // Timestamps
    lastUpdated: number,
    created: number
    // auto: boolean // TBD: Activate for fast registration if needed
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
    _addIncomingFriendReq: (
        this: IOrganisationModel,
        cid: string,
        friendCid: string
    ) => Promise<void>
    _delIncomingFriendReq: (
        this: IOrganisationModel,
        cid: string,
        friendCid: string
    ) => Promise<void>
    _addOutgoingFriendReq: (
        this: IOrganisationModel,
        cid: string,
        friendCid: string
    ) => Promise<void>
    _delOutgoingFriendReq: (
        this: IOrganisationModel,
        cid: string,
        friendCid: string
    ) => Promise<void>
    _addFriendship: (
        this: IOrganisationModel,
        cid: string,
        friendCid: string
    ) => Promise<void>
    _delFriendship: (
        this: IOrganisationModel,
        cid: string,
        friendCid: string
    ) => Promise<void>
}
