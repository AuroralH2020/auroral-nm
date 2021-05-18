import * as jwt from 'jsonwebtoken'
import fs from 'fs'
import { Config } from '../config'
import { RolesEnum } from '../types/roles'

// NOTE:
// Keys are generated using online key generator, they are RSA 256 keys.
// We should probably recreate keys before going to production.
const publicKey = fs.readFileSync(`${Config.HOME_PATH}/keys/public-key.pem`)

const defaultJwtOptions: jwt.SignOptions = {
    // issuer: Config.APP_ISS,
    // audience: Config.APP_AUD,
    algorithm: 'RS256',
    // expiresIn: '1d',
}

// export const Auth = {
//     verify: (rawToken: string) => {
//         try {
//             const options: jwt.SignOptions = defaultJwtOptions
//             const tok = jwt.verify(rawToken, publicKey, options) as KeycloakTokenResponse
//             return {
//                 realm: tok.iss,
//                 client: tok.azp,
//                 roles: tok.resource_access['vicinity-api'].roles,
//                 verified: tok.email_verified,
//                 username: tok.preferred_username,
//                 firstName: tok.given_name,
//                 lastName: tok.family_name,
//                 email: tok.email
//             } as DecodedJwtToken
//         } catch (err) {
//             console.log('Problem extracting roles from token')
//             throw err
//         }
//     },
//     protect: (decoded: DecodedJwtToken, roles: RolesEnum[]) => {
//         let matches = []
//         matches = roles.filter(i => {
//                                 return decoded.roles.includes(i) 
//                             })
//         if (matches.length === 0) {
//             throw new Error('Missing proper roles')
//         }
//     }
// }

