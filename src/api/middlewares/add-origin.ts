import { logger } from '../../utils/logger'
import { Controller } from '../../types/express-types'
import { responseBuilder } from '../../utils'
import { ILocals, Interfaces } from '../../types/locals-types'
import { errorHandler } from '../../utils/error-handler'

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
            const error = errorHandler(err)
            logger.error(error.stack)
            return responseBuilder(error.status, res, error.message)
        }
    } as originController
}
