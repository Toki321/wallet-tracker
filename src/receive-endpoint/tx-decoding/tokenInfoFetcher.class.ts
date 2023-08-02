import { BigNumber, ethers } from "ethers";
import { IERC20 } from "../interfaces";
import axios from "axios";
import { ConfigService } from "../../../config/config.service";

import bigDecimal from "js-big-decimal";
import { BlockchainConfigFactory } from "../../../config/blockchain/factory.class";

const configFactory = BlockchainConfigFactory.getInstance();
const notifyConfig = configFactory.NOTIFY_CONFIG;
const provider = notifyConfig.getProvider();

export class TokenInfoFetcher {
  private tokenContract: ethers.Contract;

  constructor(tokenAddress: string) {
    this.tokenContract = new ethers.Contract(tokenAddress, notifyConfig.ERC20ABI, provider);
  }

  async getERC20Info(): Promise<IERC20 | undefined> {
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
            "x-api-key": ConfigService.getInstance().get("DEFINEDFI_API_KEY"),
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

  // returns the amount transferred in an erc20 transfer
  static getUSDValue(
    price: bigDecimal | undefined,
    amount: BigNumber | undefined,
    decimals: number | undefined
  ): string | undefined {
    if (!price || !amount || !decimals) {
      console.log("somehting is undefined. go out of funtction");
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
