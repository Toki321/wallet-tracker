import { IRecordERC20, IRecordETH, MessageStrategy } from '../../interfaces';

export class Receive implements MessageStrategy {
    getMessageETH(record: IRecordETH): string {
        const message = `\nReceived: ${record.amount} ETH ($${record.valueUSD}) from ${record.from}`;
        return message;
    }

    getMessageERC20(record: IRecordERC20): string {
        const message = `\nReceived: ${record.amount} ($${record.valueUSD}) ${record.token?.symbol} from ${record.from}`;
        return message;
    }
}
