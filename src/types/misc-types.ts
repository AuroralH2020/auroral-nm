export type JsonType = {
    [x: string]: any
}

export type KeyValue = {
    key: string,
    value: string
}

export enum SourceType{
    USER = 'User',
    ORGANISATION = 'Organisation',
    NODE = 'Node',
    ITEM = 'Item',
    PARTNERSHIP = 'Partnership'
    // CONTRACT = 'contract',
}

export enum ResultStatusType{
    ERROR = 'error',
    SUCCESS = 'success'
}

export enum EventType {
    registrationRequest = 1, // toAnswer
    itemEnabled = 11, // info
    itemDisabled = 12, // info
    itemDiscovered = 13, // info
    itemUpdatedByNode = 14, // info
    itemUpdatedByUser = 15, // info
    itemRemoved = 16, // info
    contractRequest = 21, // info
    contractAccepted = 22, // info
    contractCancelled = 23, // info
    contractJoined = 24, // info
    contractAbandoned = 25, // info
    contractUpdated = 26, // info
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
