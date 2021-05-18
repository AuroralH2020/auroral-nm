// import { Auth } from '../../../utils/jwt'
import { Controller } from '../../../types/express-types'
import { responseBuilder } from '../../../utils/response-builder'
import { HttpStatusCode } from '../../../utils/http-status-codes'
import { ILocals } from '../../../types/locals-types'
import { RolesEnum } from '../../../types/roles'

type JwtController = Controller<{}, {}, null, ILocals>

/**
 * Extracts token from Authorization header,
 * Validates token,
 * Protects resources: If roles are passed verifies that token contains them,
 * @param roles 
 */
export const jwt = (roles?: RolesEnum[]) => {
    // return function(req, res, next) {
    //     try {
    //         const authHeader = req.headers.authorization
    //         const token = authHeader && authHeader.split(' ')[1]
    //         if (!token) {
    //             throw new Error('Unauthorized, missing token')
    //         }
    //         const decoded = Auth.verify(token)
    //         // When roles are included in the validation of the route
    //         // Check that they are present in the token
    //         if (roles && roles.length > 0) {
    //             Auth.protect(decoded, roles)
    //         }
    //         next()
    //     } catch (err) {
    //         console.log(err.stack)
    //         return responseBuilder(HttpStatusCode.INTERNAL_SERVER_ERROR, res, err.message)
    //     }
    // } as JwtController
  }
