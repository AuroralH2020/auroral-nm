import { v4 as uuidv4 } from 'uuid'
import { Controller } from '../../types/express-types'
import { ILocals, Interfaces } from '../../types/locals-types'
import { SourceType } from '../../types/misc-types'

type auditController = Controller<{}, {}, {}, null, ILocals>

export const createAudit = (_type: Interfaces, _source: SourceType) => {
    return function (req, res, next) {
        res.locals.audit = {
            cid: res.locals.decoded.org,
            labels: { ip: res.locals.origin?.originIp, origin: _type, source: _source },
            reqId: uuidv4()
        }
        next()
    } as auditController
}
