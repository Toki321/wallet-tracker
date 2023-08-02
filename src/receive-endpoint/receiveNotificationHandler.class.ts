/* eslint-disable @typescript-eslint/no-explicit-any */
import { ethers, providers } from "ethers";
import { DbInteractor } from "./tx-decoding/dbInteractor.class";
import { TelegramMessenger } from "./telegram-posts/messenger.class";
import { LogsHandler } from "./tx-decoding/logsHandler.class";
import { LogInfo } from "./interfaces";
import { DbOperationFailed } from "../../utils/errors/operation-failed";
import { TransactionRecord } from "./record.class";
import { ETHTransferHandler } from "./tx-decoding/ethTransferHandler.class";
import { BlockchainConfigFactory } from "../../config/blockchain/factory.class";

const configFactory = BlockchainConfigFactory.getInstance();
const provider = configFactory.NOTIFY_CONFIG.getProvider();

// ETH
// ERC20

export class Receiver {
  static lastTxHash: string | undefined;

  private dbInteractor!: DbInteractor;
  private record: TransactionRecord = new TransactionRecord();

  public async handleReceiveNotification(alchemyTx: any): Promise<void> {
    // alchemy sometimes does 2 POSTs at the same time. Ignore if it's for the same tx
    if (Receiver.lastTxHash == alchemyTx.hash) return;
    Receiver.lastTxHash = alchemyTx.hash;

    const [ethersTx, txReceipt] = await Promise.all([
      provider.getTransaction(alchemyTx.hash),
      provider.getTransactionReceipt(alchemyTx.hash),
    ]);

    console.log("txReceipt: ", txReceipt);
    console.log("ethersTx: ", ethersTx);

    this.dbInteractor = new DbInteractor(ethersTx);
    this.record.setTxHash(ethersTx.hash);

    if (this.doLogsExist(txReceipt)) this.handleTxWithLogs(ethersTx, txReceipt);
    else this.handleNoLogs(ethersTx);
  }

  private async handleTxWithLogs(ethersTx: ethers.Transaction, txReceipt: providers.TransactionReceipt): Promise<void> {
    let trackedEOA = await this.dbInteractor.getTrackedEOAFromETHTransfer();
    console.log("trackedEOA found in from or to:", trackedEOA);

    const logsHandler = new LogsHandler(txReceipt.logs);
    console.log("normal logs: ", txReceipt.logs);

    const logInfos = logsHandler.getDecodedLogs();
    console.log("logInfos: ", logInfos);

    if (!trackedEOA) {
      // If there are any trasnfer/deposit events. search within the logs for the tracked EOA
      trackedEOA = await this.getTrackedEOAFromLogs(logInfos);
      if (!trackedEOA)
        throw new DbOperationFailed("No EOA was found in the transaction that is in db set for tracking");
      console.log("trackedEOA found in logs: ", trackedEOA);
    }

    logsHandler.setTrackedEOA(trackedEOA);
    this.record.setTrackedEOA(trackedEOA);
    this.record = await logsHandler.fillTransactionRecord(logInfos, this.record);
    await this.handleBasicTx(ethersTx, trackedEOA);
  }

  private async handleNoLogs(ethersTx: ethers.Transaction): Promise<void> {
    console.log("Handling transaction with no logs..");
    const trackedEOA = await this.dbInteractor.getTrackedEOAFromETHTransfer();
    if (!trackedEOA) throw new DbOperationFailed("Not tracking any address that is involved in this transaction");
    console.log("trackedEOA found in from or to:", trackedEOA);
    this.record.setTrackedEOA(trackedEOA);
    await this.handleBasicTx(ethersTx, trackedEOA);
  }

  private async getTrackedEOAFromLogs(logInfos: LogInfo[]): Promise<string | undefined> {
    if (logInfos && logInfos.length > 0) {
      const trackedEOA = await this.dbInteractor.getTrackedEOAFromLogInfos(logInfos);
      return trackedEOA;
    }
  }

  private doLogsExist(txReceipt: providers.TransactionReceipt): boolean {
    return txReceipt.logs && txReceipt.logs.length > 0;
  }

  private async handleBasicTx(ethersTx: ethers.Transaction, trackedEOA: string): Promise<void> {
    const ethTransferHandler = new ETHTransferHandler(ethersTx, trackedEOA);
    this.record = await ethTransferHandler.fillTransactionRecord(this.record);
    await this.postToTelegram();
  }

  private async postToTelegram() {
    const messenger = new TelegramMessenger(this.dbInteractor.getChatIds(), this.record);
    await messenger.notifyTelegram();
  }
}
