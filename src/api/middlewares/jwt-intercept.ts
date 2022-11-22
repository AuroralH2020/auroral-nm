import { AuroralToken } from '../../core/jwt-wrapper'
import { Controller } from '../../types/express-types'
import { responseBuilder } from '../../utils/response-builder'
import { ILocals } from '../../types/locals-types'
import { RolesEnum } from '../../types/roles'
import { errorHandler } from '../../utils/error-handler'
import { getSession } from '../../core/sessions'
import { HttpStatusCode } from '../../utils'
import { logger } from '../../utils/logger'
import { JsonType } from '../../types/misc-types'
import { Config } from '../../config'
import { tokenBlacklist } from '../../microservices/tokenBlacklist'

type JwtController = Controller<{}, {}, {}, null, ILocals>

/**
 * Extracts token from Authorization header,
 * Validates token,
 * Protects resources: If roles are passed verifies that token contains them,
 * @param roles 
 */
export const jwt = (roles?: RolesEnum[]) => {
    return function(req, res, next) {
        try {
            const authHeader = req.headers.authorization as string
            const token = authHeader ? authHeader.split(' ')[1] : null
            if (!token) {
                throw new Error('Unauthorized, missing token')
            }
            AuroralToken.verify(token, res.locals.origin.originIp).then((decoded) => {
                // When roles are included in the validation of the route
                // Check that they are present in the token
                if (roles && roles.length > 0) {
                    AuroralToken.protect(decoded, roles)
                }
                // Serialize roles and add to array
                const userRoles = decoded.roles.split(',')
                .map(e => {
                    switch (e) {
                        case 'administrator': return RolesEnum.ADMIN
                        case 'devOps': return RolesEnum.DEV_OPS
                        case 'superUser': return RolesEnum.SUPER_USER
                        case 'infrastructure operator': return RolesEnum.INFRAS_OPERATOR
                        case 'service provider': return RolesEnum.SERV_PROVIDER
                        case 'device owner': return RolesEnum.DEV_OWNER
                        case 'system integrator': return RolesEnum.SYS_INTEGRATOR
                        case 'user': return RolesEnum.USER
                        default:
                            throw Error('Cannot serialize role from token')
                    }
                })
                // Add extracted fields to locals
                res.locals.roles = userRoles
                res.locals.decoded = decoded
                res.locals.token = token
                // Verify session
                getSession(decoded.sub).then(
                    async (session) => {
                        if (Config.SESSIONS.ENABLED === false) {
                            return next()
                        } else if (session) {
                            // TBD Additional security
                            // TBD Check if IP matches
                            // if (session.split(':')[1] === res.locals.origin.originIp) {
                            //     return next()
                            // } else {
                            //     return responseBuilder(HttpStatusCode.UNAUTHORIZED, res, 'Strange activity detected, IP changed during session life, possible use of VPN or tampering attempt')
                            // }
                            // Blacklisted token check
                            if (await tokenBlacklist.checkInBlacklist(decoded.sub, token)) {
                                return responseBuilder(HttpStatusCode.UNAUTHORIZED, res, 'Token is blacklisted')
                            }
                            return next()
                        } else {
                            logger.error('Session expired')
                            return responseBuilder(HttpStatusCode.UNAUTHORIZED, res, decoded.sub + ': Session expired')
                        }
                    }
                ).catch(() => {
                    // Verify session error block
                    return responseBuilder(HttpStatusCode.INTERNAL_SERVER_ERROR, res, 'Error retrieving session')
                })
            }).catch((err1) => {
                // Verify token error block
                const error = errorHandler(err1)
                try {
                    const tokenData = AuroralToken.decode(token)
                    logger.error('uid - ' + tokenData.sub + ' : ' + error.message)
                    return responseBuilder(error.status, res, error.message)
                } catch (err) {
                    const finalerror = errorHandler(err)
                    return responseBuilder(finalerror.status, res, finalerror.message)
                }
            })     
        } catch (err2) {
            const error = errorHandler(err2)
            logger.error(error.message)
            return responseBuilder(error.status, res, error.message)
        }
    } as JwtController
  }
