import mongoose from 'mongoose'
import { AuditObj, IAuditDocument, IAuditModel, LabelsType } from './types'
import { getAudits, getDoc, createAudit } from './statics'
import { SourceType, ResultStatusType, EventType } from '../../types/misc-types'
import { Interfaces } from '../../types/locals-types'

const Schema = mongoose.Schema

const auditStatusType = Object.values(ResultStatusType)
const auditSourceType = Object.values(SourceType)
const auditOriginType = Object.values(Interfaces)

const AuditObjSchema = new Schema<AuditObj>({
    id: String,
    name: String
}, { _id: false })

const LabelObjSchema = new Schema<LabelsType>({
    ip: String,
    status: { type: String, required: true, enum: auditStatusType },
    source: { type: String, required: true, enum: auditSourceType },
    origin: { type: String, required: true, enum: auditOriginType },
}, { _id: false })

const AuditSchema = new Schema<IAuditDocument, IAuditModel>({
    auditId: { type: String, index: true, required: true },
    message: { type: String, required: false },
    cid: String,
    type: { type: EventType, required: true },

    actor: { type: AuditObjSchema, required: true },
    target: { type: AuditObjSchema, required: true },
    object: { type: AuditObjSchema, required: false },
    created: { type: Number, default: Date.now },
    labels: { type: LabelObjSchema }
})

// Statics
AuditSchema.statics._getAudits = getAudits
AuditSchema.statics._getDoc = getDoc
AuditSchema.statics._createAudit = createAudit

// eslint-disable-next-line import/no-default-export
export default AuditSchema
