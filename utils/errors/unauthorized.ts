import { HttpStatusCode } from '../constants/httpCodes';
import { BaseError } from './base-error';

export class UnauthorizedError extends BaseError {
    constructor(description: string) {
        super('UnauthorizedError', HttpStatusCode.UNAUTHORIZED, description, true);
    }
}
