import { HttpStatusCode } from '../constants/httpCodes';
import { BaseError } from './base-error';

export class InvalidInput extends BaseError {
    constructor(description: string) {
        super('InvalidInput', HttpStatusCode.BAD_REQUEST, description, true);
    }
}
