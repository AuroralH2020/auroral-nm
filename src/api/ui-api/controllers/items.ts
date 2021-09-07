// Controller common imports
import { expressTypes, localsTypes } from '../../../types/index'
import { HttpStatusCode } from '../../../utils/http-status-codes'
import { logger } from '../../../utils/logger'
import { responseBuilder } from '../../../utils/response-builder'

// Controller specific imports
import { ItemService } from '../../../core'
import { IItemUI, IItemUpdate, ItemType } from '../../../persistance/item/types'

// Controllers

type getManyController = expressTypes.Controller<{}, {}, { type: ItemType, offset: number, filter: number }, IItemUI[], localsTypes.ILocals>
 
export const getMany: getManyController = async (req, res) => {
  const { type, offset, filter } = req.query
  const { decoded } = res.locals
	try {
        const data = await ItemService.getMany(decoded.org, type, offset, filter)
        return responseBuilder(HttpStatusCode.OK, res, null, data)
	} catch (err) {
		logger.error(err.message)
		return responseBuilder(HttpStatusCode.INTERNAL_SERVER_ERROR, res, err)
	}
}

type getOneController = expressTypes.Controller<{ oid: string }, {}, {}, IItemUI, localsTypes.ILocals>
 
export const getOne: getOneController = async (req, res) => {
  const { oid } = req.params
  const { decoded } = res.locals
	try {
        const data = await ItemService.getOne(decoded.org, oid)
        return responseBuilder(HttpStatusCode.OK, res, null, data)
	} catch (err) {
		logger.error(err.message)
		return responseBuilder(HttpStatusCode.INTERNAL_SERVER_ERROR, res, err)
	}
}

type UpdateOneController = expressTypes.Controller<{ oid: string }, IItemUpdate, {}, null, localsTypes.ILocals>
 
export const updateOne: UpdateOneController = async (req, res) => {
  const { oid } = req.params
  const data = req.body
  const { decoded } = res.locals
	try {
    await ItemService.updateOne(oid, data, decoded.uid)
    return responseBuilder(HttpStatusCode.OK, res, null, null, true)
	} catch (err) {
		logger.error(err.message)
    if (err.message === 'Unauthorized') {
      return responseBuilder(HttpStatusCode.UNAUTHORIZED, res, err)
    } else {
      return responseBuilder(HttpStatusCode.INTERNAL_SERVER_ERROR, res, err)
    }
	}
}

type RemoveOneController = expressTypes.Controller<{ oid: string }, {}, {}, null, localsTypes.ILocals>
 
export const removeOne: RemoveOneController = async (req, res) => {
  const { oid } = req.params
  const { decoded } = res.locals
	try {
    await ItemService.removeOne(oid, decoded.uid)
    return responseBuilder(HttpStatusCode.OK, res, null, null, true)
	} catch (err) {
    logger.error(err.message)
    if (err.message === 'Unauthorized') {
      return responseBuilder(HttpStatusCode.UNAUTHORIZED, res, err)
    } else {
      return responseBuilder(HttpStatusCode.INTERNAL_SERVER_ERROR, res, err)
    }
	}
}
