// Controller common imports
import { expressTypes, localsTypes } from '../../../types/index'
import { HttpStatusCode } from '../../../utils/http-status-codes'
import { logger } from '../../../utils/logger'
import { responseBuilder } from '../../../utils/response-builder'
import { errorHandler, MyError } from '../../../utils/error-handler'

// Controller specific imports
import { getAllSessions, getSession, delSession } from '../../../core/sessions'

// Controllers

type getAllCtrl = expressTypes.Controller<{ cursor: number }, {}, {}, { cursor: number, sessions: string[] }, localsTypes.ILocals>
 
export const getAll: getAllCtrl = async (req, res) => {
        const cursor = req.params.cursor
        try {
                const data = await getAllSessions(Number(cursor))
                return responseBuilder(HttpStatusCode.OK, res, null, data)
        } catch (err) {
                const error = errorHandler(err)
                logger.error(error.message)
                return responseBuilder(error.status, res, error.message)
        }
}

type getOneCtrl = expressTypes.Controller<{ uid: string }, {}, {}, null, localsTypes.ILocals>
 
export const getOne: getOneCtrl = async (req, res) => {
        const uid = req.params.uid
        try {
                // TBD
                return responseBuilder(HttpStatusCode.OK, res, null)
        } catch (err) {
                const error = errorHandler(err)
                logger.error(error.message)
                return responseBuilder(error.status, res, error.message)
        }
}

type delOneCtrl = expressTypes.Controller<{ uid: string }, {}, {}, null, localsTypes.ILocals>
 
export const delOne: delOneCtrl = async (req, res) => {
        const uid = req.params.uid
        try {
                await delSession(uid)
                return responseBuilder(HttpStatusCode.OK, res, null)
        } catch (err) {
                const error = errorHandler(err)
                logger.error(error.message)
                return responseBuilder(error.status, res, error.message)
        }
}
