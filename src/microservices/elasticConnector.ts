import { Client } from '@elastic/elasticsearch'
import { logger } from '../utils'
import {  MyError } from '../utils/error-handler'
import { IRecordAgg } from '../persistance/record/types'
import { Config } from '../config'

// CONSTANTS 
const counterIndex = 'mongodb-records-aggregated'
const elkClient = new Client({ 
        node: Config.ELK.URL,
        auth: {
            apiKey: Config.ELK.TOKEN,
        }
    })

// FUNCTIONS

export const elastic = {
    publishCounterRecords: async (updateBody: IRecordAgg[]): Promise<void> => {
        if (updateBody.length < 1) {
            logger.info('No records sent')
            return
        }
        logger.info('Sending:' + updateBody?.length + ' documents to elastic')
        const body = (updateBody as any).flatMap((doc: any) => [{ index: { _index: counterIndex } }, doc])
        const { body: bulkResponse } = await elkClient.bulk({ refresh: true, body })
        // refresh index
        await elkClient.indices.refresh({ index: counterIndex })
        
        if (bulkResponse.errors) {
            console.log(bulkResponse.errors)
            throw new MyError('Error from elasticSearch. Some mesages were not sent')
        } else {
          logger.info('Sent')
        }
    }
}
// PRIVATE FUNCTIONS

