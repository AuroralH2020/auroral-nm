/* eslint-disable import/no-default-export */
import apm from 'elastic-apm-node'
import { Config } from '../config'
import { logger } from '../utils/logger'

export default (): Promise<any> => new Promise<any>((resolve, reject) => {
  try {
    const apm_service = apm.start({
      serviceName: Config.APM.NAME,
      serverUrl: Config.APM.SERVER_URL,
      secretToken: Config.APM.TOKEN,
      usePathAsTransactionName: true,
      active: Config.APM.ACTIVE,
    })
    if (Config.APM.ACTIVE) {
      logger.info('APM started')
    } else {
      logger.warn('APM is disabled')
    }
    resolve(apm_service)
  } catch (error) {
    reject(error)
  }
})
