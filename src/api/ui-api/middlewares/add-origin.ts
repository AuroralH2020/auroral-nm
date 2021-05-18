import { logger } from '../../../utils/logger'
import { Controller } from '../../../types/express-types'
import { responseBuilder, HttpStatusCode } from '../../../utils'
import { ILocals } from '../../../types/locals-types'

type originController = Controller<{}, {}, {}, null, ILocals>

export const addOrigin: originController = (req, res, next) => {
    try {
        const ip = req.headers['X-Real-IP'] ? req.headers['X-Real-IP'] : req.ip
        res.locals.origin = {
            originIp: ip,
            realm: req.hostname
        }
        // logger.debug(`Succesful request to ${req.method} ${req.path} from ${originIP}`)
        next()
    } catch (err) {
        logger.error(err.stack)
        return responseBuilder(HttpStatusCode.INTERNAL_SERVER_ERROR, res, err.message)
    }
}
