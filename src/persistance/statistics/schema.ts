import mongoose from 'mongoose'
import { createStatistics, getByDate, getLast } from './statics'
import { IStatisticsDocument, IStatisticsModel } from './types'

const Schema = mongoose.Schema

const StatisticsSchema = new Schema<IStatisticsDocument, IStatisticsModel>({
    date: { type: Number, required: true, index: true, unique: true },
    created: { type: Number, default: Date.now },
    users: { type: Number, required: true },
    items: { type: Number, required: true },
    nodes: { type: Number, required: true },
    organisations: { type: Number, required: true },
    contracts: { type: Number, required: true },
})

// Statics

StatisticsSchema.statics._getByDate = getByDate
StatisticsSchema.statics._createStatistics = createStatistics
StatisticsSchema.statics._getLast = getLast

// Methods

// eslint-disable-next-line import/no-default-export
export default StatisticsSchema

