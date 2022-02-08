import { Document, Model } from 'mongoose'

export enum MessageType {
    CANCELTASK = 'CANCELTASK',
    GETLISTOFACTIONS = 'GETLISTOFACTIONS',
    GETTASKSTATUS = 'GETTASKSTATUS',
    STARTACTION = 'STARTACTION',
    GETEVENTCHANNELSTATUS = 'GETEVENTCHANNELSTATUS',
    GETLISTOFEVENTS = 'GETLISTOFEVENTS',
    SUBSCRIBETOEVENTCHANNEL = 'SUBSCRIBETOEVENTCHANNEL',
    UNSUBSCRIBEFROMEVENTCHANNEL = 'UNSUBSCRIBEFROMEVENTCHANNEL',
    EVENTMESSAGE = 'EVENTMESSAGE',
    GETLISTOFPROPERTIES = 'GETLISTOFPROPERTIES',
    GETPROPERTYVALUE = 'GETPROPERTYVALUE',
    GETTHINGDESCRIPTION = 'GETTHINGDESCRIPTION',
    SETPROPERTYVALUE = 'SETPROPERTYVALUE',
    UNKNOWN = 'Unknown'
}

export interface IRecord {
    messageStatus: string
    sourceOid: string
    destinationOid: string
    requestId: string
    timestamp: number
    reqInitiator: boolean
    messageSize: number
    messageType: MessageType
    requestType: string
    cid: string
    agid: string
    isProcessed: boolean
}

// Input to create a new Record
export interface IRecordCreate {
    messageStatus: string
    sourceOid: string
    destinationOid: string
    requestId: string
    timestamp: number
    reqInitiator: boolean
    messageSize: number
    messageType: MessageType
}

export interface  IRecordCreatePost {
    messageStatus: string
    sourceOid: string
    destinationOid: string
    requestId: string
    timestamp: number
    reqInitiator: boolean
    messageSize: number
    messageType: string
    requestType: string
    cid: string
    agid: string
}

// Aggregation data for UI
export interface IRecordAgg {
    agid: string,
    oid: string,
    cid: string,
    date: string,
    totalSize: number,
    action: number,
    event: number,
    property: number,
    info: number,
    unknown: number
}

export interface IRecordDocument extends IRecord, Document {
}

export interface IRecordModel extends Model<IRecordDocument> {
    _createRecord: (
        this: IRecordModel,
        data: IRecordCreatePost
    ) => Promise<IRecordDocument>
    _getAggregated: (
        this: IRecordModel,
        timestamp: number
    ) => Promise<IRecordAgg[]>
    _aggregationCompleted: (
        this: IRecordModel,
        timestamp: number
    ) => Promise<void>
}
