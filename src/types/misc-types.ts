export type JsonType = {
    [x: string]: any
}

export type KeyValue = {
    key: string,
    value: string
}

export type GtwNodeInfo = {
    cid: string,
    agid: string
    company: string
}

export type GtwItemInfo = {
    cid: string,
    oid: string
    name: string,
    company: string
}

export enum SearchResultType{
    ITEM = 'item',
    ORGANISATION = 'organisation',
    CONTRACT = 'contract',
    COMMUNITY = 'community',
    NODE = 'node',
    USER = 'user',
}

export type SearchResult = {
    name: string,
    id: string,
    type: SearchResultType,
    avatar?: string
}

export enum RelationshipType{
    ME = 'me',
    FRIEND = 'friend',
    OTHER = 'other'
}

export enum SourceType{
    USER = 'User',
    ORGANISATION = 'Organisation',
    NODE = 'Node',
    ITEM = 'Item',
    CONTRACT = 'Contract',
    PARTNERSHIP = 'Partnership'
}

export enum ResultStatusType{
    ERROR = 'error',
    SUCCESS = 'success'
}

export enum XmppNotificationTypes{
    PRIVACY = 'privacyUpdate',
    PARTNERS = 'partnersUpdate',
    CONTRACT_CREATE = 'contractsCreate',
    CONTRACT_REMOVE = 'contractsRemove',
    CONTRACT_ITEM_UPDATE = 'contractsItemUpdate',
    CONTRACT_ITEM_REMOVE = 'contractsItemRemove'
}

export enum EventType {
    registrationRequest = 1, // toAnswer
    itemEnabled = 11, // info
    itemDisabled = 12, // info
    itemDiscovered = 13, // info
    itemUpdatedByNode = 14, // info
    itemUpdatedByUser = 15, // info
    itemRemoved = 16, // info
    contractCreated = 20, // info
    contractRequest = 21, // toAnswer
    contractAccepted = 22, // info
    contractRejected = 23, // info
    contractDeleted = 24, // info
    contractJoined = 25, // info
    contractAbandoned = 26, // info
    contractUpdated = 27, // info
    contractItemUpdated = 28, // info
    partnershipRequest = 31, // toAnswer
    partnershipCancelled = 32, // info
    partnershipRejected = 33, // info
    partnershipAccepted = 34, // info
    partnershipRequested = 35, // info
    partnershipRequestCancelled = 36, // info
    moveThingRequest = 41, // waiting
    moveThingAccept = 42, // info
    moveThingReject = 43, // info
    userCreated = 51,
    userRemoved = 52,
    userUpdated = 53,
    userPasswordUpdated = 54,
    companyCreated = 61,
    companyRemoved = 62, // not used
    companyUpdated = 63,
    nodeCreated = 73,
    nodeRemoved = 74,
    nodeUpdated = 75,
    nodeUpdatedKey = 76,
}
