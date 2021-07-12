import { Document, Model } from 'mongoose'

export enum NotificationType {
    registrationRequest = 1, // toAnswer
    itemEnabled = 11, // info
    itemDisabled = 12, // info
    itemDiscovered = 13, // info
    itemUpdated = 14, // info
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
    moveThingReject = 43 // info
}

export enum NotificationStatus {
    WAITING = 'waiting',
    INFO = 'info',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected',
    RESPONDED = 'responded'
}

export type NotificationObj = {
    id: string
    name: string
}

export interface INotification {
    // context: string
    notificationId: string // ID in Auroral
    owner: string // cid or uid of the entity that owns the notification (If entity === organisation => all users in organisation are notified)
    actor: NotificationObj // Entity that caused the notification
    target: NotificationObj // Entity affected by the notification
    object: NotificationObj // Entity instrumental for the notification to happen
    isUnread: boolean
    status: NotificationStatus
    type: NotificationType
    // Timestamps
    created: number
}

export interface INotificationCreate {
    owner: string // cid or uid
    actor: NotificationObj
    target?: NotificationObj
    object?: NotificationObj
    status: NotificationStatus
    type: NotificationType
}

export interface NotifFinderType {
    owners: string[]
    type: NotificationType
    status: NotificationStatus
    actor?: NotificationObj
    target?: NotificationObj
    object?: NotificationObj // Sender (organisation sending the request)
}

export interface INotificationDocument extends INotification, Document {
}

export interface INotificationModel extends Model<INotificationDocument> {
    _getNotifications: (
        this: INotificationModel,
        owners: string[],
        unreadOnly: boolean,
        limit?: number,
        offset?: number
    ) => Promise<INotification[]>
    _getDoc: (
        this: INotificationModel,
        notificationId: string
    ) => Promise<INotificationDocument>
    _createNotification: (
        this: INotificationModel,
        data: INotificationCreate
    ) => Promise<INotificationDocument>
    _setRead: (
        this: INotificationModel,
        notificationId: string
    ) => Promise<void>
    _setStatus: (
        this: INotificationModel,
        notificationId: string,
        status: NotificationStatus
    ) => Promise<void>
    _findNotifications: (
        this: INotificationModel,
        data: NotifFinderType
    ) => Promise<string[]> // NotificationId
}
