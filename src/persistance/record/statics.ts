import { IRecordDocument, IRecordModel, IRecordCreatePost, IRecordAgg } from './types'

export async function createRecord(
    this: IRecordModel, data: IRecordCreatePost
  ): Promise<IRecordDocument> {
    return this.create(data)
}

export async function getAggregated(
  this: IRecordModel, agid?: string, cid?: string, oid?: string, year?: number, month?: number 
): Promise<IRecordAgg> {
  // const records = await this.aggregate([
  //   { $match: { isProcessed: false, reqInitiator: true } },
  //   {
  //     $project: {
  //       date: { $dateFromParts: { year: { $year: '$timestamp' }, month: { $month: '$timestamp' }, day: { $dayOfMonth: '$timestamp' } } }, messageSize: '$messageSize', requestType: '$requestType', oid: '$sourceOid',
  //     },
  //   },
  //   {
  //     $lookup: {
  //       from: 'items', localField: 'oid', foreignField: 'oid', as: 'item',
  //     },
  //   },
  //   {
  //     $project: {
  //       date: '$date', requestType: '$requestType', messageSize: '$messageSize', oid: '$oid', agid: '$item.agid', cid: '$item.cid',
  //     },
  //   },
  //   { $unwind: '$agid' },
  //   { $unwind: '$cid' },
  //   {
  //     $group: {
  //       _id: {
  //         agid: '$agid', oid: '$oid', cid: '$cid', date: '$date',
  //       },
  //       totalSize: { $sum: '$messageSize' },
  //       action: { $sum: { $cond: [{ $eq: ['$requestType', 'action'] }, 1, 0] } },
  //       property: { $sum: { $cond: [{ $eq: ['$requestType', 'property'] }, 1, 0] } },
  //       event: { $sum: { $cond: [{ $eq: ['$requestType', 'event'] }, 1, 0] } },
  //       info: { $sum: { $cond: [{ $eq: ['$requestType', 'info'] }, 1, 0] } },
  //       unknown: { $sum: { $cond: [{ $eq: ['$requestType', 'unknown'] }, 1, 0] } },
  //     },
  //   },
  // ]).exec()
  // if (true) {
    return {} as IRecordAgg
  // } else {
  //   throw new Error('Record not found in organisation: ' + cid)
  // }
}
