// Controller common imports
import { expressTypes, localsTypes } from '../../../types/index'
import { HttpStatusCode } from '../../../utils/http-status-codes'
import { logger } from '../../../utils/logger'
import { responseBuilder } from '../../../utils/response-builder'

// Controller specific imports
import { ItemService } from '../../../core'
import { IItemUI, IItemUpdate, ItemPrivacy, ItemStatus, ItemType } from '../../../persistance/item/types'
import { ItemModel } from '../../../persistance/item/model'

// Controllers

type getManyController = expressTypes.Controller<{}, {}, { type: ItemType, offset: number, filter: number }, IItemUI[], localsTypes.ILocals>
 
export const getMany: getManyController = async (req, res) => {
  const { type, offset, filter } = req.query
  const { decoded } = res.locals
	try {
        // const data = await ItemService.getMany(decoded.org, type, offset, filter)
        const data: IItemUI[] = [{
            // context: string
            name: 'Dummy',
            oid: '0000',
            agid: '0000',
            uid: '19951f90-6d59-4648-ae06-08e15549f1f1',
            cid: '904b7c42-7b4b-4637-aa38-e96a55ff4288',
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

type getOneController = expressTypes.Controller<{ oid: string }, {}, {}, IItemUI, localsTypes.ILocals>
 
export const getOne: getOneController = async (req, res) => {
  const { oid } = req.params
  const { decoded } = res.locals
	try {
        // const data = await ItemService.getOne(decoded.org, oid)
        const data: IItemUI = {
            // context: string
            name: 'Dummy',
            oid,
            agid: '0000',
            uid: '19951f90-6d59-4648-ae06-08e15549f1f1',
            cid: '904b7c42-7b4b-4637-aa38-e96a55ff4288',
            companyName: 'Some company',
            description: 'Some description',
            owner: { 
              name: 'Some user',
              email: 'a@b.com'
            },
            gateway: {
              name: 'some gtw'
            },
            online: true,
            accessLevel: ItemPrivacy.PRIVATE,
            type: ItemType.DEVICE,
            status: ItemStatus.ENABLED,
            lastUpdated: new Date().getTime(),
            created: new Date().getTime()
        }
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
    console.log(data)
    const item = await ItemModel._getDoc(oid)
    await item._updateItem(data)
    return responseBuilder(HttpStatusCode.OK, res, null, null)
	} catch (err) {
		logger.error(err.message)
    if (err.message === 'Item not found') {
      return responseBuilder(HttpStatusCode.NOT_FOUND, res, err)
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
    await ItemService.removeOne(oid)
    return responseBuilder(HttpStatusCode.OK, res, null, null)
	} catch (err) {
    if (err.message === 'Item not found') {
      return responseBuilder(HttpStatusCode.NOT_FOUND, res, err)
    } else {
      return responseBuilder(HttpStatusCode.INTERNAL_SERVER_ERROR, res, err)
    }
	}
}
