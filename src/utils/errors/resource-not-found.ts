import { HttpStatusCode } from '../constants/httpCodes';
import { BaseError } from './base-error';

export class ResourceNotFound extends BaseError {
    constructor(description: string) {
        super('ResourceNotFound', HttpStatusCode.NOT_FOUND, description, true);
    }
}
