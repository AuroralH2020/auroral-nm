// Controller common imports
import { expressTypes, localsTypes } from '../../../types/index'
import { HttpStatusCode } from '../../../utils/http-status-codes'
import { logger } from '../../../utils/logger'
import { responseBuilder } from '../../../utils/response-builder'
import { errorHandler } from '../../../utils/error-handler'

// Controller specific imports
import { BrokenItemInfoType } from '../../../persistance/item/types'
import { fixItemsConsistency } from '../../../core/db-consistency'

// Controllers
type fixItemsCtrl = expressTypes.Controller<{}, {}, {}, BrokenItemInfoType[], localsTypes.ILocals>
 
export const fixItems: fixItemsCtrl = async (req, res) => {
        const dryrun = req.headers.dryrun === 'true'
        try {
                const a = await fixItemsConsistency(dryrun)
                return responseBuilder(HttpStatusCode.OK, res, null, a)
        } catch (err) {
                const error = errorHandler(err)
                logger.error(error.message)
                return responseBuilder(error.status, res, error.message)
        }
}
