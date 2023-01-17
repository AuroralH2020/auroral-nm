/**
Gateway token validation middleware
Using JWT and asynchronous key encryption
Used as gateway authentication method
*/
import * as jwt from 'jsonwebtoken'
import { JWTGatewayToken } from '../../types/jwt-types'
import { NodeToken } from '../../core/jwt-wrapper'
import { NodeModel } from '../../persistance/node/model'
import { Controller } from '../../types/express-types'
import { ILocalsGtw } from '../../types/locals-types'
import { logger } from '../../utils/logger'
import { HttpStatusCode, responseBuilder } from '../../utils'

// Private functions

// Validate origin and ownership of the message

type gtwToken = {
    iss: string,
    aud: string
}

// Extract agid info from the original token
function getInfo(x: string) {
  const i = x.indexOf('.')
  const j = x.lastIndexOf('.')
  let info: Buffer | string = x.substring(i, j)
  info = Buffer.from(info, 'base64')
  info = info.toString()
  return JSON.parse(info) as JWTGatewayToken
}

// Public function

type JwtGtwController = Controller<{}, {}, {}, void, ILocalsGtw>

export const guard = () => {
  return function (req, res, next) {
    const auth = req.headers.authorization || req.headers['X-ACCESS-TOKEN'] as string
    if (auth && auth.startsWith('Bearer ')) {
        const token = auth.slice(7, auth.length)
        const info = getInfo(token)
        const agid = info.iss ? info.iss : info.sub // LEGACY purposes: ISS should be replaced by SUB and then used to identify origin
        NodeModel._getKey(agid).then(
          (publicKey) => {
              return NodeToken.verify(token, publicKey)
            }
          ).then(
            (decoded) => {
                res.locals.decoded = { ...decoded, agid: info.iss ? info.iss : info.sub }
                res.locals.token = token
                NodeModel._getNode(agid).then((node) => {
                  res.locals.decoded!.cid = node.cid
                  next()
                })
            }).catch(
            (err) => {
                logger.error('JWT Validation error from ' + req.ip + ' req url: ' + req.originalUrl + ' ' + JSON.stringify(err))
                logger.debug(token)
                next()
              }
            )
    } else {
      res.locals.decoded = null
      res.locals.token = 'NA'
      next()
    } 
  } as JwtGtwController
}
