import { ethers, providers } from "ethers";
import { TransactionRecord } from "../record-building/record.class";
import { TrackedEOAExtractor } from "../utils/tracked-eoa-extractor.class";
import { ETHRecordBuilder } from "../record-building/transfer-builder.class";
import { TelegramMessenger } from "../telegram-posts/messenger.class";
import { TxTypeDeciderFromTransfer } from "../transaction-type-deciding/transfer-part.class";
import { IUserNotify, TxTYPE } from "../utils/interfaces";
import { DbOperationFailed } from "../../../utils/errors/operation-failed";
import { TraderModel } from "../../../db/notify.model";

export class NoEventsTxHandler {
  protected tx: ethers.Transaction;
  protected receipt: providers.TransactionReceipt;
  protected record: TransactionRecord;
  protected TrackedEOAExtractor: TrackedEOAExtractor;
  protected typeDecider: TxTypeDeciderFromTransfer;
  protected txType: TxTYPE;

  constructor(tx: ethers.Transaction, receipt: providers.TransactionReceipt) {
    this.tx = tx;
    this.record = new TransactionRecord(tx.hash);
    this.TrackedEOAExtractor = new TrackedEOAExtractor(tx);
    this.typeDecider = new TxTypeDeciderFromTransfer(tx);
    this.txType = TxTYPE.undetermined;
    this.receipt = receipt;
  }

  public async handle(): Promise<void> {
    try {
      console.log("Handling transaction with no logs..");

      const trackedEOA = await this.getTrackedEOAFromTransfer();

      this.txType = await this.typeDecider.getType();
      console.log("Type determined: ", this.txType);

      if (!trackedEOA) throw new DbOperationFailed("Not tracking any address that is involved in this transaction");

      console.log("trackedEOA found in from or to:", trackedEOA);

      this.record.setTrackedEOA(trackedEOA);
      const trader = await TraderModel.findOne({ address: trackedEOA }).exec();
      if (!trader) throw new Error("There is no trader with that EOA");
      this.record.setName(trader.name);

      if (this.txType == TxTYPE.contractCreation) {
        this.record.setDeployedContractAddress(this.receipt.contractAddress);
      }

      await this.buildTransferRecord(trackedEOA);
      await this.postToTelegram();
    } catch (err) {
      console.error("Error in handle()");
      throw err;
    }
  }

  protected async buildTransferRecord(trackedEOA: string): Promise<void> {
    const builder = new ETHRecordBuilder(this.tx, trackedEOA);
    try {
      this.record = await builder.build(this.record);
      console.log("Sucessfully added data to record from Tranfer: ", this.record);
    } catch (err) {
      console.error("Error in handleNoEventsPart: ");
      throw err;
    }
  }

  protected async getTrackedEOAFromTransfer(): Promise<string | undefined> {
    let trackedEOA;
    try {
      trackedEOA = await this.TrackedEOAExtractor.getTrackedEOAFromETHTransfer();
    } catch (err) {
      console.error("Error in getTrackedEOAFromNonEventPart:");
      throw err;
    }
    return trackedEOA;
  }

  protected async postToTelegram(): Promise<void> {
    const chatIds = await this.getChatIdsToNotify();
    console.log("Got Chat IDs to notify: ", chatIds);
    const messenger = new TelegramMessenger(chatIds, this.record);
    try {
      await messenger.notifyTelegram();
    } catch (err) {
      console.error("Error in postToTelegram: ");
      throw err;
    }
  }

  private async getChatIdsToNotify(): Promise<string[]> {
    const users: IUserNotify[] = this.TrackedEOAExtractor.getUsers();

    try {
      if (this.txType == TxTYPE.undetermined) {
        throw new Error("Could not determine type of transaction..");
      }
      this.record.setType(this.txType);
      // Filter users by the txType and map them to their chatId
      const chatIdsToNotify: string[] = users
        .filter((user) => user.txTypes.includes(this.txType))
        .map((user) => user.chatId);

      return chatIdsToNotify;
    } catch (err) {
      console.error("Error in getChatIdsToNotify");
      throw err;
    }
  }
}
