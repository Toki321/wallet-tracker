import { TextFormatter } from "../../utils/format-text.class";
import { IRecordERC20, IRecordETH, MessageStrategy } from "../../utils/interfaces";

export class ReceiveStrategy implements MessageStrategy {
  getMessageETH(record: IRecordETH): string {
    const from = TextFormatter.getMonoSpace(record.from);
    const message = `\n🟢 Received: ${record.amount} ETH ($${record.valueUSD}) from ${from}`;
    return message;
  }

  getMessageERC20(record: IRecordERC20): string {
    const from = TextFormatter.getMonoSpace(record.from);
    const message = `\n🟢 Received: ${record.amount} ${record.token?.symbol} from ${from}`;
    return message;
  }
}

export class SendStrategy extends MessageStrategy {
  getMessageETH(record: IRecordETH): string {
    const to = TextFormatter.getMonoSpace(record.to);
    const message = `\n🔴 Sent: ${record.amount} ETH ($${record.valueUSD}) to ${to}`;
    return message;
  }

  getMessageERC20(record: IRecordERC20): string {
    const to = TextFormatter.getMonoSpace(record.to);
    const message = `\n🔴 Sent: ${record.amount} ${record.token?.symbol} to ${to}`;
    return message;
  }
}
