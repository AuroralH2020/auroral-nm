import crypto from 'bcrypt'
import path from 'path'
import fs from 'fs'
import jwt from 'jsonwebtoken'
import { AccountModel } from '../persistance/account/model'
import { Config } from '../config'
import { logger } from '../utils/logger'
import { jwtTypes } from '../types/index'
import { MyError } from '../utils/error-handler'
import { HttpStatusCode } from '../utils'

// Algorithms
enum Algorithms {
    SYNC = 'HS512',
    ASYNC = 'RS256'
}

// Secrets and keys
let secret_key: string | null = null
let priv_cert: Buffer | null = null
let pub_cert: Buffer | null = null

if (Config.NODE_ENV === 'development') {
    logger.debug('Using development authorization server')
    secret_key = Config.SECRET_TOKEN
} else {
    // Load keys
    try {
        priv_cert = fs.readFileSync(path.join(Config.HOME_PATH, '/keys/private-key.pem'))
        pub_cert = fs.readFileSync(path.join(Config.HOME_PATH, '/keys/public-key.pem'))
    } catch (err) {
        logger.error('Auth server Production mode not ready, please set up the certificate and keys')
        process.exit(0)
    }
}

// Token types
const validTokenTypes = ['validate', 'validatepwd', 'pwdrecovery', 'passwordless']

export const hashPassword = async (password: string) => {
    const saltRounds = 10
    const salt = await crypto.genSalt(saltRounds)
    return crypto.hash(password, salt)
}

export const comparePassword = async (username: string, password: string): Promise<boolean> => {
    const hash = await AccountModel._getHash(username)
    const isValid = await crypto.compare(password, hash)
    if (!isValid) {
        throw new MyError('Wrong password', HttpStatusCode.BAD_REQUEST)
    }
    return true
}

export const signMailToken = async (username: string, purpose: string, idInLink?: string): Promise<string> => {
    if (validTokenTypes.lastIndexOf(purpose) === -1) {
        throw new Error('Invalid token type')
    }
    let secret: string | Buffer
    let algorithm: jwt.Algorithm
    if (secret_key) {
        secret = secret_key
        algorithm = Algorithms.SYNC
    } else {
        secret = priv_cert!
        algorithm = Algorithms.ASYNC
    }
    const secretDoc = await AccountModel._getDoc(username)
    const accountSecret = await secretDoc._updateTempSecret()
    return new Promise((resolve, reject) => {
        jwt.sign(
        {
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24),
            iss: idInLink ? idInLink : username,
            aud: purpose,
            sub: accountSecret
        }, 
        secret,
        { algorithm },
        (err: Error | null, token?: string) => {
            if (err) {
                reject(err) 
            } else if (token) {
                resolve(token)
            } else {
                reject(new Error('Token was not created'))
            }
        })
    })
}

export const signAppToken = async (username: string): Promise<string> => {
    const user = await AccountModel._getAccount(username)
    let secret: string | Buffer
    let algorithm: jwt.Algorithm
    if (secret_key) {
        secret = secret_key
        algorithm = Algorithms.SYNC
    } else {
        secret = priv_cert!
        algorithm = Algorithms.ASYNC
    }
    return new Promise((resolve, reject) => {
        jwt.sign(
            {
                iss: username,
                org: user.cid,
                uid: user.uid,
                roles: user.roles.toString(),
                exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24),
                // iss: 'vicinityManager',
                // sub: username,
                // exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24),
                // roles: user.roles.toString(),
                // uid: userAccountId,
                // orgid: companyAccountId,
                // cid: user.cid
            },
            secret,
            { algorithm },
            (err: Error | null, token?: string) => {
                if (err) {
                    reject(err)
                } else if (token) {
                    resolve(token)
                } else {
                    reject(new Error('Token was not created'))
                }
            })
    })
}

export const verifyToken = async (token: string): Promise<jwtTypes.JWTDecodedToken> => {
    let secret: string | Buffer
    let algorithm: jwt.Algorithm
    if (secret_key) {
        secret = secret_key
        algorithm = Algorithms.SYNC
    } else {
        secret = pub_cert!
        algorithm = Algorithms.ASYNC
    }
    return new Promise((resolve, reject) => {
        jwt.verify(token, secret, { algorithms: [algorithm] }, (err, decoded) => {
            if (err) {
                // let myError
                // if (err.name === 'TokenExpiredError') {
                //     logger.error('Token expired at: ' + err.expiredAt)
                //     myError = new customError.UnauthorizedError(err.message, customError.types.INVALID_TOKEN_EXPIRED)
                // } else if (err.name === 'JsonWebTokenError') {
                //     myError = new customError.UnauthorizedError(err.message, customError.types.INVALID_TOKEN_MALFORMED) 
                // } else {
                //     logger.error(err.message)
                //     myError = new customError.ServerError(err.message, customError.types.GENERIC_ERROR)
                // }
                logger.error(err)
                reject(err)
            } else {
                resolve(decoded as jwtTypes.JWTDecodedToken)
            }
        })
    })
}

/**
 * Validate the token secret against the users temp secret stored in dB
 * Purpose of the secret is to keep valid only last mailToken sent
 * @param {string} username 
 * @param {string} secret 
 */
export const checkTempSecret = async (username: string, secret: string): Promise<boolean> => {
    const record = await AccountModel._getDoc(username)
    if (record.tempSecret !== secret) {
        throw new Error('Token has expired')
    }
    await record._updateTempSecret()
    return true
}
