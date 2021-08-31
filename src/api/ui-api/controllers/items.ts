// Controller common imports
import { expressTypes, localsTypes } from '../../../types/index'
import { HttpStatusCode } from '../../../utils/http-status-codes'
import { logger } from '../../../utils/logger'
import { responseBuilder } from '../../../utils/response-builder'

// Controller specific imports
import { ItemService } from '../../../core'
import { IItem, ItemPrivacy, ItemStatus, ItemType } from '../../../persistance/item/types'

// Controllers

type getManyController = expressTypes.Controller<{}, {}, { type: ItemType, offset: number, filter: number}, IItem[], localsTypes.ILocals>
 
export const getMany: getManyController = async (req, res) => {
  const { type, offset, filter } = req.query
  const { decoded } = res.locals
	try {
        console.log(type, offset, filter)
        // const data = await ItemService.getMany(decoded.org, type, offset, filter)
        const data: IItem[] = [{
            // context: string
            name: 'Dummy',
            oid: '0000',
            agid: '0000',
            uid: '0000',
            cid: '0000',
            companyName: 'Some company',
            online: true,
            accessLevel: ItemPrivacy.PRIVATE,
            type: ItemType.DEVICE,
            status: ItemStatus.ENABLED,
            lastUpdated: new Date().getTime(),
            created: new Date().getTime()
        }]
        return responseBuilder(HttpStatusCode.OK, res, null, data)
	} catch (err) {
		logger.error(err.message)
		return responseBuilder(HttpStatusCode.INTERNAL_SERVER_ERROR, res, err)
	}
}
