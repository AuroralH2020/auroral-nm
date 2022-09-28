// Controller common imports
import { errorHandler, MyError } from '../../../utils/error-handler'
import { ExternalUserModel } from '../../../persistance/externalUsers/model'
import { ACLObject, GrantType } from '../../../persistance/externalUsers/types'
import { expressTypes, localsTypes } from '../../../types/index'
import { HttpStatusCode, logger, responseBuilder } from '../../../utils'
import { verifyHash } from '../../../auth-server/auth-server'

// EXTERAL USER API

type checkExternalAuthController = expressTypes.Controller<{}, { keyid: string, secret: string }, {}, { grantType: GrantType[],  ACL: ACLObject }, localsTypes.ILocals>

export const checkExternalAuth: checkExternalAuthController = async (req, res) => {
    const { keyid, secret } = req.body
        try {    
            const eUser = await ExternalUserModel._getByKeyid(keyid)
            const isValid = await verifyHash(secret, eUser.secretKey)
            if (!isValid) {
                throw new MyError('Invalid secret', HttpStatusCode.UNAUTHORIZED)
            }
            return responseBuilder(HttpStatusCode.OK, res, null, { grantType: eUser.grantType, ACL: eUser.ACL })
        } catch (err) {
            const error = errorHandler(err)
            logger.error({ msg: error.message, id: res.locals.reqId })
            return responseBuilder(error.status, res, error.message)
        }
}
