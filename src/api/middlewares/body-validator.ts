
import Joi from 'joi'
import { logger } from '../../utils/logger'
import { Controller } from '../../types/express-types'
import { responseBuilder } from '../../utils'
import { errorHandler } from '../../utils/error-handler'
import { JsonType } from '../../types/misc-types'
import { HttpStatusCode } from '../../utils/http-status-codes'


type bodyValidatorController = Controller<{}, JsonType, {}, null, {}>

export const validateBody = (_schema: Joi.ObjectSchema) => {
    return function (req, res, next) {
        try {
            const validation = _schema.validate(req.body.data)
            if (validation.error) {
                logger.debug(validation.error.message)
                return responseBuilder(HttpStatusCode.BAD_REQUEST, res,  validation.error.stack)
            } else {
                next()
            }
        } catch (err) {
            const error = errorHandler(err)
            logger.error(error.stack)
            return responseBuilder(error.status, res, error.message)
        }
    } as bodyValidatorController
}
