// Controller common imports
import { expressTypes, localsTypes } from '../../../types/index'
import { HttpStatusCode } from '../../../utils/http-status-codes'
import { logger } from '../../../utils/logger'
import { responseBuilder } from '../../../utils/response-builder'
import { errorHandler } from '../../../utils/error-handler'

// Controller specific imports
import { OrganisationModel } from '../../../persistance/organisation/model'
import { FriendshipsData, IOrganisationUI, IOrganisationUpdate, OrgConfiguration } from '../../../persistance/organisation/types'

// Controllers

type getOneController = expressTypes.Controller<{ cid: string }, {}, {}, IOrganisationUI & FriendshipsData, localsTypes.ILocals>
 
export const getOne: getOneController = async (req, res) => {
        const { decoded } = res.locals // Requester organisation ID
        const { cid } = req.params // Requested organisation info
        try {
                const data = await OrganisationModel._getOrganisation(cid)
                // Complete organisation data with friendships
                let isNeighbour = false
                let canSendNeighbourRequest = true
                let canCancelNeighbourRequest = false
                let canAnswerNeighbourRequest = false
                // Use friendship arrays
                const myNeighbours = data.knows
                const requestsFrom = data.knowsRequestsFrom
                const requestsTo = data.knowsRequestsTo
                // Case I am same org that I am requesting
                if (cid === decoded.org) {
                        canSendNeighbourRequest = false
                } else {
                        // Check whether we are neighbors
                        isNeighbour = myNeighbours.indexOf(decoded.org) !== -1

                        // Check whether authenticated user received or sent neighbour request to requested profile
                        // Check whether authenticated user can be cancelled sent neighbour request to requested profile
                        canCancelNeighbourRequest = requestsFrom.indexOf(decoded.org) !== -1

                        // Check whether authenticated user can cancel sent request
                        canAnswerNeighbourRequest = requestsTo.indexOf(decoded.org) !== -1
                        
                        // If any of the previous is true we cannot send friendship requests
                        canSendNeighbourRequest = !canAnswerNeighbourRequest && !canCancelNeighbourRequest && !isNeighbour
                }
                // Compile final response
                const dataWithFriendships = {
                        ...data,
                        isNeighbour,
                        canSendNeighbourRequest,
                        canCancelNeighbourRequest,
                        canAnswerNeighbourRequest
                }
                return responseBuilder(HttpStatusCode.OK, res, null, dataWithFriendships)
        } catch (err) {
                const error = errorHandler(err)
                logger.error(error.message)
                return responseBuilder(error.status, res, error.message)
        }
}

type getManyController = expressTypes.Controller<{ cid: string }, {}, { type: string, offset: string }, IOrganisationUI[], localsTypes.ILocals>
 
export const getMany: getManyController = async (req, res) => {
        const { cid } = req.params
        const { type, offset } = req.query
        try {
                const data = await OrganisationModel._getOrganisations(cid, Number(type), Number(offset))
                return responseBuilder(HttpStatusCode.OK, res, null, data)
        } catch (err) {
                const error = errorHandler(err)
                logger.error(error.message)
                return responseBuilder(error.status, res, error.message)
        }
}

type updateOrganisationController = expressTypes.Controller<{ cid: string }, IOrganisationUpdate, {}, null, localsTypes.ILocals>
 
export const updateOrganisation: updateOrganisationController = async (req, res) => {
        const { cid } = req.params
        const payload = req.body
        try {
                const orgDoc = await OrganisationModel._getDoc(cid)
                orgDoc._updateOrganisation(payload)
                return responseBuilder(HttpStatusCode.OK, res, null, null)
        } catch (err) {
                const error = errorHandler(err)
                logger.error(error.message)
                return responseBuilder(error.status, res, error.message)
        }
}

type getConfigurationController = expressTypes.Controller<{ cid: string }, {}, {}, OrgConfiguration, localsTypes.ILocals>
 
export const getConfiguration: getConfigurationController = async (req, res) => {
        const { cid } = req.params
        try {
                const data = await OrganisationModel._getConfiguration(cid)
                return responseBuilder(HttpStatusCode.OK, res, null, data)
        } catch (err) {
                const error = errorHandler(err)
                logger.error(error.message)
                return responseBuilder(error.status, res, error.message)
        }
}
