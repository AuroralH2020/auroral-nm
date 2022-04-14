import { Controller } from '../../types/express-types'
import { responseBuilder } from '../../utils'
import { ILocals } from '../../types/locals-types'
import { HttpStatusCode } from '../../utils/http-status-codes'

type acController = Controller<{}, {}, {}, null, ILocals>

export const accessControl = () => {
    return function(req, res, next) {
        res.header('Access-Controll-Allow-Origin', '*')
        res.header('Access-Controll-Allow-Headers',
          'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Access-Token')
        if (req.method === 'OPTIONS') {
          res.header('Access-Controll-Allow-Methods', 'POST, GET')
          return responseBuilder(HttpStatusCode.OK, res, null, {})
        }
        next()
    } as acController
}
