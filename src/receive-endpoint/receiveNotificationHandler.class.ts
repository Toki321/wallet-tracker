/* eslint-disable @typescript-eslint/no-explicit-any */
import { ethers, providers } from "ethers";
import { TelegramMessenger } from "./telegram-posts/messenger.class";
import { LogsHandler } from "./tx-decoding/logsHandler.class";
import { TransactionRecord } from "./record.class";
import { ETHTransferHandler } from "./tx-decoding/ethTransferHandler.class";
import { BlockchainConfigFactory } from "../../config/blockchain/factory.class";
import { ConfigService } from "../../config/config.service";

const configEnv = ConfigService.getInstance();
const configFactory = BlockchainConfigFactory.getInstance();
const notifyConfig = configFactory.NOTIFY_CONFIG;
const provider = notifyConfig.getProvider();

export class Receiver {
  static lastTxHash: string | undefined;
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

    this.record.setTxHash(ethersTx.hash);

    if (this.doLogsExist(txReceipt)) {
      this.handleTxWithLogs(ethersTx, txReceipt);
    } else {
      this.handleNoLogs(ethersTx);
    }
  }

  private async handleTxWithLogs(ethersTx: ethers.Transaction, txReceipt: providers.TransactionReceipt): Promise<void> {
    let trackedEOA = notifyConfig.getTrackedEOA();

    const logsHandler = new LogsHandler(txReceipt.logs);
    console.log("normal logs: ", txReceipt.logs);

    const logInfos = logsHandler.getDecodedLogs();
    console.log("logInfos: ", logInfos);

    logsHandler.setTrackedEOA(trackedEOA);
    this.record.setTrackedEOA(trackedEOA);
    this.record = await logsHandler.fillTransactionRecord(logInfos, this.record);
    await this.handleBasicTx(ethersTx, trackedEOA);
  }

  private async handleNoLogs(ethersTx: ethers.Transaction): Promise<void> {
    console.log("Handling transaction with no logs..");
    const trackedEOA = notifyConfig.getTrackedEOA();
    this.record.setTrackedEOA(trackedEOA);
    await this.handleBasicTx(ethersTx, trackedEOA);
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
    const chatId = configEnv.get("CHAT_ID");

    const messenger = new TelegramMessenger([chatId], this.record); // leave as arr for now
    await messenger.notifyTelegram();
  }
}
