import mongoose from 'mongoose'
import { createRecord, getAggregated } from './statics'
import { IRecordDocument, IRecordModel, MessageType } from './types'

const Schema = mongoose.Schema

const MessageTypes = Object.values(MessageType)

const RecordSchema = new Schema<IRecordDocument, IRecordModel>({
    messageStatus: { type: String, required: true },
    sourceOid: { type: String, required: true },
    destinationOid: { type: String, required: true },
    requestId: { type: String, required: true },
    timestamp: { type: Number, required: true },
    reqInitiator: { type: Boolean, required: true },
    messageSize: { type: Number, required: true },
    messageType: { type: String, required: true, enum: MessageTypes },
    agid: { type: String, required: true },
    cid: { type: String, required: true },
    requestType: { type: String, required: true },
    isProcessed: { type: Boolean, default: false }
})

// Statics

RecordSchema.statics._getAggregated = getAggregated
RecordSchema.statics._createRecord = createRecord

// Methods

// eslint-disable-next-line import/no-default-export
export default RecordSchema
