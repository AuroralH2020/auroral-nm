import fs from 'fs'
import path from 'path'
import { verifyToken, decodeToken } from '../auth-server/auth-server'
import { RolesEnum } from '../types/roles'
import { JWTDecodedToken } from '../types/jwt-types'
import { MyError } from './error-handler'
import { HttpStatusCode } from './http-status-codes'

export const Auth = {
    verify: async (rawToken: string, ip: string) => {
        return verifyToken(rawToken) as Promise<JWTDecodedToken>
    },
    decode: (rawToken: string) => {
        return decodeToken(rawToken) 
    },
    protect: (decoded: JWTDecodedToken, roles: RolesEnum[]) => {
        let matches = []
        matches = roles.filter(i => {
                                return decoded.roles.includes(i) 
                            })
        if (matches.length === 0) {
            throw new MyError('Missing proper roles', HttpStatusCode.FORBIDDEN)
        }
    }
}

