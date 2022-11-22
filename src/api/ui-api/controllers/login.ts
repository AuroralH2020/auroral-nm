// Controller common imports
import { expressTypes, localsTypes } from '../../../types/index'
import { HttpStatusCode } from '../../../utils/http-status-codes'
import { logger } from '../../../utils/logger'
import { responseBuilder } from '../../../utils/response-builder'
import { errorHandler, MyError } from '../../../utils/error-handler'

// Controller specific imports
import { comparePassword, generateSecret, signAppToken, signMailToken, verifyToken, checkTempSecret, hashPassword, verifyHash, AuroralUserType } from '../../../auth-server/auth-server'
import { passwordlessLogin, recoverPassword } from '../../../auth-server/mailer'
import { AccountModel } from '../../../persistance/account/model'
import { SessionModel } from '../../../persistance/sessions/model'
import { UserModel } from '../../../persistance/user/model'
import { tokenBlacklist } from '../../../microservices/tokenBlacklist'
import { AuditModel } from '../../../persistance/audit/model'
import { EventType, ResultStatusType } from '../../../types/misc-types'

// Controllers

type authController = expressTypes.Controller<{}, { username: string, password: string }, {}, any, localsTypes.ILocals>
 
export const authenticate: authController = async (req, res) => {
    const { username, password } = req.body
    const { decoded } = res.locals
    if (!username || !password) {
            logger.warn('Missing username or password')
            return responseBuilder(HttpStatusCode.BAD_REQUEST, res, 'Missing username or password')
	}
	try {
                await comparePassword(username, password)
                const tokens = await signAppToken(username, res.locals.origin.originIp, AuroralUserType.UI)
                // Audit login
                const myAccount = await AccountModel._getAccount(username)
                const myUser = await UserModel._getUser(myAccount.uid)
                // Login audit
                await AuditModel._createAudit({
                        ...res.locals.audit,
                        cid: myAccount.cid,
                        message: 'User logged in',
                        actor: { id: myAccount.uid, name: myUser.name },
                        target: { id: myAccount.uid, name: myUser.name }, 
                        type: EventType.userLoggedIn,
                        labels: { ...res.locals.audit.labels, status: ResultStatusType.SUCCESS }
                })
                return responseBuilder(HttpStatusCode.OK, res, null, tokens)
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
                const decoded = await verifyToken(token) // @TBD need to do it with the WRAPPER!!!
                const username = decoded.mail
                // Validate if secret in token has not expired
                await checkTempSecret(username, decoded.sub)
                if (!decoded.aud.includes('pwdrecovery')) {
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

type refreshTokenController = expressTypes.Controller<{}, { refreshToken: string }, {}, any, localsTypes.ILocals>
 
export const refreshToken: refreshTokenController = async (req, res) => {
        const { decoded } = res.locals
        const myRefreshToken = req.body.refreshToken
        if (!decoded) {
                logger.warn('Missing token')
                return responseBuilder(HttpStatusCode.UNAUTHORIZED, res, 'Missing token')
	}
        try {
                const original = await verifyToken(myRefreshToken)
                if (original.aud.includes('refresh') && original.id === decoded.id) {
                        const tokens = await signAppToken(decoded.id, res.locals.origin.originIp, decoded.iat)
                        return responseBuilder(HttpStatusCode.OK, res, null, tokens)
                } else {
                        logger.warn('Refresh token not valid')
                        return responseBuilder(HttpStatusCode.FORBIDDEN, res, 'Refresh token not valid') 
                }
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

type processPasswordlessController =  expressTypes.Controller<{ token: string }, {}, {}, { token: string, refreshToken: string }, localsTypes.ILocals>
 
export const processPasswordless: processPasswordlessController = async (req, res) => {
        const { token } = req.params
        try {
                // get token object from JWT
                const tokenObject = await verifyToken(token)
                // Check if secret is valid (throws error if not )
                await checkTempSecret(tokenObject.id, tokenObject.sub)
                logger.debug('Passwordless login validated')
                // generate app token
                const tokens = await signAppToken(tokenObject.id, res.locals.origin.originIp)
                return responseBuilder(HttpStatusCode.OK, res, null, tokens)
        } catch (err) {
                const error = errorHandler(err)
                logger.error(error.message)
                return responseBuilder(error.status, res, error.message)
        }
}

type rememberCookieController =  expressTypes.Controller<{}, {}, {}, string, localsTypes.ILocals>
 
export const rememberCookie: rememberCookieController = async (_req, res) => {
        const { decoded } = res.locals // Requester organisation ID
        try {
                const secret = generateSecret()
                const secretHash = await hashPassword(secret)
                const sessionId = (await SessionModel._createSession({ uid: decoded.id, secretHash, originIp: res.locals.origin.originIp })).sessionId
               return responseBuilder(HttpStatusCode.OK, res, null, sessionId + ':' + secret)
        } catch (err) {
                const error = errorHandler(err)
                logger.error(error.message)
                return responseBuilder(error.status, res, error.message)
        }
}

type rememberGetTokenController =  expressTypes.Controller<{ }, { cookie: string }, {}, any, localsTypes.ILocals>
 
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
                const token = await signAppToken(username, res.locals.origin.originIp)

                return responseBuilder(HttpStatusCode.OK, res, null, token)
        } catch (err) {
                const error = errorHandler(err)
                logger.error(error.message)
                return responseBuilder(HttpStatusCode.UNAUTHORIZED, res, error.message)
        }
}

type rememberDeleteTokenController =  expressTypes.Controller<{ sessionId: string}, { }, {}, null, localsTypes.ILocals>
 
export const rememberDeleteToken: rememberDeleteTokenController = async (req, res) => {
        const { sessionId } = req.params
        const { decoded } = res.locals
        try {
                // split to get sessionId and secret
                // remove session by ID
                SessionModel._deleteSession(sessionId)
                tokenBlacklist.addToBlacklist(decoded.id, res.locals.token)
                return responseBuilder(HttpStatusCode.OK, res, null, null)
        } catch (err) {
                const error = errorHandler(err)
                logger.error(error.message)
                return responseBuilder(HttpStatusCode.UNAUTHORIZED, res, error.message)
        }
}

type logoutController =  expressTypes.Controller<{}, {}, {}, string, localsTypes.ILocals>
 
export const logout: logoutController = async (_req, res) => {
        const { decoded } = res.locals 
        try {
                logger.debug('Logging out: ' + decoded.id)
                await tokenBlacklist.addToBlacklist(decoded.id, res.locals.token)
                const myUser = await UserModel._getUser(decoded.id)
                // Logout audit
                await AuditModel._createAudit({
                        ...res.locals.audit,
                        cid: myUser.cid,
                        actor: { id: decoded.id, name: myUser.name },
                        target: { id: decoded.id, name: myUser.name }, 
                        type: EventType.userLoggedOut,
                        labels: { ...res.locals.audit.labels, status: ResultStatusType.SUCCESS }
                      })
               return responseBuilder(HttpStatusCode.OK, res, null, 'Logged out')
        } catch (err) {
                const error = errorHandler(err)
                logger.error(error.message)
                return responseBuilder(error.status, res, error.message)
        }
}
