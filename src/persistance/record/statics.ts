import { IRecordDocument, IRecordModel, IRecordCreatePost, IRecordAgg } from './types'

export async function createRecord(
    this: IRecordModel, data: IRecordCreatePost
  ): Promise<IRecordDocument> {
    return this.create(data)
}
 // aggregate records older than given timestamp
export async function getAggregated(
  this: IRecordModel, timestamp: number
): Promise<IRecordAgg[]> {
  const records = await this.aggregate([[
    {
      '$match': {
        'isProcessed': false, 
        'reqInitiator': true,
        'timestamp': { '$lt': timestamp }
      }
    }, { '$group': {
        '_id': {
          'oid': '$sourceOid', 
          'year': {
            '$year': {
              '$toDate': '$timestamp'
            }
          }, 
          'month': {
            '$month': {
              '$toDate': '$timestamp'
            }
          }, 
          'day': {
            '$dayOfMonth': {
              '$toDate': '$timestamp'
            }
          }
        }, 
        'date': {
          '$first': '$timestamp'
        }, 
        'totalMessagesSize': {
          '$sum': '$messageSize'
        }, 
        'action': {
          '$sum': {
            '$cond': [
              {
                '$eq': [
                  '$requestType', 'action'
                ]
              }, 1, 0
            ]
          }
        }, 
        'property': {
          '$sum': {
            '$cond': [
              {
                '$eq': [
                  '$requestType', 'property'
                ]
              }, 1, 0
            ]
          }
        }, 
        'event': {
          '$sum': {
            '$cond': [
              {
                '$eq': [
                  '$requestType', 'event'
                ]
              }, 1, 0
            ]
          }
        }, 
        'info': {
          '$sum': {
            '$cond': [
              {
                '$eq': [
                  '$requestType', 'info'
                ]
              }, 1, 0
            ]
          }
        }, 
        'unknown': {
          '$sum': {
            '$cond': [
              {
                '$eq': [
                  '$requestType', 'unknown'
                ]
              }, 1, 0
            ]
          }
        }, 
        'agid': {
          '$first': '$agid'
        }, 
        'cid': {
          '$first': '$cid'
        }
      }
    }, {
      '$project': {
        '_id': 0, 
        'date': { $dateToString: { format: '%Y-%m-%d', date: { '$toDate': '$date' } } }, 
        'oid': '$_id.oid', 
        'action': 1, 
        'event': 1, 
        'info': 1, 
        'unknown': 1, 
        'property': 1, 
        'agid': 1, 
        'cid': 1, 
        'totalMessagesSize': 1
      }
    }
  ]]).exec()
  if (records) {
    return records as IRecordAgg[]
  } else {
    throw new Error('Record not found')
  }
}

 // mark records older than given timestamp as processed
export async function aggregationCompleted(
  this: IRecordModel, timestamp: number): Promise<void> {
  const record = await this.updateMany({
    'isProcessed': false, 
    'reqInitiator': true,
    'timestamp': { '$lt': timestamp }
  }, { isProcessed: true }
    ).exec()
  if (!record.ok) {
    throw new Error('Error removing org from contract')
  }
}
