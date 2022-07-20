// Controller common imports
import { expressTypes, localsTypes } from '../../../types/index'
import { HttpStatusCode } from '../../../utils/http-status-codes'
import { logger } from '../../../utils/logger'
import { responseBuilder } from '../../../utils/response-builder'
import { errorHandler, MyError } from '../../../utils/error-handler'

// Controller specific imports
import { InvitationModel } from '../../../persistance/invitation/model'
import { IInvitationPre, IInvitation, InvitationStatus } from '../../../persistance/invitation/types'
import { OrganisationModel } from '../../../persistance/organisation/model'
import { invitationMail } from '../../../auth-server/mailer'

// Controllers

type getInvitationController = expressTypes.Controller<{ id: string }, {}, {}, IInvitation, localsTypes.ILocals>
 
export const getInvitation: getInvitationController = async (req, res) => {
        const { id } = req.params
        try {
                const data = await InvitationModel._getInvitation(id)
                // Set invitation as used
                await InvitationModel._setUsedInvitation(id)
                return responseBuilder(HttpStatusCode.OK, res, null, data)
        } catch (err) {
                const error = errorHandler(err)
                logger.error(error.message)
                return responseBuilder(error.status, res, error.message)
        }
}

type getAllInvitationsCtrl = expressTypes.Controller<{}, {}, {}, IInvitation[], localsTypes.ILocals>
 
export const getAllInvitations: getAllInvitationsCtrl = async (_req, res) => {
        const { decoded } = res.locals
        try {
                const data = await InvitationModel._getAllInvitations(decoded.org)
                return responseBuilder(HttpStatusCode.OK, res, null, data)
        } catch (err) {
                const error = errorHandler(err)
                logger.error(error.message)
                return responseBuilder(error.status, res, error.message)
        }
}

type postInvitationController = expressTypes.Controller<{}, IInvitationPre, {}, null, localsTypes.ILocals>
 
export const postInvitation: postInvitationController = async (req, res) => {
        const { decoded, origin }  = res.locals
        const data = req.body
        try {        
                if (!decoded) {
                        throw new Error('Problem decoding token') 
                } else {
                        // Store invitation
                        const myOrg = await OrganisationModel._getOrganisation(decoded.org)
                        const newInvitation = await InvitationModel._createInvitation({
                                ...data,
                                sentBy: {
                                        cid: myOrg.cid,
                                        organisation: myOrg.name,
                                        uid: decoded.uid,
                                        email: decoded.iss
                                }
                        })
                        // Send invitation mail
                        invitationMail(data.emailTo, newInvitation.invitationId, data.type, origin?.realm)
                        return responseBuilder(HttpStatusCode.OK, res, null, null)
                }
        } catch (err) {
                const error = errorHandler(err)
                logger.error(error.message)
                return responseBuilder(error.status, res, error.message)
        }
}

type resendInvitationController = expressTypes.Controller<{id: string}, {}, {}, null, localsTypes.ILocals>
 
export const resendInvitation: resendInvitationController = async (req, res) => {
        const { decoded, origin } = res.locals
        const { id } = req.params
        try {
                if (!decoded) {
                        throw new Error('Problem decoding token')
                }
                const inv = await InvitationModel._getInvitation(id)
                // test if admin from same organisation is trying to resend
                if (inv.status === InvitationStatus.DONE || inv.sentBy.cid !== decoded.org) {
                        throw new MyError('Not aproved to resend invitation')
                }
                // test if lastly updated is more thand before 5 minute
                if ((new Date().getTime() - inv.updated) < 300000) {
                        throw new MyError('Too early to resend', HttpStatusCode.TOO_MANY_REQUESTS)
                }
                // Set status to pending and set updatedTime
                await InvitationModel._setInvitationStatus(id, InvitationStatus.PENDING)
                // Send invitation mail
                invitationMail(inv.emailTo, inv.invitationId, inv.type, origin?.realm)
                return responseBuilder(HttpStatusCode.OK, res, null, null)
        } catch (err) {
                const error = errorHandler(err)
                logger.error(error.message)
                return responseBuilder(error.status, res, error.message)
        }
}
