/**
 * JWT services wrapper
 * Generates specific calls for the different AURORAL agents
 * User AURORAL Auth Server
 */

import { verifyToken, decodeToken } from '../auth-server/auth-server'
import { RolesEnum } from '../types/roles'
import { JWTAURORALToken, JWTGatewayToken, JWTMailToken } from '../types/jwt-types'
import { MyError } from '../utils/error-handler'
import { HttpStatusCode } from '../utils/http-status-codes'

export const AuroralToken = {
    verify: async (rawToken: string): Promise<JWTAURORALToken> => {
        return verifyToken(rawToken) as unknown as Promise<JWTAURORALToken> 
    },
    decode: (rawToken: string): JWTAURORALToken => {
        return decodeToken(rawToken) as unknown as JWTAURORALToken
    },
    protect: (decoded: JWTAURORALToken, roles: RolesEnum[]) => {
        let matches = []
        matches = roles.filter(i => {
                                return decoded.roles.includes(i) 
                            })
        if (matches.length === 0) {
            throw new MyError('Missing proper roles', HttpStatusCode.FORBIDDEN)
        }
    }
}

export const NodeToken = {
    verify: (token: string, pubkey: string | null): Promise<JWTGatewayToken> => {
          if (!pubkey) {
            throw new Error('Missing public key for node')
          }
          return verifyToken(token, pubkey) as unknown as Promise<JWTGatewayToken> 
      },
    decode: (rawToken: string): Promise<JWTGatewayToken> => {
        return decodeToken(rawToken) as unknown as Promise<JWTGatewayToken> 
    }
}

export const MailToken = {
    verify: (token: string): Promise<JWTMailToken> => {
          return verifyToken(token) as unknown as Promise<JWTMailToken> 
      },
    decode: (rawToken: string): Promise<JWTMailToken> => {
        return decodeToken(rawToken) as unknown as Promise<JWTMailToken> 
    }
}
