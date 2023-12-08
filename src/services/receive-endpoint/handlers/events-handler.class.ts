import { ethers, providers } from "ethers";
import { NoEventsTxHandler } from "./no-events-handler.class";
import { EthErc20RecordBuilder } from "../record-building/events-builder.class";
import { LogInfo, TxTYPE } from "../utils/interfaces";
import { TxTypeDeciderFromEvents } from "../transaction-type-deciding/events-part.class";
import { LogsDecoder } from "../utils/logs-decoder.class";
import Logger from "../../../utils/logger/winston-logger";
import { DbOperationFailed } from "../../../utils/errors/operation-failed";
import { TraderModel } from "../../../db/notify.model";

// a tx with events, also has a non-events part so we need to handle that too, hence we extend NoEventsTxHandler
//todo refactor this. favor composition over inheritance
export class EventsTxHandler extends NoEventsTxHandler {
  constructor(tx: ethers.Transaction, receipt: providers.TransactionReceipt) {
    super(tx, receipt);
    this.changeTypeDeciderToEvents();
  }

  public async handle(): Promise<void> {
    let trackedEOA;
    try {
      trackedEOA = await this.getTrackedEOAFromTransfer();
      this.txType = await this.typeDecider.getType();
      Logger.info("Found Transaction Type: ");
      console.log(this.txType);

      const logsDecoder = new LogsDecoder(this.receipt.logs);
      let decodedLogs: LogInfo[] = [];

      //! this was done as quick hotfix. bad code
      if (this.txType == TxTYPE.approval) {
        decodedLogs = logsDecoder.decodeApprovalLog();
      } else if (this.txType == TxTYPE.contractCreation) {
        this.record.setDeployedContractAddress(this.receipt.contractAddress);
      } else {
        decodedLogs = logsDecoder.decodeWithdrawalTransferLogs();
      }

      // if cant find tEOA from Transfer
      if (!trackedEOA) {
        trackedEOA = await this.getTrackedEOAFromEvents(decodedLogs);
      }
      this.record.setTrackedEOA(trackedEOA);
      const trader = await TraderModel.findOne({ address: trackedEOA }).exec();
      if (!trader) throw new Error("There is no trader with that EOA");
      this.record.setName(trader.name);

      await this.buildRecordFromEvents(trackedEOA, decodedLogs);

      // from extended NoEventsTxHandler class
      await this.buildTransferRecord(trackedEOA);
      await this.postToTelegram();
    } catch (err) {
      console.error("Error in handle() in EventsTxHandler");
      throw err;
    }
  }

  private async getTrackedEOAFromEvents(eventInfos: LogInfo[]): Promise<string> {
    let trackedEOA;
    try {
      trackedEOA = await this.TrackedEOAExtractor.getTrackedEOAFromLogInfos(eventInfos);
      console.log("Tracked EOA was found in Logs: ", trackedEOA);

      if (!trackedEOA) {
        throw new DbOperationFailed("No EOA was found in the transaction that is in db set for tracking");
      }
      console.log("Tracked EOA was found from ETH transfer: ", trackedEOA);

      return trackedEOA;
    } catch (err) {
      console.error("Err in handle() in EventsTxHandler while getting tracked EOA from logs:");
      throw err;
    }
  }

  private async buildRecordFromEvents(trackedEOA: string, decodedLogs: LogInfo[]): Promise<void> {
    const builder = new EthErc20RecordBuilder(trackedEOA);
    this.record = await builder.build(decodedLogs, this.record);
    console.log("Sucessfully added data to record from Events: ", this.record);
  }

  private changeTypeDeciderToEvents(): void {
    this.typeDecider = new TxTypeDeciderFromEvents(this.tx, this.receipt);
  }
}
