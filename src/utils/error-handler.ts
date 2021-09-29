/**
 * Error handler
 */

import { HttpStatusCode } from './http-status-codes'
import { logger } from './logger'

export enum ErrorSource {
    UNKNOWN = 'unknown',
    ITEM = 'item',
    USER = 'user',
    NODE = 'user',
    ORGANISATION = 'organisation',
}

type ErrorOptions = {
    stack?: string,
    source?: ErrorSource
}

export class MyError {
    message: string
    status: HttpStatusCode
    stack?: string
    source?: ErrorSource
    constructor(message: string, status: HttpStatusCode = HttpStatusCode.INTERNAL_SERVER_ERROR, options?: ErrorOptions) {
        this.message = message
        this.status = status
        this.stack = options?.stack
        this.source = options?.source
    }
}

export enum ErrorType {
    WRONG_BODY = 'Wrong body',
    UNAUTHORIZED = 'Unauthorized',
    NOT_FOUND = 'Not found'
}

export const errorHandler = (err: unknown): MyError => {
    if (err instanceof MyError) {
        return err
    } else if (err instanceof Error) {
        return {
            status: HttpStatusCode.INTERNAL_SERVER_ERROR,
            message: err.message,
            source: ErrorSource.UNKNOWN
        }
    } else {
        logger.warn('Caught unexpected error type...')
        logger.warn('Error type: ' + typeof err)
        return {
            status: HttpStatusCode.INTERNAL_SERVER_ERROR,
            message: 'Server error',
            source: ErrorSource.UNKNOWN
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
