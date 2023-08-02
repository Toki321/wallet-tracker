import { IRecordERC20, IRecordETH, MessageStrategy } from '../../interfaces';

export class Send extends MessageStrategy {
    getMessageETH(record: IRecordETH): string {
        const message = `\nSent: ${record.amount} ETH ($${record.valueUSD}) to ${record.to}`;
        return message;
    }

    getMessageERC20(record: IRecordERC20): string {
        const message = `\nSent: ${record.amount} ($${record.valueUSD}) ${record.token?.symbol}  to ${record.to}`;
        return message;
    }
}
