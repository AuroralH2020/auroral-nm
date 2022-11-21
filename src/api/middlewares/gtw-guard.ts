/**
Gateway token validation middleware
Using JWT and asynchronous key encryption
Used as gateway authentication method
*/
import * as jwt from 'jsonwebtoken'
import { JWTDecodedToken } from '../../types/jwt-types'
import { NodeModel } from '../../persistance/node/model'
import { Controller } from '../../types/express-types'
import { ILocalsGtw } from '../../types/locals-types'
import { logger } from '../../utils/logger'

// Private functions

// Validate origin and ownership of the message

type gtwToken = {
    iss: string,
    aud: string
}

function validate(token: string, pubkey: string | null) {
  return new Promise((resolve, reject) => {
    if (!pubkey) {
      throw new Error('Missing public key for node')
    }
    jwt.verify(token, pubkey, { audience: 'NM' }, (err, decoded) => {
        if (err) {
            reject(err)
        }
      resolve(decoded)
    })
  })
}

// Extract agid info from the original token
function getInfo(x: string) {
  const i = x.indexOf('.')
  const j = x.lastIndexOf('.')
  let info: Buffer | string = x.substring(i, j)
  info = Buffer.from(info, 'base64')
  info = info.toString()
  return JSON.parse(info) as JWTDecodedToken
}

// Public function

type JwtController = Controller<{}, {}, {}, void, ILocalsGtw>

export const guard = () => {
  return function (req, res, next) {
    const auth = req.headers.authorization || req.headers['X-ACCESS-TOKEN'] as string
    if (auth && auth.startsWith('Bearer ')) {
        const token = auth.slice(7, auth.length)
        const info = getInfo(token)
        NodeModel._getKey(info.iss).then(
          (publicKey) => {
              return validate(token, publicKey) as Promise<JWTDecodedToken>
            }
          ).then(
            (decoded) => {
                res.locals.decoded = decoded
                res.locals.token = token
                next()
            }
          ).catch(
            (err) => {
                logger.error(`JWT Validation error: ${err.text}`)
                next()
              }
            )
    } else {
      res.locals.decoded = null
      res.locals.token = null
      next()
    } 
  } as JwtController
}
