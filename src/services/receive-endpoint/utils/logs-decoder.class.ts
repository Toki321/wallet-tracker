import { providers, utils } from "ethers";
import { LogInfo } from "./interfaces";
import { NotifyConfig } from "../../../../config/notify.config";
import Logger from "../../../utils/logger/winston-logger";

const notifyConfig = NotifyConfig.getInstance();

export class LogsDecoder {
  private logs: Array<providers.Log>;

  constructor(logs: Array<providers.Log>) {
    this.logs = logs;
  }

  public decodeWithdrawalTransferLogs(): LogInfo[] {
    const eventsABI = notifyConfig.getAbiForDecodingLogs(); // decoding Withdrawal and Transfer only
    const contractInterface = new utils.Interface(eventsABI);
    const decodedLogsInfo: LogInfo[] = [];

    for (const log of this.logs) {
      try {
        const decodedLog = contractInterface.parseLog(log);
        decodedLogsInfo.push({
          decodedLog,
          tokenAddress: log.address,
        });
      } catch (err) {
        // Do nothing; skip adding to the decodedLogsInfo array if log cannot be parsed
      }
    }

    return decodedLogsInfo;
  }

  public decodeApprovalLog(): LogInfo[] {
    try {
      console.log("\nEnter decodeApprovalLog()");
      console.log("this.logs arr: ", this.logs);
      const abi = ["event Approval(address indexed owner, address indexed spender, uint256 value)"];
      const contractInterface = new utils.Interface(abi);
      const decodedLogsInfo: LogInfo[] = [];

      const approvalLog = this.logs[0];
      console.log("Decoding the first log: ", approvalLog);
      const decodedLog = contractInterface.parseLog(approvalLog);
      decodedLogsInfo.push({
        decodedLog,
        tokenAddress: approvalLog.address,
      });

      console.log("Returning dcodedLogsInfo arr: ", decodedLogsInfo);
      console.log("End decodeApprovalLog()\n");
      return decodedLogsInfo;
    } catch (err) {
      Logger.error("Error occured in decodeApprovalLog:");
      console.error(err);
      throw err;
    }
  }
}
