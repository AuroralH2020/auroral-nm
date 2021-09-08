/**
 * Error handler
 */

import { HttpStatusCode } from './http-status-codes'

type CustomError = {
    message: string,
    status: HttpStatusCode,
    stack?: string
}

export enum ErrorType {
    WRONG_BODY = 'Wrong body',
    UNAUTHORIZED = 'Unauthorized',
    NOT_FOUND = 'Not found'
}

export const errorHandler = (err: unknown): CustomError => {
    if (err instanceof Error) {
        return {
            message: err.message,
            status: getStatus(err.message),
            stack: err.stack
        }
    } else {
        return {
            message: 'Server error',
            status: HttpStatusCode.INTERNAL_SERVER_ERROR
        }
    }
}

// Private functions

const getStatus = (key: string): HttpStatusCode => {
    switch (key) {
        case ErrorType.NOT_FOUND:
            return HttpStatusCode.NOT_FOUND
        case ErrorType.UNAUTHORIZED:
            return HttpStatusCode.UNAUTHORIZED
        case ErrorType.WRONG_BODY:
            return HttpStatusCode.BAD_REQUEST
        default:
            return HttpStatusCode.INTERNAL_SERVER_ERROR
    }
}
