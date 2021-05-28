// Controller common imports
import { expressTypes, localsTypes } from '../../../types/index'
import { HttpStatusCode } from '../../../utils/http-status-codes'
import { logger } from '../../../utils/logger'
import { responseBuilder } from '../../../utils/response-builder'

// Controller specific imports
import { InvitationModel } from '../../../persistance/invitation/model'
import { IInvitationPre, IInvitation } from '../../../persistance/invitation/types'
import { OrganisationModel } from '../../../persistance/organisation/model'
import { invitationMail } from '../../../auth-server/mailer'

// Controllers

type getInvitationController = expressTypes.Controller<{ invitationId: string }, {}, {}, IInvitation, localsTypes.ILocals>
 
export const getInvitation: getInvitationController = async (req, res) => {
        const { invitationId } = req.params
        try {
                const data = await InvitationModel._getInvitation(invitationId)
                // Set invitation as used
                await InvitationModel._setUsedInvitation(invitationId)
                return responseBuilder(HttpStatusCode.OK, res, null, data)
        } catch (err) {
                logger.error(err.message)
                return responseBuilder(HttpStatusCode.INTERNAL_SERVER_ERROR, res, err)
        }
}

type postInvitationController = expressTypes.Controller<{}, { data: IInvitationPre }, {}, null, localsTypes.ILocals>
 
export const postInvitation: postInvitationController = async (req, res) => {
        const { decoded, origin }  = res.locals
        const { data } = req.body
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
                                        email: decoded.iss
                                }
                        })
                        // Send invitation mail
                        invitationMail(data.emailTo, newInvitation.invitationId, data.type, origin?.realm)
                        return responseBuilder(HttpStatusCode.OK, res, null, null)
                }
        } catch (err) {
                logger.error(err.message)
                return responseBuilder(HttpStatusCode.INTERNAL_SERVER_ERROR, res, err)
        }
}