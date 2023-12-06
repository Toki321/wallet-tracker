import { ethers, utils } from "ethers";
import { IRecordETH, TYPE } from "../utils/interfaces";
import { TransactionRecord } from "./record.class";
import bigDecimal from "js-big-decimal";
import { TokenInfoFetcher } from "../utils/tokenInfoFetcher.class";

export abstract class RecordBuilder {
  protected trackedEOA!: string;

  constructor(trackedEOA: string) {
    this.trackedEOA = trackedEOA;
  }

  public abstract build(...params: any[]): Promise<TransactionRecord>;

  protected formatWeiToETH(amount: ethers.BigNumber): string {
    const amountETH = utils.formatEther(amount);
    const roundedAmountETH = parseFloat(amountETH).toFixed(4);
    return roundedAmountETH;
  }

  protected createETHRecord(
    type: TYPE,
    from: string | undefined,
    to: string | undefined,
    amount: string,
    valueUSD: string | undefined
  ): IRecordETH {
    const record: IRecordETH = {
      type,
      from,
      to,
      amount,
      valueUSD,
    };
    return record;
  }

  protected async getUSDValueFromETHTransfer(amountWei: ethers.BigNumber): Promise<string | undefined> {
    const ethPrice = await this.getETHPrice();
    const decimals = 18; // always 18 decimals bcs wei
    const valueUSD = TokenInfoFetcher.getUSDValue(ethPrice, amountWei, decimals);
    return valueUSD;
  }

  private async getETHPrice(): Promise<bigDecimal | undefined> {
    const WETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
    const ethPrice = await TokenInfoFetcher.getTokenPrice(WETH); // this is because we fetching ETH price from WETH..
    return ethPrice;
  }
}
