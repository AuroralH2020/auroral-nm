// Controller common imports
import { expressTypes, localsTypes } from '../../../types/index'
import { HttpStatusCode } from '../../../utils/http-status-codes'
import { logger } from '../../../utils/logger'
import { responseBuilder } from '../../../utils/response-builder'
import { errorHandler, MyError } from '../../../utils/error-handler'

// Controller specific imports
import { comparePassword, generateSecret, signAppToken, signMailToken, verifyToken, checkTempSecret, hashPassword, verifyHash } from '../../../auth-server/auth-server'
import { MailToken, AuroralToken } from '../../../core/jwt-wrapper'
import { passwordlessLogin, recoverPassword } from '../../../auth-server/mailer'
import { AccountModel } from '../../../persistance/account/model'
import { SessionModel } from '../../../persistance/sessions/model'
import { UserModel } from '../../../persistance/user/model'
import { tokenBlacklist } from '../../../microservices/tokenBlacklist'
import { AuditModel } from '../../../persistance/audit/model'
import { EventType, ResultStatusType } from '../../../types/misc-types'
import { AuroralUserType } from '../../../types/jwt-types'
import { ensureUserExistsinDLT } from '../../../core/dlt'

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
                const tokens = await signAppToken(username, AuroralUserType.UI, res.locals.origin.originIp)
                // Audit login
                const myAccount = await AccountModel._getAccount(username)
                const myUser = await UserModel._getUser(myAccount.uid)
                // Ensure that user is registered in DLT
                await ensureUserExistsinDLT(myAccount.username, myUser.cid, myAccount.username)
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

type introspectionController = expressTypes.Controller<{}, { token: string }, {}, any, localsTypes.ILocals>
// Introspection endpoint for DLT, basic auth is required (cred in .env file) 

export const introspection: introspectionController = async (req, res) => {
        const { token } = req.body
        
                try {
                // check basic auth included
                const auth = req.headers.authorization
                console.log(req.headers)
                if (1) {
                        return res.status(200).json({ cid: '904b7c42-7b4b-4637-aa38-e96a55ff4288', email: 'peter.drahovsky@bavenir.eu' })
                }

                if (!auth) {
                        logger.error('Missing basic auth')
                        return res.status(401).json({
                                error: 'invalid_request',
                                error_description: 'Missing basic auth'
                        })
                }
                // compare username and password
                const [username, password] = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':')
                if (username !== process.env.DLT_INTROSPECTION_USER || password !== process.env.DLT_INTROSPECTION_PASSWORD) {
                        logger.error('Invalid basic auth')
                        return res.status(401).json({
                                error: 'invalid_request',
                                error_description: 'Invalid basic auth'
                        })
                }

                if (!token) {
                        logger.error('Missing token for introspection')
                        return res.status(400).json({
                                error: 'invalid_request',
                                error_description: 'Missing token for introspection'
                        })
                }
        
                const decoded = await AuroralToken.verify(token)
                if (await tokenBlacklist.checkInBlacklist(decoded.sub, token)) {
                        logger.error('Token is blacklisted or inactive')
                        return res.status(401).json({
                                error: 'invalid_request',
                                error_description: 'Token is blacklisted or inactive'
                        })  
                }
                // DLT scope test
                if (!decoded.purpose.includes('DLT_READWRITE') && !decoded.purpose.includes('DLT_READ')) {
                        logger.error('Token does not have DLT scope')
                        return res.status(401).json({
                                error: 'invalid_request',
                                error_description: 'Token does not have DLT scope'
                        })
                }
                return res.status(200).json({
                        active: true,
                        iss: decoded.iss,
                        iat: decoded.iat,
                        sub: decoded.sub,
                        typ: 'Bearer',
                        scope: decoded.purpose.replace(/,/g, ' '), // Replace commas by spaces to be compliant
                        client_id: 'auroral-nm',
                        username: decoded.email,
                        exp: decoded.exp
                })
        } catch (err) {
                const error = errorHandler(err)
                logger.error(error.message)
                return res.status(401).json({
                        error: 'invalid_request',
                        error_description: 'Error validating token: ' + error.message
                })       
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
                const decoded = await MailToken.verify(token)
                const username = decoded.sub
                // Validate if secret in token has not expired
                await checkTempSecret(username, decoded.secret)
                if (!decoded.purpose.includes('pwdrecovery')) {
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
                const original = await AuroralToken.verify(myRefreshToken)
                if (original.purpose.includes('refresh') && original.sub === decoded.sub) {
                        if (decoded.origin === AuroralUserType.UI) {
                                // UI refresh
                                const tokens = await signAppToken(decoded.sub, AuroralUserType.UI, res.locals.origin.originIp, decoded.iat)
                                return responseBuilder(HttpStatusCode.OK, res, null, tokens)
                        } else if (decoded.origin === AuroralUserType.NODE) {
                                // Node refresh
                                const tokens = await signAppToken(decoded.sub, AuroralUserType.NODE, '', decoded.iat)
                                return responseBuilder(HttpStatusCode.OK, res, null, tokens)
                        } else {
                                logger.warn('Invalid token origin')
                                return responseBuilder(HttpStatusCode.FORBIDDEN, res, 'Invalid token origin')
                        }
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
                const original = await MailToken.verify(token)
                // Check if secret is valid (throws error if not )
                await checkTempSecret(original.sub, original.secret)
                logger.debug('Passwordless login validated')
                // generate app token
                const tokens = await signAppToken(original.sub, AuroralUserType.UI, res.locals.origin.originIp)
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
                const sessionId = (await SessionModel._createSession({ uid: decoded.sub, secretHash, originIp: res.locals.origin.originIp })).sessionId
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
                const token = await signAppToken(username, AuroralUserType.UI, res.locals.origin.originIp)

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
                tokenBlacklist.addToBlacklist(decoded.sub, res.locals.token)
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
                logger.debug('Logging out: ' + decoded.sub)
                await tokenBlacklist.addToBlacklist(decoded.sub, res.locals.token)
                const myUser = await UserModel._getUser(decoded.sub)
                // Logout audit
                await AuditModel._createAudit({
                        ...res.locals.audit,
                        cid: myUser.cid,
                        actor: { id: decoded.sub, name: myUser.name },
                        target: { id: decoded.sub, name: myUser.name }, 
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
