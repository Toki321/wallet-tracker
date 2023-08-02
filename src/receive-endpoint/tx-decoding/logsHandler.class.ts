/* eslint-disable @typescript-eslint/no-unused-vars */
import { providers, ethers } from "ethers";

import { IRecordERC20, IERC20, LogInfo, TYPE, IRecordETH } from "../interfaces";
import { TokenInfoFetcher } from "./tokenInfoFetcher.class";
import { TransactionRecord } from "../record.class";
import { BlockchainConfigFactory } from "../../../config/blockchain/factory.class";
import { ConfigService } from "../../../config/config.service";

const NATIVE_WRAPPED_TOKEN_ADDRESS = ConfigService.getInstance().get("NATIVE_WRAPPED_TOKEN_ADDRESS");

const notifyConfig = BlockchainConfigFactory.getInstance().NOTIFY_CONFIG;

export class LogsHandler {
  private trackedEOA!: string;
  private logs: Array<providers.Log>;

  constructor(logs: Array<providers.Log>) {
    this.logs = logs;
  }

  public setTrackedEOA(trackedEOA: string): void {
    this.trackedEOA = trackedEOA;
  }

  public async fillTransactionRecord(LogInfos: LogInfo[], finalRecord: TransactionRecord): Promise<TransactionRecord> {
    for (const info of LogInfos) {
      if (info.decodedLog.name == "Transfer") {
        const record = await this.getERC20Record(info);
        if (!record) continue;
        finalRecord.addERC20Record(record);
      } else if (info.decodedLog.name == "Withdrawal") {
        const record = await this.getETHRecord(info);
        finalRecord.addETHRecord(record);
      }
    }
    return finalRecord;
  }

  private async getETHRecord(info: LogInfo): Promise<IRecordETH> {
    const { args } = info.decodedLog; // this is a Withdrawal log from WETH
    // const depositedTo = args[0]; this actually isn't always the tracked EOA, but through an internal tx it transfers from this to our EOA, this was in terms of v3 uniswap.
    const amountBigNum = args[1];
    const ethPrice = await TokenInfoFetcher.getTokenPrice(NATIVE_WRAPPED_TOKEN_ADDRESS);
    const valueUSD = TokenInfoFetcher.getUSDValue(ethPrice, amountBigNum, 18); // always 18 dec bcs wei..
    const formattedAmount = parseFloat(ethers.utils.formatEther(amountBigNum)).toFixed(4);

    const record: IRecordETH = {
      type: TYPE.received, //
      from: info.tokenAddress,
      to: this.trackedEOA,
      amount: formattedAmount,
      valueUSD,
    };
    return record;
  }

  private async getERC20Record(info: LogInfo): Promise<IRecordERC20 | undefined> {
    const { args } = info.decodedLog;
    let record = undefined;
    if (args.from == this.trackedEOA) record = await this.createSendERC20Record(info);
    else if (args.to == this.trackedEOA) record = await this.createReceiveERC20Record(info);
    return record;
  }

  private async createReceiveERC20Record(logInfo: LogInfo): Promise<IRecordERC20> {
    const tokenInfo = await this.fetchERC20Info(logInfo.tokenAddress);
    const amount = logInfo.decodedLog.args[2];
    const formattedAmount = parseFloat(ethers.utils.formatUnits(amount, tokenInfo?.decimals)).toFixed(4);
    console.log("value of amount: ", amount);
    const valueUSD = TokenInfoFetcher.getUSDValue(tokenInfo?.price, amount, tokenInfo?.decimals);
    console.log("calcuated valueUSD", valueUSD);
    const record: IRecordERC20 = {
      type: TYPE.received,
      from: logInfo.decodedLog.args.from,
      to: logInfo.decodedLog.args.to, // this should be our tracked EOA
      token: tokenInfo,
      amount: formattedAmount,
      valueUSD: valueUSD,
    };
    return record;
  }

  private async createSendERC20Record(logInfo: LogInfo): Promise<IRecordERC20> {
    const tokenInfo = await this.fetchERC20Info(logInfo.tokenAddress);
    const amount = logInfo.decodedLog.args[2];
    const formattedAmount = parseFloat(ethers.utils.formatUnits(amount, tokenInfo?.decimals)).toFixed(4);
    const valueUSD = TokenInfoFetcher.getUSDValue(tokenInfo?.price, amount, tokenInfo?.decimals);

    const record: IRecordERC20 = {
      type: TYPE.sent,
      from: logInfo.decodedLog.args.from,
      to: logInfo.decodedLog.args.to, // this should be our tracked EOA
      token: tokenInfo,
      amount: formattedAmount,
      valueUSD: valueUSD,
    };
    return record;
  }

  private async fetchERC20Info(tokenAddress: string): Promise<IERC20 | undefined> {
    const fetcher = new TokenInfoFetcher(tokenAddress);
    const info = await fetcher.getERC20Info();
    console.log("Info fetched: ", info);
    if (info) return info;
    return undefined;
  }

  public getDecodedLogs(): LogInfo[] {
    const contractInterface = new ethers.utils.Interface(notifyConfig.eventsABI);
    const decodedLogsInfo: LogInfo[] = this.logs
      .map((log) => {
        try {
          const decodedLog = contractInterface.parseLog(log);
          return {
            decodedLog,
            tokenAddress: log.address,
          };
        } catch (err) {
          return null; // Return null if log cannot be parsed
        }
      })
      .filter((logInfo) => logInfo !== null) as LogInfo[]; // Filter out logs that couldn't be parsed, and assert that the resulting array only contains LogInfo type

    return decodedLogsInfo;
  }
}
