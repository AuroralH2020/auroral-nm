import { Document, Model } from 'mongoose'
import { SourceType, ResultStatusType, EventType } from '../../types/misc-types'
import { Interfaces } from '../../types/locals-types'

export type AuditObj = {
    id: string
    name: string
}

export type LabelsType = {
    ip?: string
    source?: SourceType,
    status: ResultStatusType,
    origin?: Interfaces
}

export interface IAudit {
    auditId: string // ID in Auroral
    cid: string // company ID  in Auroral
    reqId: string, // request ID 
    message: string // Main part of Audit, displayed in the UI and stored to log
    type: EventType // Type of operation
    actor: AuditObj // Entity that caused the audit
    target: AuditObj // Entity affected by the audit
    object: AuditObj // Entity instrumental for the audit to happen
    label: LabelsType
    // Timestamps
    created: number
}

export interface IAuditCreate {
    message?: string,
    cid: string,
    reqId: string,
    type: EventType,
    actor: AuditObj,
    target: AuditObj,
    object?: AuditObj,
    labels: LabelsType
}

export interface IAuditDocument extends IAudit, Document {
}

export interface IAuditModel extends Model<IAuditDocument> {
    _getAudits: (
        this: IAuditModel,
        cid: string,
        id: string,
        days?: number,
    ) => Promise<IAudit[]>
    _getDoc: (
        this: IAuditModel,
        auditId: string
    ) => Promise<IAuditDocument>
    _createAudit: (
        this: IAuditModel,
        data: IAuditCreate
    ) => Promise<IAuditDocument>
}
