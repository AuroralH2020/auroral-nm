import { CronJob } from 'cron'
import { logger } from '../utils'
import { errorHandler } from '../utils/error-handler'
import { Config } from '../config'
import { elastic } from '../microservices/elasticConnector'
import { RecordModel } from '../persistance/record/model'
import { StatisticsService } from '../core'

// Create jobs 
const elasticJob = new CronJob('0 5 1 * * *', (async () => { 
     // Running day 01:05
    logger.info('Running scheduled task: Sending aggregations to elastic')
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
}), null, true)

const statisticsJob = new CronJob('0 0 1 * * *', (async () => { 
    // Running day 01:05
   logger.info('Running scheduled task: Creating day statistics')
   try {
       await StatisticsService.storeStatistics()
   } catch (err) {
       const error = errorHandler(err)
       logger.error('Could not store statistics data')
       logger.error(error.message)
   }
}), null, true)

// Export scheduler
export const scheduledJobs = {
    start: () => {
        elasticJob.start()
        statisticsJob.start()
    },
    stop: () => {
        elasticJob.stop()
        statisticsJob.stop()
    }
}
