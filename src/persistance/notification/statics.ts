import { v4 as uuidv4 } from 'uuid'
import { INotificationDocument, INotificationModel, INotificationCreate, INotification, NotificationStatus, NotifFinderType } from './types'
import { MyError, ErrorSource } from '../../utils/error-handler'
import { HttpStatusCode } from '../../utils/http-status-codes'

export async function getNotifications(
  this: INotificationModel, owners: string[], unreadOnly: boolean, limit: number = 0, offset: number = 0
): Promise<INotification[]> {
  const query = unreadOnly ? 
                { owner: { $in: owners } , $or: [{ isUnread: true }, { status: NotificationStatus.WAITING }] } : 
                {  owner: { $in: owners } }
  const records = await this.find(
    { ...query }
    ).sort({ _id: -1 })
    .skip(offset)
    .limit(limit)
    .lean()
    .exec()
  if (records) {
    return records
  } else {
    // logger.warn('Notification not found')
    throw new MyError('Notification not found', HttpStatusCode.NOT_FOUND, { source: ErrorSource.NODE })
  }
}

export async function getDoc(
  this: INotificationModel, notificationId: string
): Promise<INotificationDocument> {
  const record = await this.findOne({ notificationId }).exec()
  if (record) {
    return record
  } else {
    // logger.warn('Notification not found')
    throw new MyError('Notification not found', HttpStatusCode.NOT_FOUND, { source: ErrorSource.NODE })
  }
}

export async function createNotification(
    this: INotificationModel, data: INotificationCreate
  ): Promise<INotificationDocument> {
    const newNotification = {
      ...data,
      notificationId: uuidv4()
    }
    return this.create(newNotification)
}

export async function setRead(
  this: INotificationModel, notificationId: string
): Promise<void> {
  const record = await this.updateOne({ notificationId }, { $set: { isUnread: false } }).exec()
  if (!record.ok) {
    throw new Error('Issue updating notification to read: ' + notificationId)
  }
}

export async function setStatus(
  this: INotificationModel, notificationId: string, status: NotificationStatus
): Promise<void> {
  const record = await this.updateOne({ notificationId }, { $set: { status } }).exec()
  if (!record.ok) {
    throw new Error('Issue updating notification status: ' + notificationId)
  }
}

export async function findNotifications(
  this: INotificationModel, data: NotifFinderType
): Promise<string[]> {
  const query = { ...data, owner: { $in: data.owners } }
  delete query.owners // Need to remove to avoid conflicts with MONGO query
  const records = await this.find(query, { notificationId: 1 }).lean().exec()
  if (records) {
    return records.map(it => it.notificationId)
  } else {
    throw new Error('There are no Notifications matching the search criteria, nothing will be updated...')
  }
}
