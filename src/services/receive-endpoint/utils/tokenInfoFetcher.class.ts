import { BigNumber, ethers } from "ethers";
import { ITokenInfo } from "./interfaces";
import axios from "axios";
import { ERC20ABI } from "../../../../static/erc20.abi";
import bigDecimal from "js-big-decimal";
import { DotenvConfig } from "../../../../config/env.config";
import { NotifyConfig } from "../../../../config/notify.config";

const provider = NotifyConfig.getInstance().getProvider();

export class TokenInfoFetcher {
  private tokenContract: ethers.Contract;

  constructor(tokenAddress: string) {
    this.tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, provider);
  }

  async getERC20Info(): Promise<ITokenInfo | undefined> {
    const [symbol, decimals, name, price] = await Promise.all([
      this.getSymbol(),
      this.getDecimals(),
      this.getName(),
      TokenInfoFetcher.getTokenPrice(this.tokenContract.address), // static because we use for native token value elsewhere
    ]);
    const address = this.tokenContract.address;
    return {
      price,
      address,
      symbol,
      decimals,
      name,
    };
  }

  async getSymbol(): Promise<string | undefined> {
    try {
      const symbol = await this.tokenContract.symbol();
      return symbol;
    } catch (err: any) {
      console.log("could not fetch symbol for erc20: ", this.tokenContract.address);
      console.log(err);
      return undefined;
    }
  }

  async getDecimals(): Promise<number | undefined> {
    try {
      const decimals = await this.tokenContract.decimals();
      return decimals;
    } catch (err: any) {
      console.log("could not fetch decimals for erc20: ", this.tokenContract.address);
      console.log(err);
      return undefined;
    }
  }

  async getName(): Promise<string | undefined> {
    try {
      const name = await this.tokenContract.name();
      return name;
    } catch (err: any) {
      console.log("could not fetch name for erc20: ", this.tokenContract.address);
      console.log(err);
      return undefined;
    }
  }

  static async getTokenPrice(tokenAddress: string): Promise<bigDecimal | undefined> {
    const url = "https://api.defined.fi/";
    try {
      const result = await axios.post(
        url,
        {
          query: `{
                getTokenPrices(
                  inputs: [
                    { address: "${tokenAddress}", networkId: 1 }
                  ]
                ) {
                  priceUsd
                }
              }`,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": DotenvConfig.getInstance().get("DEFINEDFI_API_KEY"),
          },
        }
      );
      const price = result.data.data.getTokenPrices[0].priceUsd;

      return new bigDecimal(price);
    } catch (err: any) {
      console.log("could not fetch price for erc20 ", tokenAddress);
      console.log(err);
      return undefined;
    }
  }

  // returns the amount transferred in USD
  static getUSDValue(
    price: bigDecimal | undefined,
    amount: BigNumber | undefined,
    decimals: number | undefined
  ): string | undefined {
    if (!price || !amount || !decimals) {
      console.log("In getUSDValue.. price/amount/decimals is undefined. Cannot calcuate price");
      return undefined;
    }
    console.log("Input price:", price);
    console.log("Input amount:", amount.toString());
    console.log("Input decimals:", decimals);

    const formattedAmount = ethers.utils.formatUnits(amount, decimals);
    const amountBigDecimal = new bigDecimal(formattedAmount.toString());

    const amountUsd = amountBigDecimal.multiply(price);
    console.log("Calculated amountUsd:", amountUsd.getValue());

    return amountUsd.round(1).getValue();
  }

  async getHoldings(address: string): Promise<number | undefined> {
    try {
      console.log(`Fetching holdings for address: ${address}`);

      const holdings: BigNumber = await this.tokenContract.balanceOf(address);
      console.log(`Raw holdings: ${holdings.toString()}`);

      const decimals = await this.tokenContract.decimals();
      console.log(`Token decimals: ${decimals}`);

      const numHoldings = ethers.utils.formatUnits(holdings, decimals);
      console.log(`Formatted holdings: ${numHoldings}`);

      const fixed = Number(numHoldings).toFixed(4);
      console.log(`Fixed holdings: ${fixed}`);

      const parsedHoldings = Number(fixed);
      console.log(`Parsed holdings: ${parsedHoldings}`);

      return parsedHoldings;
    } catch (err) {
      console.error("Could not fetch holdings amount:", err);
    }
  }
}

// const fetcher = new TokenInfoFetcher('0xdAC17F958D2ee523a2206206994597C13D831ec7'); // uniswap

// async function something() {
//     const fetcher = new TokenInfoFetcher('0x7169D38820dfd117C3FA1f22a697dBA58d90BA06');
//     const info = await fetcher.getERC20Info();
//     const parsedAmount = ethers.utils.parseUnits('123', 6);
//     const amountUSD = await TokenInfoFetcher.getAmountUSD(new bigDecimal(1.00015266), parsedAmount, info?.decimals);
// console.log(amountUSD);

// const tx = await BlockchainConfig.getEthersProvider().getTransactionReceipt(
//     '0xd30ba0f49a8a6cc3f5af1c15ea51d005b0c0a34c852fb833e045b0718c2ab7df',
// );

// const contractInterface = new ethers.utils.Interface(eventsAbi);

// const decodedLog = contractInterface.parseLog(tx.logs[0]);
// console.log(decodedLog);

// console.log(decodedLog.args.value.toString());
// }

// something()
//     .then()
//     .catch(err => console.log(err));
