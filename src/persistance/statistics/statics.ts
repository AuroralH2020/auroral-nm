import { HttpStatusCode } from '../../utils'
import { MyError, ErrorSource } from '../../utils/error-handler'
import { IStatistics, IStatisticsCreate, IStatisticsDocument, IStatisticsModel } from './types'

export async function createStatistics(
    this: IStatisticsModel, data: IStatisticsCreate
  ): Promise<void> {
    const date = new Date().setHours(0,0,0,0)
    this.updateOne({ date },{ ...data, date }, { upsert: true }).lean().exec()
}

export async function getLast(
  this: IStatisticsModel
): Promise<IStatistics> {
  const record = await this.findOne().lean().exec()
  if (record) {
    return record
  } else {
    throw new MyError('Statistics not found', HttpStatusCode.NOT_FOUND, { source: ErrorSource.ITEM })
  }
}

export async function getByDate(
  this: IStatisticsModel, date: number
): Promise<IStatistics> {
  const record = await this.findOne(
    { date: date }
    ).lean().exec()
  if (record) {
    return record
  } else {
    throw new MyError('Statistics not found', HttpStatusCode.NOT_FOUND, { source: ErrorSource.ITEM })
  }
}
