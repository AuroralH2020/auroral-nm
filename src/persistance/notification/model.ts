import mongoose from 'mongoose'
import NotificationSchema from './schema'
import { INotificationDocument, INotificationModel } from './types'

export const NotificationModel = mongoose.model<INotificationDocument, INotificationModel>(
  'notification',
  NotificationSchema
)
