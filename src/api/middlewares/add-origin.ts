import { logger } from '../../utils/logger'
import { Controller } from '../../types/express-types'
import { responseBuilder, HttpStatusCode } from '../../utils'
import { ILocals, Interfaces } from '../../types/locals-types'

type originController = Controller<{}, {}, {}, null, ILocals>

export const addOrigin = (_type: Interfaces) => {
    return function(req, res, next) {
        try {
            const ip = req.headers['X-Real-IP'] ? req.headers['X-Real-IP'] : req.ip
            res.locals.origin = {
                interface: _type,
                originIp: ip,
                realm: req.hostname
            }
            logger.debug(`Succesful request to ${req.method} ${req.path}`)
            next()
        } catch (err) {
            logger.error(err.stack)
            return responseBuilder(HttpStatusCode.INTERNAL_SERVER_ERROR, res, err.message)
        }
    } as originController
}
