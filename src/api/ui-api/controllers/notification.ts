// Controller common imports
import { expressTypes, localsTypes } from '../../../types/index'
import { HttpStatusCode } from '../../../utils/http-status-codes'
import { logger } from '../../../utils/logger'
import { responseBuilder } from '../../../utils/response-builder'
import { errorHandler, MyError } from '../../../utils/error-handler'

// Controller specific imports
import { NotificationModel } from '../../../persistance/notification/model'
import { INotification } from '../../../persistance/notification/types'

// Controllers

type getNotificationsController = expressTypes.Controller<{}, {}, { limit: string, offset: string, pending: string }, INotification[], localsTypes.ILocals>
 
export const getNotifications: getNotificationsController = async (req, res) => {
	const { decoded } = res.locals
	const { pending, limit, offset } = req.query
	try {
		const cid = decoded.org
		const uid = decoded.sub
		const data = await NotificationModel._getNotifications([cid, uid], pending === 'true', Number(limit), Number(offset))
		return responseBuilder(HttpStatusCode.OK, res, null, data)
	} catch (err) {
		const error = errorHandler(err)
		logger.error(error.message)
		return responseBuilder(error.status, res, error.message)
	}
}

type refreshNotificationsController = expressTypes.Controller<{}, {}, {}, { count: number }, localsTypes.ILocals>

// Return count of unread or pending notifications
export const refreshNotifications: refreshNotificationsController = async (_req, res) => {
  const { decoded } = res.locals
	try {
	const cid = decoded.org
	const uid = decoded.sub
	const count = (await NotificationModel._getNotifications([cid, uid], true)).length
    return responseBuilder(HttpStatusCode.OK, res, null, { count })
	} catch (err) {
		const error = errorHandler(err)
		logger.error(error.message)
		return responseBuilder(error.status, res, error.message)
	}
}

type setReadController = expressTypes.Controller<{ notificationId: string }, {}, {}, null, localsTypes.ILocals>

export const setRead: setReadController = async (req, res) => {
  const { notificationId } = req.params
  const { decoded } = res.locals
	try {
		const notif = await NotificationModel._getDoc(notificationId)
		if (notif.owner !== decoded.sub && notif.owner !== decoded.org) { 
			throw new MyError('You are not allowed to set read this notification', HttpStatusCode.FORBIDDEN)
		}
		await NotificationModel._setRead(notificationId)
		return responseBuilder(HttpStatusCode.OK, res, null, null)
	} catch (err) {
		const error = errorHandler(err)
		logger.error(error.message)
		return responseBuilder(error.status, res, error.message)
	}
}
