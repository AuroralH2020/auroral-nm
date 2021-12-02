import * as jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'
import { Config } from '../config'
import { logger } from './logger'
import { RolesEnum } from '../types/roles'
import { JWTDecodedToken } from '../types/jwt-types'
import { MyError } from './error-handler'
import { HttpStatusCode } from './http-status-codes'

// Algorithms
enum Algorithms {
    SYNC = 'HS512',
    ASYNC = 'RS256'
}

// Secrets and keys
let secret: string | Buffer | null = null
let algorithm: Algorithms

if (Config.NODE_ENV === 'development') {
    logger.debug('Using development jwt verifier')
    secret = Config.SECRET_TOKEN
    algorithm = Algorithms.SYNC
} else {
    // Load keys
    try {
        secret = fs.readFileSync(path.join(Config.HOME_PATH, '/keys/public-key.pem'))
        algorithm = Algorithms.ASYNC
    } catch (err) {
        logger.error('Auth server Production mode not ready, please set up the certificate and keys')
        process.exit(0)
    }
}

const defaultJwtOptions: jwt.SignOptions = {
    // issuer: Config.APP_ISS,
    // audience: Config.APP_AUD,
    algorithm,
    // expiresIn: '1d',
}

export const Auth = {
    verify: (rawToken: string, ip: string) => {
        try {
            const options: jwt.SignOptions = defaultJwtOptions
            return jwt.verify(rawToken, secret!, options) as JWTDecodedToken
        } catch (err) {
            logger.debug('Problem extracting roles from token: ' + ip)
            throw err
        }
    },
    protect: (decoded: JWTDecodedToken, roles: RolesEnum[]) => {
        let matches = []
        matches = roles.filter(i => {
                                return decoded.roles.includes(i) 
                            })
        if (matches.length === 0) {
            throw new MyError('Missing proper roles', HttpStatusCode.UNAUTHORIZED)
        }
    }
}

