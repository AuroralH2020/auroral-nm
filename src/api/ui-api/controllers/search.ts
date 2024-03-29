// Controller common imports
import { expressTypes, localsTypes } from '../../../types/index'
import { HttpStatusCode } from '../../../utils/http-status-codes'
import { logger } from '../../../utils/logger'
import { responseBuilder } from '../../../utils/response-builder'
import { errorHandler, MyError } from '../../../utils/error-handler'
import { SearchResult, SearchResultType } from '../../../types/misc-types'
import { ItemModel } from '../../../persistance/item/model'
import { OrganisationModel } from '../../../persistance/organisation/model'
import { NodeModel } from '../../../persistance/node/model'
import { UserModel } from '../../../persistance/user/model'

// Controller specific imports

// Controllers

type globalSearchController = expressTypes.Controller<{}, {}, { text: string, type?: SearchResultType, offset?: string }, SearchResult[], localsTypes.ILocals>
 
export const globalSearch: globalSearchController = async (req, res) => {
    const { text, type, offset } = req.query
	const decoded = res.locals.decoded
	try {
		const requestLimit = 25
		// test if text is longer than 3 characters
		if (!text || text.length < 3) {
			throw new MyError('Please send at least three characters')
		}
		// when type is not provided - default all
		let searchType = type ? type : [
			SearchResultType.ORGANISATION,
			SearchResultType.ITEM,
			SearchResultType.COMMUNITY,
			SearchResultType.NODE,
			SearchResultType.USER
		]

		// array fix
		searchType = Array.isArray(searchType) ? searchType : [searchType]
		// default offset
		const searchOffset = offset ? parseInt(offset) : 0 as number
		if (searchOffset < 0) {
			throw new MyError('Please use offset larger than 0')
		}

		// get ORGANISATION
		let result = [] as SearchResult[]

		// get my organisations (because of knows array)
		const myOrganisation = await OrganisationModel._getOrganisation(decoded.cid) 
		for (const sType of searchType) {
			const availibleSpace = (requestLimit - result.length) > 0 ? requestLimit - result.length : 0

			if (availibleSpace === 0) {
				break
			}
			switch (sType) {
				case SearchResultType.ITEM:
					result = [...result, ...await ItemModel._search(myOrganisation.cid, myOrganisation.knows, text, availibleSpace,  searchOffset)]
					break
				case SearchResultType.ORGANISATION:
					result = [...result, ...await OrganisationModel._search(text, availibleSpace, searchOffset)]
					break
				case SearchResultType.NODE:
					result = [...result, ...await NodeModel._search(myOrganisation.cid, text, availibleSpace, searchOffset)] 
					break
				case SearchResultType.USER:
					result = [...result, ...await UserModel._search(myOrganisation.cid, myOrganisation.knows, text, availibleSpace, searchOffset)]
					break
				// case SearchResultType.COMMUNITY:
				//	result = // [...result, ...await CommunityModel._search(myOrganisation.cid, text, availibleSpace, searchOffset)]
				//	break
				default:
					break
			}
		}
		return responseBuilder(HttpStatusCode.OK, res, null, result)
	} catch (err) {
		const error = errorHandler(err)
		logger.error(error.message)
		return responseBuilder(error.status, res, error.message)
	}
}
