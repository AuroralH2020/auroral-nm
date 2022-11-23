import { Controller } from '../../types/express-types'
import { ILocals, ILocalsGtw } from '../../types/locals-types'
import { SourceType } from '../../types/misc-types'

type auditController = Controller<{}, {}, {}, null, ILocals | ILocalsGtw>

export const createAudit = (_source: SourceType) => {
    return function (_req, res, next) {
        const { decoded } = res.locals
        if (decoded) {
            res.locals.audit = {
                cid: decoded.org,
                labels: { ip: res.locals.origin?.originIp, origin: res.locals.origin?.interface, source: _source },
                reqId: res.locals.reqId
            }
        } else {
            res.locals.audit = {
                cid: 'N/A',
                labels: { ip: res.locals.origin?.originIp, origin: res.locals.origin?.interface, source: _source },
                reqId: res.locals.reqId
            }
        }
        next()
    } as auditController
}
