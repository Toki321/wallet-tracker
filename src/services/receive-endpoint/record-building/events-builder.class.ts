/* eslint-disable no-case-declarations */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { ethers, utils } from "ethers";
import { IRecordERC20, ITokenInfo, LogInfo, TYPE, IRecordETH, IRecordApproval } from "../utils/interfaces";
import { TokenInfoFetcher } from "../utils/tokenInfoFetcher.class";
import { TransactionRecord } from "./record.class";
import { RecordBuilder } from "./builder.class";

// Gets data from Event Logs in the Transaction and builds the TransactionRecord with it
export class EthErc20RecordBuilder extends RecordBuilder {
  constructor(trackedEOA: string) {
    super(trackedEOA);
  }

  public async build(LogInfos: LogInfo[], finalRecord: TransactionRecord): Promise<TransactionRecord> {
    await Promise.all(
      LogInfos.map(async (info) => {
        const eventName = info.decodedLog.name;
        switch (eventName) {
          case "Transfer":
            const erc20Record = await this.buildERC20RecordBasedOnType(info);
            if (erc20Record) finalRecord.addERC20Record(erc20Record);
            break;

          case "Withdrawal":
            // Withdrawal = Unwrapping ETH
            const ethRecord = await this.buildETHRecord(info);
            finalRecord.addETHRecord(ethRecord);
            break;

          case "Approval":
            console.log("Enter approval case");
            const approvalRecord = await this.buildApprovalRecord(info);
            finalRecord.setApprovalRecord(approvalRecord);
            break;
        }
      })
    );

    return finalRecord;
  }

  private async buildApprovalRecord(logInfo: LogInfo): Promise<IRecordApproval> {
    console.log("\nEnter buildApprovalRecord");
    console.log("logInfo: ", logInfo);
    const { decodedLog, tokenAddress } = logInfo;
    console.log("decodedLog: ", decodedLog);
    console.log("tokenAddress: ", tokenAddress);

    const { args } = decodedLog;
    console.log("args: ", args);

    const tokenInfo = await this.fetchERC20Info(tokenAddress);
    console.log("tokenInfo: ", tokenInfo);

    const owner = args[0];
    console.log("owner: ", owner);

    const spender = args[1];
    console.log("spender: ", spender);

    const amountBigNum = args[2];
    console.log("amountBigNum: ", amountBigNum);

    const readableAmount = this.formatERC20Amount(amountBigNum, tokenInfo?.decimals);
    console.log("readableAmount: ", readableAmount);

    return this.createApprovalRecord(tokenInfo, owner, spender, readableAmount);
  }

  private createApprovalRecord(
    token: ITokenInfo | undefined,
    owner: string,
    spender: string,
    amount: string
  ): IRecordApproval {
    const record: IRecordApproval = {
      token,
      owner,
      spender,
      amount,
    };
    console.log("CreateApprovalRecord result: ", record);
    return record;
  }

  // note: there is no trackedEOA in a withdrawal event in a swap. the actual ETH transfer is done through an internal tx
  private async buildETHRecord(info: LogInfo): Promise<IRecordETH> {
    const { args } = info.decodedLog;
    /*
            args[0] is the address that has unwrapped ETH, in V2 case it's the V2 Router.
            Then, through an internal tx the unwrapped ETH is transferred from V2 Router to the address that is doing the swap.
        */
    const type = TYPE.received; // type is always received because this is an Unwrapping of WETH (Withdrawal Event)
    const from = args[0];
    const to = this.trackedEOA;
    const amountWei = args[1];
    const amountETH = this.formatWeiToETH(amountWei);
    const valueUSD = await this.getUSDValueFromETHTransfer(amountWei);
    const record = this.createETHRecord(type, from, to, amountETH, valueUSD);
    return record;
  }

  private async buildERC20RecordBasedOnType(logInfo: LogInfo): Promise<IRecordERC20 | undefined> {
    const { args } = logInfo.decodedLog;
    const from = args.from;
    const to = args.to;
    let record = undefined;
    if (from == this.trackedEOA) {
      record = await this.buildERC20Record(logInfo, TYPE.sent);
    } else if (to == this.trackedEOA) {
      record = await this.buildERC20Record(logInfo, TYPE.received);
    }
    return record;
  }

  private async buildERC20Record(logInfo: LogInfo, type: TYPE): Promise<IRecordERC20> {
    const { decodedLog, tokenAddress } = logInfo;
    const { args } = decodedLog;
    const from = args.from;
    const to = args.to;
    const tokenInfo = await this.fetchERC20Info(tokenAddress);
    const amountBigNum = decodedLog.args[2];
    const readableAmount = this.formatERC20Amount(amountBigNum, tokenInfo?.decimals);
    const valueUSD = TokenInfoFetcher.getUSDValue(tokenInfo?.price, amountBigNum, tokenInfo?.decimals);
    return this.createERC20Record(type, from, to, tokenInfo, readableAmount, valueUSD);
  }

  private formatERC20Amount(amount: ethers.BigNumber, decimals: number | undefined): string {
    if (!decimals) {
      return amount.toString();
    }
    const formattedAmount = utils.formatUnits(amount, decimals);
    const roundedAmount = parseFloat(formattedAmount).toFixed(4);
    return roundedAmount;
  }

  private createERC20Record(
    type: TYPE,
    from: string,
    to: string,
    token: ITokenInfo | undefined,
    amount: string,
    valueUSD: string | undefined
  ): IRecordERC20 {
    const record: IRecordERC20 = {
      type,
      from,
      to,
      token,
      amount,
      valueUSD,
    };
    return record;
  }

  private async fetchERC20Info(tokenAddress: string): Promise<ITokenInfo | undefined> {
    const fetcher = new TokenInfoFetcher(tokenAddress);
    const info = await fetcher.getERC20Info();
    console.log("Info fetched: ", info);
    if (info) return info;
    return undefined;
  }
}
