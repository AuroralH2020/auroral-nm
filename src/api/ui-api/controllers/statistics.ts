// Controller common imports
import { expressTypes, localsTypes } from '../../../types/index'
import { HttpStatusCode } from '../../../utils/http-status-codes'
import { logger } from '../../../utils/logger'
import { responseBuilder } from '../../../utils/response-builder'
import { errorHandler, MyError } from '../../../utils/error-handler'

// Controller specific imports
import { AuditModel } from '../../../persistance/audit/model'
import { IStatistics } from '../../../persistance/statistics/types'
import { StatisticsService } from '../../../core'

// Controllers

type getStatisticsController = expressTypes.Controller<{ date: string}, {}, {}, IStatistics, localsTypes.ILocals>
 
export const getStatistics: getStatisticsController = async (req, res) => {
    const { date } = req.params
	try {
		// no date specified
		if (date === undefined) {
			const statistics = await StatisticsService.getLastStatistics()
			return responseBuilder(HttpStatusCode.OK, res, null, statistics)
		} 
		// test date parse
		const parsedDate = new Date(date).setHours(0,0,0,0)
		if (Number.isNaN(parsedDate)) {
			throw new MyError('Please format \'date\' using format \'YYYY-DD-MM\'')
		}
		// get by date
		const statistics = await StatisticsService.getStatistics(parsedDate)

		return responseBuilder(HttpStatusCode.OK, res, null, statistics)
	} catch (err) {
		const error = errorHandler(err)
		logger.error(error.message)
		return responseBuilder(error.status, res, error.message)
	}
}

type storeStatisticsController = expressTypes.Controller<{}, {}, {}, null, localsTypes.ILocals>
 
export const storeStatistics: storeStatisticsController = async (req, res) => {
	try {
		const statistics = await StatisticsService.storeStatistics()
		return responseBuilder(HttpStatusCode.OK, res, null, null)
	} catch (err) {
		const error = errorHandler(err)
		logger.error(error.message)
		return responseBuilder(error.status, res, error.message)
	}
}
