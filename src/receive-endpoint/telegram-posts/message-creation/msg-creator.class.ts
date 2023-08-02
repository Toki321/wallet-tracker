import { IRecordERC20, IRecordETH, MessageStrategy, TYPE } from '../../interfaces';
import { TransactionRecord } from '../../record.class';
import { Receive } from './receive.class';
import { Send } from './send.class';

const SendStrategy = new Send();
const ReceiveStrategy = new Receive();

export class MessageCreator {
    private strategy!: MessageStrategy; // strategy pattern
    private record: TransactionRecord;

    constructor(record: TransactionRecord) {
        this.record = record;
    }

    public formulateFinalMessage(): string | undefined {
        const messages = this.arrangeMessages();
        if (!messages) return undefined;
        const combinedMessage = messages.join('\n');
        const finalMessage =
            `Address: ${this.record.trackedEOA}\n` + combinedMessage + `\n\nTx hash: ${this.record.txHash}`;
        return finalMessage;
    }

    private arrangeMessages(): string[] | undefined {
        const ethMessages = this.getETHMessages();
        const erc20Messages = this.getERC20Messages();
        if (!ethMessages.length && !erc20Messages.length) return undefined;
        const combinedMessages = ethMessages.concat(erc20Messages);

        // arrange messages such that sends come first and receives later
        return combinedMessages.sort((a, b) => {
            const thirdWordA = a.split(' ')[2]; // Get the third word from string A
            const thirdWordB = b.split(' ')[2]; // Get the third word from string B

            if (thirdWordA === 'sent' && thirdWordB !== 'sent') return -1;
            if (thirdWordA !== 'sent' && thirdWordB === 'sent') return 1;
            return 0; // Equal priority, maintain order
        });
    }

    private getETHMessages(): string[] {
        const messages = [];
        const ethRecords = this.record.ETHRecords;
        for (const record of ethRecords) {
            const msg = this.getETHMessage(record);
            messages.push(msg);
        }
        return messages;
    }

    private getETHMessage(record: IRecordETH): string {
        if (record.type == TYPE.received) {
            this.strategy = ReceiveStrategy;
            return this.strategy.getMessageETH(record);
        } else {
            this.strategy = SendStrategy;
            return this.strategy.getMessageETH(record);
        }
    }

    private getERC20Messages(): string[] {
        const messages = [];
        const erc20Records = this.record.ERC20Records;
        for (const record of erc20Records) {
            const msg = this.getERC20Message(record);
            messages.push(msg);
        }
        return messages;
    }

    private getERC20Message(record: IRecordERC20): string {
        if (record.type == TYPE.received) {
            this.strategy = ReceiveStrategy;
            return this.strategy.getMessageERC20(record);
        } else {
            this.strategy = SendStrategy;
            return this.strategy.getMessageERC20(record);
        }
    }
}
