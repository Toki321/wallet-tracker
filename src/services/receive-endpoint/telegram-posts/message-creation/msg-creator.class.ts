import { IRecordERC20, IRecordETH, MessageStrategy, TYPE } from "../../utils/interfaces";
import { TransactionRecord } from "../../record-building/record.class";
import { ReceiveStrategy, SendStrategy } from "./send-receive.class";
import { ApprovalMessage, ContractCreationMessage, SwapMessage, TypeDependantMessage } from "./msg-type.class";
import { TextFormatter } from "../../utils/format-text.class";

const sendStrategy = new SendStrategy();
const receiveStrategy = new ReceiveStrategy();

export class MessageCreator {
  private strategy!: MessageStrategy;
  private record: TransactionRecord;
  private msgTypes: TypeDependantMessage[];

  constructor(record: TransactionRecord) {
    this.record = record;
    this.msgTypes = [new SwapMessage(), new ApprovalMessage(), new ContractCreationMessage()];
  }

  public async formulateFinalMessage(): Promise<string | undefined> {
    let message = "";
    for (const msgType of this.msgTypes) {
      message = await msgType.getMessage(this.record);

      if (message != "") break;
    }

    if (message == "") {
      const messages = this.getMessages();
      if (messages) {
        message = messages.join("\n");
      }
    }
    // 🟢🔴

    const walletAddress = TextFormatter.getMonoSpace(this.record.trackedEOA);
    const name = TextFormatter.getNameHyperLinkNotify(this.record.name, this.record.trackedEOA);
    const txHash = TextFormatter.getTxHashHyperLinkNotify(this.record.txHash);

    console.log("if it has an erc20 print the contract address (CA)");
    const token = this.record.ERC20Records[0];
    if (token) {
      const CA = TextFormatter.getMonoSpace(this.record.ERC20Records[0].token?.address);
      return `Name: ${name}\n${walletAddress}\n` + message + `\n\nCA: ${CA}\n\n${txHash}`;
    }

    return `Name: ${name}\n${walletAddress}\n` + message + `\n\n${txHash}`;
  }

  private getMessages(): string[] | undefined {
    const ethMessages = this.getETHMessages();
    const erc20Messages = this.getERC20Messages();
    if (!ethMessages.length && !erc20Messages.length) return undefined;
    const messages = ethMessages.concat(erc20Messages);

    return messages;
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
      this.strategy = receiveStrategy;
      return this.strategy.getMessageETH(record);
    } else {
      this.strategy = sendStrategy;
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
      this.strategy = receiveStrategy;
      return this.strategy.getMessageERC20(record);
    } else {
      this.strategy = sendStrategy;
      return this.strategy.getMessageERC20(record);
    }
  }
}
