/* eslint-disable import/no-default-export */
import apm from 'elastic-apm-node'
import { Config } from '../config'

export default (): Promise<any> => new Promise<any>((resolve, reject) => {
  try {
    const apm_service = apm.start({
      serviceName: Config.APM.NAME,
      serverUrl: Config.APM.SERVER_URL,
      secretToken: Config.APM.TOKEN,
      usePathAsTransactionName: true,
    })
    resolve(apm_service)
  } catch (error) {
    reject(error)
  }
})
