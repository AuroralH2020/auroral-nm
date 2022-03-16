import { OrganisationModel } from '../persistance/organisation/model'
import { ItemModel } from '../persistance/item/model'
import { StatisticsModel } from '../persistance/statistics/model'
import { logger } from '../utils'
import { errorHandler, MyError } from '../utils/error-handler'
import { NodeModel } from '../persistance/node/model'
import { UserModel } from '../persistance/user/model'
import { IStatistics } from '../persistance/statistics/types'
import { ContractModel } from '../persistance/contract/model'
import { slack } from '../microservices/slackBot'

export const storeStatistics = async (): Promise<void> => {
        logger.info('Creating statistics')
        const items = await ItemModel._count()
        const nodes = await NodeModel._count()
        const users = await UserModel._count()
        const organisations = await OrganisationModel._count()
        const contracts = await ContractModel._count()
        const data = {
            items,
            nodes,
            users,
            organisations,
            contracts
        }
        const slackMessage = 'Items ' + String(items) + ' Nodes: ' + String(nodes) + ' Users: ' + String(users) + ' Organisations: ' + String(organisations) + ' Contracts: ' + String(contracts) 
        await slack.pushMessage(' This is your daily update for ' + new Date().toISOString())
        await slack.pushMessage(slackMessage)
        StatisticsModel._createStatistics(data)
}
export const getLastStatistics = async (): Promise<IStatistics> => {
    const statistics =  await StatisticsModel._getLast()
    return statistics
}
export const getStatistics = async (date: Number): Promise<IStatistics> => {
    const statistics =  await StatisticsModel._getByDate(date)
    return statistics
}

