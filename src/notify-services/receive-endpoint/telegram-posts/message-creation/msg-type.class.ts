import { TxTYPE } from '../../../../../../../utils/interfaces/notify.interface';
import Logger from '../../../../../../../utils/logger/winston-logger';
import { TransactionRecord } from '../../record-building/record.class';
import { IRecordApproval } from '../../utils/interfaces';
import { TextFormatter } from '../../../../../utils/format-text.class';

export abstract class TypeDependantMessage {
    abstract getMessage(record: TransactionRecord): string;
}

export class ApprovalMessage extends TypeDependantMessage {
    getMessage(record: TransactionRecord): string {
        if (record.type == TxTYPE.approval) {
            const approvalRecord: IRecordApproval | undefined = record.ApprovalRecord;
            const spender = TextFormatter.getMonoSpace(approvalRecord?.spender);
            if (!approvalRecord) {
                throw new Error('The tx has been determined as Approval, but the ApprovalRecord is undefined');
            }
            return `\nHas approved a spending of ${approvalRecord.amount} to ${spender}`;
        }

        return '';
    }
}

export class ContractCreationMessage extends TypeDependantMessage {
    getMessage(record: TransactionRecord): string {
        if (record.type == TxTYPE.contractCreation) {
            const contractAddress = TextFormatter.getMonoSpace(record.deployedContractAddress);

            if (!contractAddress) {
                Logger.error('Could not determine the address of the contract');
            }
            return `\nHas deployed a contract at ${contractAddress}`;
        }

        return '';
    }
}
