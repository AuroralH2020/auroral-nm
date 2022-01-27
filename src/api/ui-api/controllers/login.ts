// Controller common imports
import { expressTypes, localsTypes } from '../../../types/index'
import { HttpStatusCode } from '../../../utils/http-status-codes'
import { logger } from '../../../utils/logger'
import { responseBuilder } from '../../../utils/response-builder'
import { errorHandler, MyError } from '../../../utils/error-handler'

// Controller specific imports
import { comparePassword, generateSecret, signAppToken, signMailToken, verifyToken, checkTempSecret, hashPassword, verifyHash } from '../../../auth-server/auth-server'
import { passwordlessLogin, recoverPassword } from '../../../auth-server/mailer'
import { AccountModel } from '../../../persistance/account/model'
import { SessionModel } from '../../../persistance/sessions/model'
import { UserModel } from '../../../persistance/user/model'

// Controllers

type authController = expressTypes.Controller<{}, {username: string, password: string}, {}, string, localsTypes.ILocals>
 
export const authenticate: authController = async (req, res) => {
    const { username, password } = req.body
    if (!username || !password) {
            logger.warn('Missing username or password')
            return responseBuilder(HttpStatusCode.BAD_REQUEST, res, null, 'Missing username or password')
	}
	try {
                await comparePassword(username, password)
                const token = await signAppToken(username)
                // TBD: Consider adding LOGIN audit
                // TBD: Add passwordless LOGIN
                return responseBuilder(HttpStatusCode.OK, res, null, token)
	} catch (err) {
                const error = errorHandler(err)
                logger.error(error.message)
                return responseBuilder(error.status, res, error.message)
	}
}

type sendRecoverPwdController = expressTypes.Controller<{}, { username: string }, {}, null, localsTypes.ILocals>
 
export const sendRecoverPwdMail: sendRecoverPwdController = async (req, res) => {
        const { username } = req.body
        if (!username) {
                logger.warn('Missing username')
                return responseBuilder(HttpStatusCode.BAD_REQUEST, res, null)
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
                const error = errorHandler(err)
                logger.error(error.message)
                return responseBuilder(error.status, res, error.message)
        }
}

type processRecoverPwdController = expressTypes.Controller<{ token: string }, { password: string }, {}, null, localsTypes.ILocals>
 
export const processRecoverPwd: processRecoverPwdController = async (req, res) => {
        const { password } = req.body
        const { token } = req.params
        if (!password) {
                logger.warn('Missing password')
                return responseBuilder(HttpStatusCode.BAD_REQUEST, res, null)
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
                const error = errorHandler(err)
                logger.error(error.message)
                return responseBuilder(error.status, res, error.message)
        }
}

type refreshTokenController = expressTypes.Controller<{}, { roles: string }, {}, string, localsTypes.ILocals>
 
export const refreshToken: refreshTokenController = async (req, res) => {
        // const { roles } = req.body
        const { decoded } = res.locals
        if (!decoded) {
                logger.warn('Missing token')
                return responseBuilder(HttpStatusCode.BAD_REQUEST, res, null, 'Missing token')
	}
        try {
                const token = await signAppToken(decoded.iss)
                return responseBuilder(HttpStatusCode.OK, res, null, token)
        } catch (err) {
                const error = errorHandler(err)
                logger.error(error.message)
                return responseBuilder(error.status, res, error.message)
        }
}

type requestPasswordlessController = expressTypes.Controller<{}, { username: string }, {}, null, localsTypes.ILocals>
 
export const requestPasswordless: requestPasswordlessController = async (req, res) => {
        const { username } = req.body
        if (!username) {
                logger.warn('Missing username')
                return responseBuilder(HttpStatusCode.BAD_REQUEST, res, null)
	}
        try {
                // Check if account exists and verified
                await AccountModel._isVerified(username)
                // Sign the token
                const token = await signMailToken(username, 'passwordless')
                // Send mail with token and URI for UI
                passwordlessLogin(username, token, res.locals.origin?.realm)
                return responseBuilder(HttpStatusCode.OK, res, null, null)
        } catch (err) {
                const error = errorHandler(err)
                logger.error(error.message)
                return responseBuilder(error.status, res, error.message)
        }
}

type processPasswordlessController =  expressTypes.Controller<{ token: string }, {}, {}, string, localsTypes.ILocals>
 
export const processPasswordless: processPasswordlessController = async (req, res) => {
        const { token } = req.params
        try {
                // get token object from JWT
                const tokenObject = await verifyToken(token)
                // Check if secret is valid (throws error if not )
                await checkTempSecret(tokenObject.iss, tokenObject.sub)
                logger.debug('Passwordless login validated')
                // generate app token
                const appToken = await signAppToken(tokenObject.iss)
                return responseBuilder(HttpStatusCode.OK, res, null, appToken)
        } catch (err) {
                const error = errorHandler(err)
                logger.error(error.message)
                return responseBuilder(error.status, res, error.message)
        }
}

type rememberCookieController =  expressTypes.Controller<{}, {}, {}, string, localsTypes.ILocals>
 
export const rememberCookie: rememberCookieController = async (req, res) => {
        const { decoded } = res.locals // Requester organisation ID
        try {
                const secret = generateSecret()
                const secretHash = await hashPassword(secret)
                const sessionId = (await SessionModel._createSession({ uid: decoded.uid, secretHash, originIp: res.locals.origin.originIp })).sessionId
               return responseBuilder(HttpStatusCode.OK, res, null, sessionId + ':' + secret)
        } catch (err) {
                const error = errorHandler(err)
                logger.error(error.message)
                return responseBuilder(error.status, res, error.message)
        }
}

type rememberGetTokenController =  expressTypes.Controller<{ }, { cookie: string }, {}, string, localsTypes.ILocals>
 
export const rememberGetToken: rememberGetTokenController = async (req, res) => {
        const { cookie } = req.body
        try {
                // split to get sessionId and secret
                const values = cookie.split(':')
                // find session by ID
                const session = await SessionModel._getSession(values[0])
                // compare secret from cookie to stored hash in db
                if (!await verifyHash(values[1], session.secretHash)) {
                        SessionModel._deleteSession(session.sessionId)
                        throw new MyError('session secret invalid -> deleting session')
                }
                // look for username and get token
                const username = (await UserModel._getUser(session.uid)).email
                const token = await signAppToken(username)

                return responseBuilder(HttpStatusCode.OK, res, null, token)
        } catch (err) {
                const error = errorHandler(err)
                logger.error(error.message)
                return responseBuilder(HttpStatusCode.UNAUTHORIZED, res, error.message)
        }
}
