import { HttpStatusCode } from '../constants/httpCodes';
import { BaseError } from './base-error';

export class DbOperationFailed extends BaseError {
    constructor(description: string) {
        super('DbOperationFailed', HttpStatusCode.INTERNAL_SERVER, description, true);
    }
}
