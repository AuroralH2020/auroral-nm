// Controller common imports
import { expressTypes, localsTypes } from '../../../types/index'
import { HttpStatusCode } from '../../../utils/http-status-codes'
import { logger } from '../../../utils/logger'
import { responseBuilder } from '../../../utils/response-builder'
import { errorHandler } from '../../../utils/error-handler'

// Controller specific imports
import { OrganisationModel } from '../../../persistance/organisation/model'
import { NotificationModel } from '../../../persistance/notification/model'
import { UserModel } from '../../../persistance/user/model'
import { NotificationStatus, NotificationType } from '../../../persistance/notification/types'

// Controllers

type processFriendRequestController = expressTypes.Controller<{ cid: string }, {}, {}, null, localsTypes.ILocals>
 
export const processFriendRequest: processFriendRequestController = async (req, res) => {
  const { decoded } = res.locals // Requester organisation ID
  const friendCid = req.params.cid // Requested organisation info
	try {
    const myCid = decoded.org
    const myUid = decoded.uid
    await OrganisationModel._addOutgoingFriendReq(myCid, friendCid)
    await OrganisationModel._addIncomingFriendReq(friendCid, myCid)
    // Create notification
    const actorName = (await UserModel._getUser(myUid)).name
    const myOrgName = (await OrganisationModel._getOrganisation(myCid)).name
    const friendOrgName = (await OrganisationModel._getOrganisation(friendCid)).name
    await NotificationModel._createNotification({
      owner: friendCid,
      actor: { id: myUid, name: actorName },
      target: { id: friendCid, name: friendOrgName },
      object: { id: myCid, name: myOrgName },
      type: NotificationType.partnershipRequest,
      status: NotificationStatus.WAITING
    })
    await NotificationModel._createNotification({
      owner: myCid,
      actor: { id: myUid, name: actorName },
      target: { id: myCid, name: myOrgName },
      object: { id: friendCid, name: friendOrgName },
      type: NotificationType.partnershipRequested,
      status: NotificationStatus.INFO
    })
    // TBD: Add audits
    logger.info('Friend request sent from ' + myCid + ' to ' + friendCid)
    return responseBuilder(HttpStatusCode.OK, res, null, null)
	} catch (err) {
    const error = errorHandler(err)
    logger.error(error.message)
    return responseBuilder(error.status, res, error.message)
	}
}

type acceptFriendRequestController = expressTypes.Controller<{ cid: string }, {}, {}, null, localsTypes.ILocals>
 
export const acceptFriendRequest: acceptFriendRequestController = async (req, res) => {
  const { decoded } = res.locals // Requester organisation ID
  const friendCid = req.params.cid // Requested organisation info
	try {
    const myCid = decoded.org
    const myUid = decoded.uid
    await OrganisationModel._addFriendship(myCid, friendCid)
    await OrganisationModel._delIncomingFriendReq(myCid, friendCid)
    await OrganisationModel._addFriendship(friendCid, myCid)
    await OrganisationModel._delOutgoingFriendReq(friendCid, myCid)
    // TBD: Add all gateways in CS to friendships group
    // Create notification
    const actorName = (await UserModel._getUser(myUid)).name
    const myOrgName = (await OrganisationModel._getOrganisation(myCid)).name
    const friendOrgName = (await OrganisationModel._getOrganisation(friendCid)).name
    // Find notification of friendship sent to friendCid --> Cannot let them respond to it anymore
    const notificationsToUpdate = await NotificationModel._findNotifications({
      owners: [myCid],
      status: NotificationStatus.WAITING,
      type: NotificationType.partnershipRequest,
      object: { id: friendCid, name: friendOrgName } // Notifications sent by my friend
    })
    // Update notification of friendshipRequest --> accept it
    notificationsToUpdate.forEach(async (it) => {
      await NotificationModel._setRead(it)
      await NotificationModel._setStatus(it, NotificationStatus.RESPONDED)
    })
    // Send notification to affected organisation --> friendCid
    await NotificationModel._createNotification({
      owner: friendCid,
      actor: { id: myUid, name: actorName },
      target: { id: friendCid, name: friendOrgName },
      object: { id: myCid, name: myOrgName },
      type: NotificationType.partnershipAccepted,
      status: NotificationStatus.ACCEPTED
    })
    // TBD: Add audits
    logger.info('Friend request accepted between' + myCid + ' and ' + friendCid)
    return responseBuilder(HttpStatusCode.OK, res, null, null)
	} catch (err) {
    const error = errorHandler(err)
    logger.error(error.message)
    return responseBuilder(error.status, res, error.message)
	}
}

type rejectFriendRequestController = expressTypes.Controller<{ cid: string }, {}, {}, null, localsTypes.ILocals>
 
export const rejectFriendRequest: rejectFriendRequestController = async (req, res) => {
  const { decoded } = res.locals // Requester organisation ID
  const friendCid = req.params.cid // Requested organisation info
	try {
    const myCid = decoded.org
    const myUid = decoded.uid
    await OrganisationModel._delIncomingFriendReq(myCid, friendCid)
    await OrganisationModel._delOutgoingFriendReq(friendCid, myCid)
    // Create notification
    const actorName = (await UserModel._getUser(myUid)).name
    const myOrgName = (await OrganisationModel._getOrganisation(myCid)).name
    const friendOrgName = (await OrganisationModel._getOrganisation(friendCid)).name
    // Find notification of friendship sent to friendCid --> Cannot let them respond to it anymore
    const notificationsToUpdate = await NotificationModel._findNotifications({
      owners: [myCid],
      status: NotificationStatus.WAITING,
      type: NotificationType.partnershipRequest,
      object: { id: friendCid, name: friendOrgName } // Notifications sent by my friend
    })
    // Update notification of friendshipRequest --> reject it
    notificationsToUpdate.forEach(async (it) => {
      await NotificationModel._setRead(it)
      await NotificationModel._setStatus(it, NotificationStatus.RESPONDED)
    })
    // Send notification to affected organisation --> friendCid
    await NotificationModel._createNotification({
      owner: friendCid,
      actor: { id: myUid, name: actorName },
      target: { id: friendCid, name: friendOrgName },
      object: { id: myCid, name: myOrgName },
      type: NotificationType.partnershipRejected,
      status: NotificationStatus.REJECTED
    })
    // TBD: Add audits
    logger.info('Friend request rejected between' + myCid + ' and ' + friendCid)
    return responseBuilder(HttpStatusCode.OK, res, null, null)
	} catch (err) {
    const error = errorHandler(err)
    logger.error(error.message)
    return responseBuilder(error.status, res, error.message)
	}
}

type cancelFriendRequestController = expressTypes.Controller<{ cid: string }, {}, {}, null, localsTypes.ILocals>
 
export const cancelFriendRequest: cancelFriendRequestController = async (req, res) => {
  const { decoded } = res.locals // Requester organisation ID
  const friendCid = req.params.cid // Requested organisation info
	try {
    const myCid = decoded.org
    const myUid = decoded.uid
    await OrganisationModel._delIncomingFriendReq(friendCid, myCid)
    await OrganisationModel._delOutgoingFriendReq(myCid, friendCid)
    // Create notification
    const actorName = (await UserModel._getUser(myUid)).name
    const myOrgName = (await OrganisationModel._getOrganisation(myCid)).name
    const friendOrgName = (await OrganisationModel._getOrganisation(friendCid)).name
    // Find notification of friendship sent to friendCid --> Cannot let them respond to it anymore
    const notificationsToUpdate = await NotificationModel._findNotifications({
      owners: [friendCid],
      status: NotificationStatus.WAITING,
      type: NotificationType.partnershipRequest,
      object: { id: myCid, name: myOrgName } // Notifications sent by my organisation
    })
    // Update notification of friendshipRequest --> cancel it
    notificationsToUpdate.forEach(async (it) => {
      await NotificationModel._setRead(it)
      await NotificationModel._setStatus(it, NotificationStatus.RESPONDED)
    })
    // Send notification to affected organisation --> friendCid
    await NotificationModel._createNotification({
      owner: friendCid,
      actor: { id: myUid, name: actorName },
      target: { id: friendCid, name: friendOrgName },
      object: { id: myCid, name: myOrgName },
      type: NotificationType.partnershipRequestCancelled,
      status: NotificationStatus.INFO
    })
    // TBD: Add audits
    logger.info('Friend request cancelled between' + myCid + ' and ' + friendCid)
    return responseBuilder(HttpStatusCode.OK, res, null, null)
	} catch (err) {
    const error = errorHandler(err)
    logger.error(error.message)
    return responseBuilder(error.status, res, error.message)
	}
}

type cancelFriendshipController = expressTypes.Controller<{ cid: string }, {}, {}, null, localsTypes.ILocals>
 
export const cancelFriendship: cancelFriendshipController = async (req, res) => {
  const { decoded } = res.locals // Requester organisation ID
  const friendCid = req.params.cid // Requested organisation info
	try {
    const myCid = decoded.org
    const myUid = decoded.uid
    await OrganisationModel._delFriendship(myCid, friendCid)
    await OrganisationModel._delFriendship(friendCid, myCid)
    // TBD: Remove all gateways from CS to friendships group
    // TBD: Check all contracts that need to be broken
    // Create notification
    const actorName = (await UserModel._getUser(myUid)).name
    const myOrgName = (await OrganisationModel._getOrganisation(myCid)).name
    const friendOrgName = (await OrganisationModel._getOrganisation(friendCid)).name
    await NotificationModel._createNotification({
      owner: friendCid,
      actor: { id: myUid, name: actorName },
      target: { id: friendCid, name: friendOrgName },
      object: { id: myCid, name: myOrgName },
      type: NotificationType.partnershipCancelled,
      status: NotificationStatus.INFO
    })
    await NotificationModel._createNotification({
      owner: myCid,
      actor: { id: myUid, name: actorName },
      target: { id: myCid, name: myOrgName },
      object: { id: friendCid, name: friendOrgName },
      type: NotificationType.partnershipCancelled,
      status: NotificationStatus.INFO
    })
    // TBD: Add audits
    logger.info('Friend cancelled between' + myCid + ' and ' + friendCid)
    return responseBuilder(HttpStatusCode.OK, res, null, null)
	} catch (err) {
    const error = errorHandler(err)
    logger.error(error.message)
    return responseBuilder(error.status, res, error.message)
	}
}
