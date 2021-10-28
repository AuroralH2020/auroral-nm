import { Auth } from '../../utils/jwt'
import { Controller } from '../../types/express-types'
import { responseBuilder } from '../../utils/response-builder'
import { ILocals } from '../../types/locals-types'
import { RolesEnum } from '../../types/roles'
import { errorHandler } from '../../utils/error-handler'

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
            // const authHeader = req.headers.authorization
            const authHeader = req.headers['x-access-token']
            // const token = authHeader && authHeader.split(' ')[1]
            const token = authHeader as string
            if (!token) {
                throw new Error('Unauthorized, missing token')
            }
            const decoded = Auth.verify(token, res.locals.origin.originIp)
            // When roles are included in the validation of the route
            // Check that they are present in the token
            if (roles && roles.length > 0) {
                Auth.protect(decoded, roles)
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
            next()
        } catch (err) {
            const error = errorHandler(err)
            return responseBuilder(error.status, res, error.message)
        }
    } as JwtController
  }
