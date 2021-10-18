import { v4 as uuidv4 } from 'uuid'
import { IAuditDocument, IAuditModel, IAuditCreate, IAudit, AuditObj } from './types'
import { MyError, ErrorSource } from '../../utils/error-handler'
import { HttpStatusCode } from '../../utils/http-status-codes'
import { logger } from '../../utils/logger'
import { EventType } from '../../types/misc-types'

export async function getAudits(
  this: IAuditModel, cid: string, id: string, days: number = 7
): Promise<IAudit[]> {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - days)
  const query = { cid: cid, 'target.id': id, created: { $gte: d.getTime() } }
  const records = await this.find(
    { ...query },
    { 'label.ip': 0 }
  ).sort({ _id: -1 })
    .lean()
    .exec()
  if (records) {
    return records
  } else {
    logger.warn('Audits not found')
    throw new MyError('Audits not found', HttpStatusCode.NOT_FOUND, { source: ErrorSource.NODE })
  }
}

export async function getDoc(
  this: IAuditModel, auditId: string
): Promise<IAuditDocument> {
  const record = await this.findOne({ auditId }).exec()
  if (record) {
    return record
  } else {
    logger.warn('Audit not found')
    throw new MyError('Audit not found', HttpStatusCode.NOT_FOUND, { source: ErrorSource.NODE })
  }
}

export async function createAudit(
  this: IAuditModel, data: IAuditCreate
): Promise<IAuditDocument> {
  const newAudit = {
    ...data,
    message: generateMessage(data),
    auditId: uuidv4()
  }
  return this.create(newAudit)
}

// Helpers
const generateMessage: (data: IAuditCreate) => string = (
  data: IAuditCreate
): string => {
  let message = ''
  switch (data.type) {
    // Item
    case EventType.itemEnabled:
      message += 'Item \'' + data.target.name + '\' has been enabled by user ' + data.actor.name
      break
    case EventType.itemDisabled:
      message += 'Item \'' + data.target.name + '\' has been disabled by user ' + data.actor.name
      break
    case EventType.itemDiscovered:
      message += 'Item \'' + data.target.name + '\' has been discovered by node ' + data.actor.name
      break
    case EventType.itemUpdatedByNode:
      message += 'Item \'' + data.target.name + '\' has been updated by node ' + data.actor.name
      break
    case EventType.itemUpdatedByUser:
      message += 'Item \'' + data.target.name + '\' has been updated by user ' + data.actor.name
      break
    case EventType.itemRemoved:
      message += 'Item \'' + data.target.name + '\' has been removed by user ' + data.actor.name
      break
    // User
    case EventType.userCreated:
      // data.object ??= { id: '', name: 'undefined' }
      message += 'User \'' + data.object?.name + '\' has been created by user ' + data.actor.name
      break
    case EventType.userRemoved:
      // data.object ??= { id: '', name: 'undefined' }
      message += 'User \'' + data.object?.name + '\' has been removed by user ' + data.actor.name
      break
    case EventType.userUpdated:
      message += 'User \'' + data.target.name + '\' has been updated by user ' + data.actor.name
      break
    case EventType.userPasswordUpdated:
      message += 'User \'' + data.target.name + '\' has changed password '
      break
    // Node
    case EventType.nodeCreated:
      message += 'Node \'' + data.target.name + '\' has been created by user ' + data.actor.name
      break
    case EventType.nodeUpdated:
      message += 'Node \'' + data.target.name + '\' has been updated by user ' + data.actor.name
      break
    case EventType.nodeUpdatedKey:
      message += 'Node\'s key \'' + data.target.name + '\' has been updated by user ' + data.actor.name
      break
    case EventType.nodeRemoved:
      message += 'Node \'' + data.target.name + '\' has been removed by user ' + data.actor.name
      break
    // Company
    case EventType.companyCreated:
      message += 'Company \'' + data.target.name + '\' has been created by user ' + data.actor.name
      break
    case EventType.companyUpdated:
      message += 'Company \'' + data.target.name + '\' has been updated by user ' + data.actor.name
      break
    case EventType.companyRemoved:
      message += 'Company \'' + data.target.name + '\' has been removed by user ' + data.actor.name
      break
    // Partnership
    case EventType.partnershipAccepted:
      message += 'Friendship between \'' + data.target.name + '\' and \'' + data.object?.name + ' has been created by user ' + data.actor.name
      break
    case EventType.partnershipRejected:
      message += 'Friendship between \'' + data.target.name + '\' and \'' + data.object?.name + ' has been rejected by user ' + data.actor.name
      break
    default:
      message += 'Something has been updated'
      break
  }
  return message
}
