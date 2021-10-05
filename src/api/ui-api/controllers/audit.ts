// Controller common imports
import { expressTypes, localsTypes } from '../../../types/index'
import { HttpStatusCode } from '../../../utils/http-status-codes'
import { logger } from '../../../utils/logger'
import { responseBuilder } from '../../../utils/response-builder'
import { errorHandler } from '../../../utils/error-handler'

// Controller specific imports
import { AuditModel } from '../../../persistance/audit/model'
import { IAudit } from '../../../persistance/audit/types'

// Controllers

type getAuditController = expressTypes.Controller<{ id: string }, {}, { days: number }, IAudit[], localsTypes.ILocals>
 
export const getNotifications: getAuditController = async (req, res) => {
    const { id } = req.params
    const { days } = req.query
	const { decoded } = res.locals
	try {
		const cid = decoded.org
		const data = await AuditModel._getAudits(cid, id, days)
		return responseBuilder(HttpStatusCode.OK, res, null, data)
	} catch (err) {
		const error = errorHandler(err)
		logger.error(error.message)
		return responseBuilder(error.status, res, error.message)
	}
}

