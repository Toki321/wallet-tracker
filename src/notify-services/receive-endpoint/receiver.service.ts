/* eslint-disable @typescript-eslint/no-explicit-any */
import { providers } from "ethers";
import { NoEventsTxHandler } from "./handlers/no-events-handler.class";
import { EventsTxHandler } from "./handlers/events-handler.class";
import { NotifyConfig } from "../../../config/notify.config";
import Logger from "../../../utils/logger/winston-logger";

const provider = NotifyConfig.getInstance().getProvider();

export class Receiver {
  static lastTxHash: string;

  public async handleReceiveNotification(alchemyTx: any): Promise<void> {
    try {
      // alchemy sometimes does a double POST for same tx. Ignore if it's a POST for the same tx
      if (Receiver.lastTxHash == alchemyTx.hash) {
        return;
      }
      Receiver.lastTxHash = alchemyTx.hash;

      console.log("Received Alchemy Tx: ", alchemyTx);

      const [tx, receipt] = await Promise.all([
        provider.getTransaction(alchemyTx.hash),
        provider.getTransactionReceipt(alchemyTx.hash),
      ]);

      console.log("Ethers Transaction: ", tx);
      console.log("Ethers Receipt: ", receipt);

      const logsExist = this.doLogsExist(receipt);

      if (logsExist) {
        Logger.info("LOGS DO EXIST!!");
        const handler = new EventsTxHandler(tx, receipt);
        await handler.handle();
      } else {
        Logger.info("LOGS DO NOT EXIST!!");
        const handler = new NoEventsTxHandler(tx, receipt);
        await handler.handle();
      }
    } catch (err) {
      Logger.error("Err in handleReceiveNotification");
      throw err;
    }
  }

  private doLogsExist(receipt: providers.TransactionReceipt): boolean {
    if (receipt.logs.length == 0) {
      return false;
    }
    return true;
  }
}
