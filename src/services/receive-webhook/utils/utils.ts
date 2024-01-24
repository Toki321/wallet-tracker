import { BigNumber, ethers, providers, utils } from "ethers";
import { NotifyConfig } from "../../../../config/notify.config";
import { ERC20ABI } from "../../../../static/erc20.abi";
import { DotenvConfig } from "../../../../config/env.config";
import axios from "axios";

const config = NotifyConfig.getInstance();
const provider = config.getProvider();

export async function ethAmountToUsd(amount: number): Promise<number> {
  try {
    // Fetch the current price of ETH in USD from CoinGecko API using Axios
    const response = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd");
    const data = response.data;

    // Extract the ETH price in USD
    const ethPriceInUsd = data.ethereum.usd;
    console.log(`Got usd price of eth with coingecko: ${ethPriceInUsd}`);

    // Calculate the USD value and round it to no decimals
    const usdValue = Math.round(amount * ethPriceInUsd);
    return usdValue;
  } catch (error) {
    console.error("Error fetching ETH price:", error);
    return 0;
  }
}

export async function getTokenInfoBuy(logs: providers.Log[], trader: string) {
  const transferEventAbi = "event Transfer(address indexed from, address indexed to, uint256 value)";

  const iface = new ethers.utils.Interface([transferEventAbi]);

  let tokenAddress = "";
  let tokenAmount = BigNumber.from(0);

  for (const log of logs) {
    try {
      const decodedLog = iface.parseLog(log);
      // if to address of event is tracked address he is receiving tokens from his swap!
      if (decodedLog.args.to === trader) {
        tokenAddress = log.address;
        tokenAmount = tokenAmount.add(decodedLog.args.amount); // is a big number..
      }
    } catch (err) {
      continue;
    }
  }

  const price = await getTokenPrice(tokenAddress);
  const { decimals, symbol } = await getSymbolDecimals(tokenAddress);

  const formattedAmount = ethers.utils.formatUnits(tokenAmount, decimals);
  const finalAmount = parseFloat(formattedAmount).toFixed(4);

  console.log("Exiting getTokenInfoBuy. Got this info:", tokenAddress, finalAmount, symbol, price);

  return { tokenAddress, finalAmount, symbol, price };
}

async function getSymbolDecimals(address: string) {
  try {
    const contract = new ethers.Contract(address, ERC20ABI, provider);
    const [decimals, symbol] = await Promise.all([contract.decimals(), contract.symbol()]);

    return { decimals, symbol };
  } catch (err) {
    throw err;
  }
}

export function getSoldETH(logs: providers.Log[]) {
  const unwrapAbi = ["event Withdrawal(address indexed dst, uint wad)"];

  const iface = new ethers.utils.Interface(unwrapAbi);

  for (const log of logs) {
    // decode for Withdrawal event, which is unwrapping of ETH
    // the V2 router is the src paremeter of this event and there is also no to paremeter in the event
    // above always happens on both v3 and v2 exchanges because user is selling for ETH, so exchange must unwrap weth to eth

    try {
      const decodedLog = iface.parseLog(log);
      const amountWei = decodedLog.args[1];
      return weiToEther(amountWei);
    } catch (err) {
      continue;
    }
  }
  throw new Error("Analysed events looking for WETH withdrawal but could not find one.. Exiting gracefully");
}

export function weiToEther(value: BigNumber): number {
  const eth = ethers.utils.formatEther(value);
  return parseFloat(parseFloat(eth).toFixed(2));
}

export async function getTokenInfoSell(logs: providers.Log[], trader: string) {
  // loop events for Transfer and find the event where from address is tracked trader
  // this would mean that in this Transfer event is the first transfer or erc20 aka the sell, where router calls this trasnferFrom and takes from the EOA
  const transferEventAbi = "event Transfer(address indexed from, address indexed to, uint256 value)";

  const iface = new ethers.utils.Interface([transferEventAbi]);

  let tokenAddress = "";
  let tokenAmount = BigNumber.from(0);

  for (const log of logs) {
    try {
      const decodedLog = iface.parseLog(log);
      console.log("Decoded log:", decodedLog);
      if (decodedLog.args.from === trader) {
        console.log("From address is the same as trader address");
        console.log("Decoded args", decodedLog.args);
        tokenAddress = log.address;
        tokenAmount = tokenAmount.add(decodedLog.args.value);
        console.log("\n added: " + decodedLog.args.value + "\n");
      }
    } catch (err) {
      continue;
    }
  }

  const price = await getTokenPrice(tokenAddress);
  const { decimals, symbol } = await getSymbolDecimals(tokenAddress);

  const formattedAmount = ethers.utils.formatUnits(tokenAmount, decimals);
  const finalAmount = parseFloat(formattedAmount).toFixed(4);

  console.log("Exiting getTokenInfoBuy. Got this info:", tokenAddress, finalAmount, symbol, price);

  return { tokenAddress, finalAmount, symbol, price };
}

export async function getCurrentTokenHoldings(tokenAddress: string, traderAddress: string) {
  try {
    const contract = new ethers.Contract(tokenAddress, ERC20ABI, provider);

    const [balance, decimals] = await Promise.all([contract.balanceOf(traderAddress), contract.decimals()]);

    const formattedBalance = ethers.utils.formatUnits(balance, decimals);

    return parseFloat(parseFloat(formattedBalance).toFixed(2));
  } catch (err) {
    console.error("Error in getCurrentTokenHolding");
    throw err;
  }
}

export function getPercentage(num1: number, num2: number): number {
  if (num2 === 0) return 0;
  const num = (num1 / num2) * 100;
  return Math.round(num);
}

export function calculatePnLPercentage(buyAmountUsd: number, sellAmountUsd: number) {
  if (buyAmountUsd === 0) {
    return 0; // Prevent division by zero if buyAmountUsd is 0
  }
  const pnl = sellAmountUsd - buyAmountUsd;
  const num = (pnl / buyAmountUsd) * 100;
  return Math.round(num);
}

async function getTokenPrice(tokenAddress: string) {
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
    return result.data.data.getTokenPrices[0].priceUsd;
  } catch (err: any) {
    console.log(`Error fetching price for ${tokenAddress}`, err);
    return 0;
  }
}
