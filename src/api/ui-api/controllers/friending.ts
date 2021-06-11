// Controller common imports
import { expressTypes, localsTypes } from '../../../types/index'
import { HttpStatusCode } from '../../../utils/http-status-codes'
import { logger } from '../../../utils/logger'
import { responseBuilder } from '../../../utils/response-builder'

// Controller specific imports
import { OrganisationModel } from '../../../persistance/organisation/model'

// Controllers

type processFriendRequestController = expressTypes.Controller<{ cid: string }, {}, {}, null, localsTypes.ILocals>
 
export const processFriendRequest: processFriendRequestController = async (req, res) => {
  const { decoded } = res.locals // Requester organisation ID
  const { cid } = req.params // Requested organisation info
	try {
    const myCid = decoded.org
    await OrganisationModel._addOutgoingFriendReq(myCid, cid)
    await OrganisationModel._addIncomingFriendReq(cid, myCid)
    // TBD: Add Notifications and audits
    logger.info('Friend request sent from ' + myCid + ' to ' + cid)
    return responseBuilder(HttpStatusCode.OK, res, null, null)
	} catch (err) {
		logger.error(err.message)
		return responseBuilder(HttpStatusCode.INTERNAL_SERVER_ERROR, res, err)
	}
}

type acceptFriendRequestController = expressTypes.Controller<{ cid: string }, {}, {}, null, localsTypes.ILocals>
 
export const acceptFriendRequest: acceptFriendRequestController = async (req, res) => {
  const { decoded } = res.locals // Requester organisation ID
  const { cid } = req.params // Requested organisation info
	try {
    const myCid = decoded.org
    await OrganisationModel._addFriendship(myCid, cid)
    await OrganisationModel._delIncomingFriendReq(myCid, cid)
    await OrganisationModel._addFriendship(cid, myCid)
    await OrganisationModel._delOutgoingFriendReq(cid, myCid)
    // TBD: Add all gateways in CS to friendships group
    // TBD: Add Notifications and audits
    logger.info('Friend request accepted between' + myCid + ' and ' + cid)
    return responseBuilder(HttpStatusCode.OK, res, null, null)
	} catch (err) {
		logger.error(err.message)
		return responseBuilder(HttpStatusCode.INTERNAL_SERVER_ERROR, res, err)
	}
}

type rejectFriendRequestController = expressTypes.Controller<{ cid: string }, {}, {}, null, localsTypes.ILocals>
 
export const rejectFriendRequest: rejectFriendRequestController = async (req, res) => {
  const { decoded } = res.locals // Requester organisation ID
  const { cid } = req.params // Requested organisation info
	try {
    const myCid = decoded.org
    await OrganisationModel._delIncomingFriendReq(myCid, cid)
    await OrganisationModel._delOutgoingFriendReq(cid, myCid)
    // TBD: Add Notifications and audits
    logger.info('Friend request rejected between' + myCid + ' and ' + cid)
    return responseBuilder(HttpStatusCode.OK, res, null, null)
	} catch (err) {
		logger.error(err.message)
		return responseBuilder(HttpStatusCode.INTERNAL_SERVER_ERROR, res, err)
	}
}

type cancelFriendRequestController = expressTypes.Controller<{ cid: string }, {}, {}, null, localsTypes.ILocals>
 
export const cancelFriendRequest: cancelFriendRequestController = async (req, res) => {
  const { decoded } = res.locals // Requester organisation ID
  const { cid } = req.params // Requested organisation info
	try {
    const myCid = decoded.org
    await OrganisationModel._delIncomingFriendReq(cid, myCid)
    await OrganisationModel._delOutgoingFriendReq(myCid, cid)
    // TBD: Add Notifications and audits
    logger.info('Friend request cancelled between' + myCid + ' and ' + cid)
    return responseBuilder(HttpStatusCode.OK, res, null, null)
	} catch (err) {
		logger.error(err.message)
		return responseBuilder(HttpStatusCode.INTERNAL_SERVER_ERROR, res, err)
	}
}

type cancelFriendshipController = expressTypes.Controller<{ cid: string }, {}, {}, null, localsTypes.ILocals>
 
export const cancelFriendship: cancelFriendshipController = async (req, res) => {
  const { decoded } = res.locals // Requester organisation ID
  const { cid } = req.params // Requested organisation info
	try {
    const myCid = decoded.org
    await OrganisationModel._delFriendship(myCid, cid)
    await OrganisationModel._delFriendship(cid, myCid)
    // TBD: Remove all gateways from CS to friendships group
    // TBD: Check all contracts that need to be broken
    // TBD: Add Notifications and audits
    logger.info('Friend cancelled between' + myCid + ' and ' + cid)
    return responseBuilder(HttpStatusCode.OK, res, null, null)
	} catch (err) {
		logger.error(err.message)
		return responseBuilder(HttpStatusCode.INTERNAL_SERVER_ERROR, res, err)
	}
}
