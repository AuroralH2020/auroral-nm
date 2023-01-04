// Controller common imports
import { expressTypes, localsTypes } from '../../../types/index'
import { HttpStatusCode } from '../../../utils/http-status-codes'
import { logger } from '../../../utils/logger'
import { responseBuilder } from '../../../utils/response-builder'
import { errorHandler, MyError } from '../../../utils/error-handler'

// Controller specific imports
import { IStatistics } from '../../../persistance/statistics/types'
import { StatisticsService } from '../../../core'
import { RecordModel } from '../../../persistance/record/model'
import { elastic } from '../../../microservices/elasticConnector'

// Controllers

type getStatisticsController = expressTypes.Controller<{ date: string}, {}, {}, IStatistics, localsTypes.ILocals>
 
export const getStatistics: getStatisticsController = async (req, res) => {
    const { date } = req.params
	try {
		// no date specified
		if (date === undefined) {
			return responseBuilder(HttpStatusCode.OK, res, null, await StatisticsService.getLastStatistics())
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
 
export const storeStatistics: storeStatisticsController = async (_req, res) => {
	try {
		await StatisticsService.storeStatistics()
		return responseBuilder(HttpStatusCode.OK, res, null, null)
	} catch (err) {
		const error = errorHandler(err)
		logger.error(error.message)
		return responseBuilder(error.status, res, error.message)
	}
}

// records

type sendRecordsController = expressTypes.Controller<{}, {}, {}, null, localsTypes.ILocals>
 
export const sendRecords: sendRecordsController = async (_req, res) => {
	try {
		try {
			const todayTimestamp = new Date().setHours(0,0,0,0)
			const aggregated = await RecordModel._getAggregated(todayTimestamp)
			await elastic.publishCounterRecords(aggregated)
			await RecordModel._aggregationCompleted(todayTimestamp)
		} catch (err) {
			const error = errorHandler(err)
			logger.error('Could not sent aggregated data to elastic')
			logger.error(error.message)
		}
		return responseBuilder(HttpStatusCode.OK, res, null, null)
	} catch (err) {
		const error = errorHandler(err)
		logger.error(error.message)
		return responseBuilder(error.status, res, error.message)
	}
}

// healthcheck

type healthcheckController = expressTypes.Controller<{}, {}, {}, { status: number }, localsTypes.ILocals>

export const healthcheck: healthcheckController = async (_req, res) => {
	try {
		// TBD: add check MongoDB, redis, ...
		return responseBuilder(HttpStatusCode.OK, res, null, { status: HttpStatusCode.OK })
	} catch (err)  {
		const error = errorHandler(err)
		logger.error(error.message)
		return responseBuilder(error.status, res, error.message)
	}
}

