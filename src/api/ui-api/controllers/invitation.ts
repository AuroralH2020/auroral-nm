// Controller common imports
import { expressTypes, localsTypes } from '../../../types/index'
import { HttpStatusCode } from '../../../utils/http-status-codes'
import { logger } from '../../../utils/logger'
import { responseBuilder } from '../../../utils/response-builder'
import { errorHandler } from '../../../utils/error-handler'

// Controller specific imports
import { InvitationModel } from '../../../persistance/invitation/model'
import { IInvitationPre, IInvitation } from '../../../persistance/invitation/types'
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
