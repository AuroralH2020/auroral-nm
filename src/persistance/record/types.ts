import { Document, Model } from 'mongoose'

export enum RecordType {
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
    SETPROPERTYVALUE = 'SETPROPERTYVALUE'
}

export interface IRecord {
    messageStatus: string
    sourceOid: string
    destinationOid: string
    requestId: string
    timestamp: number
    reqInitiator: boolean
    messageSize: number
    messageType: string
    requestType: RecordType
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
    messageType: string
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
    date: number,
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
        Records: string[]
    ) => Promise<IRecordAgg>
}
