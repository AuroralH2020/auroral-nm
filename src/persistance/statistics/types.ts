import { Document, Model } from 'mongoose'

export interface IStatistics {
    date: number,
    users: number,
    items: number,
    nodes: number,
    organisations: number,
    contracts: number,
}
// Input to create a new Record
export interface IStatisticsCreate {
    users: number,
    items: number,
    nodes: number,
    organisations: number,
    contracts: number,
}

export interface IStatisticsDocument extends IStatistics, Document {
}

export interface IStatisticsModel extends Model<IStatisticsDocument> {
    _createStatistics: (
        this: IStatisticsModel,
        data: IStatisticsCreate
    ) => Promise<void>
    _getLast: (
        this: IStatisticsModel,
    ) => Promise<IStatisticsDocument>
    _getByDate: (
        this: IStatisticsModel,
        date: number
    ) => Promise<IStatisticsDocument>
}
