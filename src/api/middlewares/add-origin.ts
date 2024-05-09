import { v4 as uuidv4 } from 'uuid'
import { logger } from '../../utils/logger'
import { Controller } from '../../types/express-types'
import { responseBuilder } from '../../utils'
import { ILocalsBasic, Interfaces } from '../../types/locals-types'
import { errorHandler } from '../../utils/error-handler'
import { obscureLastIpOctet } from '../../utils/ip'

type originController = Controller<{}, {}, {}, null, ILocalsBasic>

export const addOrigin = (_type: Interfaces) => {
    return function(req, res, next) {
        try {
            const ip =  obscureLastIpOctet(req.ip)
            res.locals.origin = {
                interface: _type,
                originIp: ip,
                realm: req.hostname,
            }
            res.locals.reqId = uuidv4()
            logger.debug({ msg: `Succesful request to ${req.method} ${req.path} from ${ip}`, id: res.locals.reqId })
            next()
        } catch (err) {
            const error = errorHandler(err)
            logger.error({ message: error.stack, id: res.locals.reqId })
            return responseBuilder(error.status, res, error.message)
        }
    } as originController
}
