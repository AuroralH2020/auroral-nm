// Controller common imports
import { expressTypes, localsTypes } from '../../../types/index'
import { HttpStatusCode } from '../../../utils/http-status-codes'
import { logger } from '../../../utils/logger'
import { responseBuilder } from '../../../utils/response-builder'
import { errorHandler } from '../../../utils/error-handler'
// Import types
import {
  IRegistration,
  IRegistrationPost,
  RegistrationStatus,
} from '../../../persistance/registration/types'
// Import services
import { RegistrationService } from '../../../core'
import { RegistrationModel } from '../../../persistance/registration/model'
import { UserModel } from '../../../persistance/user/model'
import { OrganisationModel } from '../../../persistance/organisation/model'

// Controllers

type getRegistrationController = expressTypes.Controller<{ registrationId: string }, {}, {}, IRegistration, localsTypes.ILocals>
 
export const getRegistration: getRegistrationController = async (req, res) => {
  const { registrationId } = req.params
	try {
    const data = await RegistrationModel._getRegistration(registrationId)
    return responseBuilder(HttpStatusCode.OK, res, null, data)
	} catch (err) {
    const error = errorHandler(err)
    logger.error(error.message)
    return responseBuilder(error.status, res, error.message)
	}
}

type getRegistrationsController = expressTypes.Controller<{}, {}, {}, IRegistration[], localsTypes.ILocals>
 
export const getAllRegistrations: getRegistrationsController = async (_req, res) => {
	try {
    const data = await RegistrationModel._getAllRegistration()
    return responseBuilder(HttpStatusCode.OK, res, null, data)
	} catch (err) {
    const error = errorHandler(err)
    logger.error(error.message)
    return responseBuilder(error.status, res, error.message)
	}
}

type getCompanyRegistrationsController = expressTypes.Controller<{}, {}, { offset: number }, IRegistration[], localsTypes.ILocals>
 
export const getAllCompanyRegistrations: getCompanyRegistrationsController = async (req, res) => {
	try {
    const offset = req.query.offset ? Number(req.query.offset) : 0
    const data = await RegistrationModel._getAllCompanyTypeRegistration(offset, 24)
    return responseBuilder(HttpStatusCode.OK, res, null, data)
	} catch (err) {
    const error = errorHandler(err)
    logger.error(error.message)
    return responseBuilder(error.status, res, error.message)
	}
}

type postRegistrationController = expressTypes.Controller<{}, IRegistrationPost , {}, null, localsTypes.ILocals>
 
export const postRegistration: postRegistrationController = async (req, res) => {
  const data  = req.body
  const locals = res.locals
	try {
    if (!data.status) {
      throw new Error('Missing status of the registration')
    } else if (data.status === RegistrationStatus.OPEN) {
      // If status OPEN it is a new organisation and needs new CID
      await RegistrationService.registerNewOrganisation(data)
    } else if (data.status === RegistrationStatus.PENDING) {
      // Invited user or organisation
      // Validate if new user that we have CID to assign to (otherwise it is an invited organisation)
      await RegistrationService.registerInvitedUserOrOrganisation(data, locals.origin?.realm)
    } else {
      throw new Error('Wrong registration status: ' + data.status)
    }
    return responseBuilder(HttpStatusCode.OK, res, null, null)
	} catch (err) {
    const error = errorHandler(err)
    logger.error(error.message)
    return responseBuilder(error.status, res, error.message)
	}
}

type putRegistrationController = expressTypes.Controller<{ token: string }, { status: RegistrationStatus }, {}, null, localsTypes.ILocals>
 
export const putRegistration: putRegistrationController = async (req, res) => {
  const { status } = req.body
  const { token } = req.params
  const locals = res.locals
	try {
    // Organisation verified, registering it...
    if (status === RegistrationStatus.VERIFIED) {
      await RegistrationService.registerAfterVerification(status, token, locals)
    // Invalid status received
    } else {
      throw new Error('Wrong registration update request with status: ' + status)
    }  
    return responseBuilder(HttpStatusCode.OK, res, null, null)
	} catch (err) {
    // Update invitation status to FAILED
    // await InvitationModel._setInvitationStatus(registrationObj.invitationId, InvitationStatus.FAILED)
    const error = errorHandler(err)
    logger.error(error.message)
    return responseBuilder(error.status, res, error.message)
	}
}

type putAdminRegistrationController = expressTypes.Controller<{ registrationId: string }, { status: RegistrationStatus }, {}, null, localsTypes.ILocals>
 
export const putAdminRegistration: putAdminRegistrationController = async (req, res) => {
  const { status } = req.body
  const { registrationId } = req.params
  const locals = res.locals
	try {
    // Sending verificaiton mail to pending account
    if (status === RegistrationStatus.PENDING) {
      await RegistrationService.sendVerificationMail(status, registrationId, locals)
    // Re-Sending verificaiton mail to pending account
    } else if (status === RegistrationStatus.RESENDING) {
      await RegistrationService.resendVerificationMail(status, registrationId, locals)
    // Declining registration
    } else if (status === RegistrationStatus.DECLINED) {
      await RegistrationService.declineRegistration(status, registrationId, locals)
    // Company verified by platform admin
    } else if (status === RegistrationStatus.MASTER_VERIFICATION) {
      await RegistrationService.registerAfterMasterVerification(RegistrationStatus.VERIFIED, registrationId, locals)
    // Invalid status received
    } else {
      throw new Error('Wrong registration update request with status: ' + status)
    }  
    return responseBuilder(HttpStatusCode.OK, res, null, null)
	} catch (err) {
    // Update invitation status to FAILED
    // await InvitationModel._setInvitationStatus(registrationObj.invitationId, InvitationStatus.FAILED)
    const error = errorHandler(err)
    logger.error(error.message)
    return responseBuilder(error.status, res, error.message)
	}
}

type findDuplicatesUserController = expressTypes.Controller<{}, { email: string }, {}, boolean, localsTypes.ILocals>
 
export const findDuplicatesUser: findDuplicatesUserController = async (req, res) => {
  const { email } = req.body
	try {
    let data = await RegistrationModel._findDuplicatesUser(email)
    // If not found duplicates try in users model
    if (!data) {
      data = await UserModel._findDuplicatesUser(email)
    }
    return responseBuilder(HttpStatusCode.OK, res, null, data)
	} catch (err) {
    const error = errorHandler(err)
    logger.error(error.message)
    return responseBuilder(error.status, res, error.message)
	}
}

type findDuplicatesCompanyController = expressTypes.Controller<{}, { companyName: string }, {}, boolean, localsTypes.ILocals>
 
export const findDuplicatesCompany: findDuplicatesCompanyController = async (req, res) => {
  const { companyName } = req.body
	try {
    let data = await RegistrationModel._findDuplicatesCompany(companyName)
    // If not found duplicates try in organisations model
    if (!data) {
      data = await OrganisationModel._findDuplicatesCompany(companyName)
    }
    return responseBuilder(HttpStatusCode.OK, res, null, data)
	} catch (err) {
    const error = errorHandler(err)
    logger.error(error.message)
    return responseBuilder(error.status, res, error.message)
	}
}
