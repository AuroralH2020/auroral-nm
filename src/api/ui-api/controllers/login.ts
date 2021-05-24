// Controller common imports
import { expressTypes, localsTypes } from '../../../types/index'
import { HttpStatusCode } from '../../../utils/http-status-codes'
import { logger } from '../../../utils/logger'
import { responseBuilder } from '../../../utils/response-builder'

// Controller specific imports
import { comparePassword, signAppToken, signMailToken, verifyToken, checkTempSecret, hashPassword } from '../../../auth-server/auth-server'
import { recoverPassword } from '../../../auth-server/mailer'
import { AccountModel } from '../../../persistance/account/model'

// Controllers

type authController = expressTypes.Controller<{}, {username: string, password: string}, {}, string, localsTypes.ILocals>
 
export const authenticate: authController = async (req, res) => {
    const { username, password } = req.body
    if (!username || !password) {
		return responseBuilder(HttpStatusCode.BAD_REQUEST, res)
	}
	try {
                await comparePassword(username, password)
                const token = await signAppToken(username)
                // TBD: Consider adding LOGIN audit
                // TBD: Add passwordless LOGIN
                return responseBuilder(HttpStatusCode.OK, res, null, token)
	} catch (err) {
		logger.error(err.message)
		return responseBuilder(HttpStatusCode.INTERNAL_SERVER_ERROR, res, err)
	}
}

type sendRecoverPwdController = expressTypes.Controller<{}, { username: string }, {}, null, localsTypes.ILocals>
 
export const sendRecoverPwdMail: sendRecoverPwdController = async (req, res) => {
        const { username } = req.body
        if (!username) {
                return responseBuilder(HttpStatusCode.BAD_REQUEST, res)
	}
        try {
                // Check if account exists and verified
                await AccountModel._isVerified(username)
                // Sign the token
                const token = await signMailToken(username, 'pwdrecovery')
                // Send mail with token and URI for UI
                recoverPassword(username, token, res.locals.origin?.realm)
                return responseBuilder(HttpStatusCode.OK, res, null, null)
        } catch (err) {
                logger.error(err.message)
                return responseBuilder(HttpStatusCode.INTERNAL_SERVER_ERROR, res, err)
        }
}

type processRecoverPwdController = expressTypes.Controller<{ token: string }, { password: string }, {}, null, localsTypes.ILocals>
 
export const processRecoverPwd: processRecoverPwdController = async (req, res) => {
        const { password } = req.body
        const { token } = req.params
        if (!password) {
                return responseBuilder(HttpStatusCode.BAD_REQUEST, res)
	}
        try {
                const decoded = await verifyToken(token)
                const username = decoded.iss
                // Validate if secret in token has not expired
                await checkTempSecret(username, decoded.sub)
                if (decoded.aud !== 'pwdrecovery') {
                        throw new Error('Invalid token type')
                } else {
                        const hash = await hashPassword(password)
                        const userDoc = await AccountModel._getDoc(username)
                        await userDoc._updatePasswordHash(hash)
                }
                logger.info(`User account ${username} password restored`)
                return responseBuilder(HttpStatusCode.OK, res, null, null)
        } catch (err) {
                logger.error(err.message)
                return responseBuilder(HttpStatusCode.INTERNAL_SERVER_ERROR, res, err)
        }
}

type refreshTokenController = expressTypes.Controller<{}, { roles: string }, {}, string, localsTypes.ILocals>
 
export const refreshToken: refreshTokenController = async (req, res) => {
        // const { roles } = req.body
        const { decoded } = res.locals
        if (!decoded) {
                return responseBuilder(HttpStatusCode.BAD_REQUEST, res)
	}
        try {
                const token = await signAppToken(decoded.iss)
                return responseBuilder(HttpStatusCode.OK, res, null, token)
        } catch (err) {
                logger.error(err.message)
                return responseBuilder(HttpStatusCode.INTERNAL_SERVER_ERROR, res, err)
        }
}
