import crypto from 'bcrypt'
import nodejsCrypto from 'crypto'
import path from 'path'
import fs from 'fs'
import jwt from 'jsonwebtoken'
import { AccountModel } from '../persistance/account/model'
import { Config } from '../config'
import { logger } from '../utils/logger'
import { jwtTypes } from '../types/index'
import { errorHandler, MyError } from '../utils/error-handler'
import { HttpStatusCode } from '../utils'
import { setSession } from '../core/sessions'
import { JsonType } from '../types/misc-types'

// Algorithms
enum Algorithms {
    SYNC = 'HS512',
    ASYNC = 'RS256',
    HASH = 'sha256'
}

// Secrets and keys
let secret_key: string | null = null
let priv_cert: Buffer | null = null
let pub_cert: Buffer | null = null

if (Config.NODE_ENV === 'test') {
    secret_key = 'mytestssecret'
} else if (Config.NODE_ENV === 'development') {
    logger.debug('Using development authorization server')
    secret_key = Config.SECRET_TOKEN
} else {
    // Load keys
    try {
        console.log(path.join(Config.HOME_PATH, '/keys/private-key.pem'))
        priv_cert = fs.readFileSync(path.join(Config.HOME_PATH, '/keys/private-key.pem'))
        pub_cert = fs.readFileSync(path.join(Config.HOME_PATH, '/keys/public-key.pem'))
    } catch (err) {
        console.log(err)
        logger.error('Auth server Production mode not ready, please set up the certificate and keys')
        process.exit(0)
    }
}

// Token types
const validTokenTypes = ['authentication', 'refresh', 'validate', 'validatepwd', 'pwdrecovery', 'passwordless']

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

export async function signMessage(message: string): Promise<string> {
    try {
        logger.debug('Signing message...')
        return nodejsCrypto.sign(Algorithms.HASH, Buffer.from(message), {
            key: priv_cert!.toString(),
            padding: nodejsCrypto.constants.RSA_PKCS1_PSS_PADDING,
          }).toString('base64')
    } catch (err) {
        const error = errorHandler(err)
        logger.error('Failed to sign...', HttpStatusCode.BAD_REQUEST)
        throw new MyError(error.message)
    }
}

export function getMyPubkey(): string {
    return pub_cert!.toString()
}

export const signMailToken = async (username: string, purpose: string, idInLink?: string): Promise<string> => {
    if (validTokenTypes.lastIndexOf(purpose) === -1) {
        throw new Error('Invalid token type')
    }
    const { secret, algorithm } = getSecretAndAlg()
    const secretDoc = await AccountModel._getDoc(username)
    const accountSecret = await secretDoc._updateTempSecret()
    return signToken(
        {
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24),
            iss: idInLink ? idInLink : username,
            aud: purpose,
            sub: accountSecret
        },
        secret,
        algorithm  
    )
}

export const signAppToken = async (username: string, ip: string, started_at?: number): Promise<{ token: string, refreshToken: string}> => {
    const user = await AccountModel._getAccount(username)
    const { secret, algorithm } = getSecretAndAlg()
    const exp = Math.floor(Date.now() / 1000) + Config.SESSIONS.DURATION
    const iat = started_at ? started_at : Math.floor(Date.now() / 1000) // Session initiated at
    const sessionValue = user.uid + ':' + username + ':' + iat + ':' + ip
    await setSession(user.uid, sessionValue)
    const token = await signToken(
        {
            iss: username,
            org: user.cid,
            uid: user.uid,
            aud: validTokenTypes[0],
            roles: user.roles.toString(),
            iat,
            exp
        },
        secret,
        algorithm  
    )
    const refreshToken = await signToken(
        {
            iss: username,
            org: user.cid,
            uid: user.uid,
            aud: validTokenTypes[1],
            roles: user.roles.toString(),
            exp
        },
        secret,
        algorithm  
    )
    return { token, refreshToken }
}

export const verifyToken = async (token: string): Promise<jwtTypes.JWTDecodedToken> => {
    const { secret, algorithm } = getSecretAndAlg()
    return new Promise((resolve, _reject) => {
        jwt.verify(token, secret, { algorithms: [algorithm] }, (err, decoded) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    throw new MyError(err.message, HttpStatusCode.UNAUTHORIZED)
                } else if (err.name === 'JsonWebTokenError') {
                    throw new MyError(err.message, HttpStatusCode.UNAUTHORIZED)
                } else {
                    logger.error(err.message)
                    throw new MyError(err.message, HttpStatusCode.INTERNAL_SERVER_ERROR)
                }
            } else {                
                resolve(decoded as jwtTypes.JWTDecodedToken)
            }
        })
    })
}

// Just decode, no key or expiration checks
export const decodeToken = (token: string) => {
    return jwt.decode(token)
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
        throw new MyError('Token has expired', HttpStatusCode.UNAUTHORIZED)
    }
    await record._updateTempSecret()
    return true
}

/**
 * Generate secret 
 */
 export const generateSecret =  (): string => {
    return nodejsCrypto.randomBytes(16).toString('base64')
}

/**
 * Validate the secret with hashed secret
 * Purpose of the secret is to keep valid only last mailToken sent
 * @param {string} secret 
 * @param {string} secretHash
 */
export const verifyHash = async (secret: string, secretHash: string): Promise<boolean> => {
    const isValid = await crypto.compare(secret, secretHash)
    if (!isValid) {
       return false
    }
    return true
}

// Private

const getSecretAndAlg = (): { secret: string | Buffer, algorithm: jwt.Algorithm} => {
    let secret: string | Buffer
    let algorithm: jwt.Algorithm
    if (secret_key) {
        secret = secret_key
        algorithm = Algorithms.SYNC
    } else {
        secret = priv_cert!
        algorithm = Algorithms.ASYNC
    }
    return { secret, algorithm }
}

const signToken = async (payload: JsonType, secret: string | Buffer, algorithm: jwt.Algorithm): Promise<string> => {
    return new Promise((resolve, reject) => {
        jwt.sign(
            payload,
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
