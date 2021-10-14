import mongoose from 'mongoose'
import { getNotifications, getDoc, createNotification, setStatus, setRead, findNotifications } from './statics'
import { INotificationDocument, INotificationModel, NotificationStatus, NotificationObj } from './types'
import { EventType } from '../../types/misc-types'

const Schema = mongoose.Schema

const notifTypes = Object.values(EventType)
const statuses = Object.values(NotificationStatus)

const NotificationObjSchema = new Schema<NotificationObj>({
    id: String,
    name: String
}, { _id: false })

const NotificationSchema = new Schema<INotificationDocument, INotificationModel>({
    notificationId: { type: String, index: true, required: true },
    owner: { type: String, required: true },
    actor: NotificationObjSchema,
    target: NotificationObjSchema,
    object: NotificationObjSchema,
    isUnread: { type: Boolean, default: true },
    status: { type: String, required: true, enum: statuses },
    type: { type: Number, required: true, enum: notifTypes },
    created: { type: Number, default: Date.now }
})

// Statics

NotificationSchema.statics._getNotifications = getNotifications
NotificationSchema.statics._getDoc = getDoc
NotificationSchema.statics._createNotification = createNotification
NotificationSchema.statics._setRead = setRead
NotificationSchema.statics._setStatus = setStatus
NotificationSchema.statics._findNotifications = findNotifications

// Methods

// eslint-disable-next-line import/no-default-export
export default NotificationSchema
