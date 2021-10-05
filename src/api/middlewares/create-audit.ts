import { v4 as uuidv4 } from 'uuid'
import { Controller } from '../../types/express-types'
import { ILocals, Interfaces } from '../../types/locals-types'
import { SourceType } from '../../types/misc-types'

type auditController = Controller<{}, {}, {}, null, ILocals>

export const createAudit = (_type: Interfaces, _source: SourceType) => {
    return function (req, res, next) {
        const { decoded } = res.locals
        console.log(decoded)
        if (decoded) {
            res.locals.audit = {
                cid: res.locals.decoded.org,
                labels: { ip: res.locals.origin?.originIp, origin: _type, source: _source },
                reqId: res.locals.reqId
            }
        } else {
            res.locals.audit = {
                cid: ' ',
                labels: { ip: res.locals.origin?.originIp, origin: _type, source: _source },
                reqId: res.locals.reqId
            }
        }
        next()
    } as auditController
}
