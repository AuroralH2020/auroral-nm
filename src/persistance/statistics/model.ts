/**
 * DATA MODEL
 * Represents the message records stored for tracking the usage in the nodes
 */
import mongoose from 'mongoose'
import StatiscticsSchema from './schema'
import { IStatisticsDocument, IStatisticsModel } from './types'

export const StatisticsModel = mongoose.model<IStatisticsDocument, IStatisticsModel>(
  'statistics',
  StatiscticsSchema
)
