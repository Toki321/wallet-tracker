import { IDecideTypeResult } from "./decide-type";
import {
  calculatePnLPercentage,
  ethAmountToUsd,
  getPercentage,
  getSoldETH,
  getTokenInfoBuy,
  getTokenInfoSell,
  weiToEther,
} from "./utils/utils";
import { ITrader, TokenPositionModel, TraderModel } from "../../db/notify.model";

export interface IBuyInfo {
  ethAmount: number;
  usdAmount: number;
  tokenAddress: string;
  tokenSymbol: string;
  tokenAmount: string;
  tokenPrice: number;
  buyCount: number;
  txHash: string;
  traderName: string;
  traderAddress: string;
}

export interface ISellInfo {
  ethAmount: number;
  usdAmount: number;
  tokenAddress: string;
  tokenSymbol: string;
  tokenAmount: string;
  tokenPrice: number;
  pnl?: number;
  percentSold: number;
  txHash: string;
  traderName: string;
  traderAddress: string;
}

export interface ISendETH {
  ethAmount: number;
  usdAmount: number;
  to: string;
  txHash: string;
  traderName: string;
  traderAddress: string;
}

export interface IReceiveETH {
  ethAmount: number;
  usdAmount: number;
  from: string;
  txHash: string;
  traderName: string;
  traderAddress: string;
}

//todo: erc20 receive and send

export async function getMsgInfo(info: IDecideTypeResult): Promise<IBuyInfo | ISellInfo | IReceiveETH | ISendETH> {
  switch (info.type) {
    case "BUY":
      const buyResult: IBuyInfo = {
        ethAmount: 0,
        usdAmount: 0,
        tokenAddress: "",
        tokenSymbol: "",
        tokenAmount: "",
        tokenPrice: 0,
        buyCount: 0,
        txHash: info.receipt.transactionHash,
        traderName: info.trader.name,
        traderAddress: info.trader.address,
      };
      try {
        const ethAmount = weiToEther(info.transaction.value);
        buyResult.ethAmount = ethAmount;

        const usdAmount = await ethAmountToUsd(ethAmount);
        buyResult.usdAmount = usdAmount;

        const { tokenAddress, symbol, finalAmount, price } = await getTokenInfoBuy(info.receipt.logs, info.trader.address);
        buyResult.tokenAddress = tokenAddress;
        buyResult.tokenSymbol = symbol;
        buyResult.tokenAmount = finalAmount;
        buyResult.tokenPrice = price;

        // proceed with changes to db
        let tokenPosition = info.trader.positions.get(tokenAddress);

        if (!tokenPosition) {
          tokenPosition = new TokenPositionModel({});
          info.trader.positions.set(tokenAddress, tokenPosition);
        }

        tokenPosition.buyCounter++;
        tokenPosition.totalBuyAmountUSD += usdAmount;

        await tokenPosition.save();
        await info.trader.save();

        buyResult.buyCount = tokenPosition.buyCounter;
      } catch (err) {
        console.error("Error in BUY case");
        throw err;
      }

      return buyResult;
    case "SELL":
      const sellResult: ISellInfo = {
        ethAmount: 0,
        usdAmount: 0,
        tokenAddress: "",
        tokenSymbol: "",
        tokenAmount: "",
        tokenPrice: 0,
        percentSold: 0,
        txHash: info.receipt.transactionHash,
        traderName: info.trader.name,
        traderAddress: info.trader.address,
      };

      try {
        const ethAmount = getSoldETH(info.receipt.logs);
        sellResult.ethAmount = ethAmount;

        const usdAmount = await ethAmountToUsd(ethAmount);
        sellResult.usdAmount = usdAmount;

        const { tokenAddress, symbol, finalAmount, price } = await getTokenInfoSell(info.receipt.logs, info.trader.address);
        sellResult.tokenAddress = tokenAddress;
        sellResult.tokenAmount = finalAmount;
        sellResult.tokenSymbol = symbol;
        sellResult.tokenPrice = price;

        // proceed with db changes
        let tokenPosition = info.trader.positions.get(tokenAddress);

        if (!tokenPosition) {
          tokenPosition = new TokenPositionModel({});
          info.trader.positions.set(tokenAddress, tokenPosition);
        }

        tokenPosition.totalSellAmountUSD = usdAmount;

        const percentSold = getPercentage(usdAmount, tokenPosition.totalBuyAmountUSD);
        sellResult.percentSold = percentSold;

        if (percentSold > 95)
          sellResult.pnl = calculatePnLPercentage(tokenPosition.totalBuyAmountUSD, tokenPosition.totalSellAmountUSD);

        await tokenPosition.save();
        await info.trader.save();
      } catch (err) {
        console.error("Errorr in SELL case:");
        throw err;
      }

      return sellResult;
    case "RECEIVEETH":
      const receiveETHResult: IReceiveETH = {
        ethAmount: 0,
        usdAmount: 0,
        from: info.receipt.from,
        txHash: info.receipt.transactionHash,
        traderName: info.trader.name,
        traderAddress: info.trader.address,
      };

      try {
        const ethAmount = weiToEther(info.transaction.value);
        receiveETHResult.ethAmount = ethAmount;

        const usdAmount = await ethAmountToUsd(ethAmount);
        receiveETHResult.usdAmount = usdAmount;
      } catch (err) {
        console.error("Error in RECEIVEETH case");
        throw err;
      }

      return receiveETHResult;

    case "SENDETH":
      const sendETHResult: ISendETH = {
        ethAmount: 0,
        usdAmount: 0,
        to: info.receipt.to,
        txHash: info.receipt.transactionHash,
        traderName: info.trader.name,
        traderAddress: info.trader.address,
      };

      try {
        const ethAmount = weiToEther(info.transaction.value);
        sendETHResult.ethAmount = ethAmount;

        const usdAmount = await ethAmountToUsd(ethAmount);
        sendETHResult.usdAmount = usdAmount;
      } catch (err) {
        console.error("Error in RECEIVEETH case");
        throw err;
      }

      return sendETHResult;
  }

  throw new Error(`The transaction was determined to be of type:  ${info.type} but it entered none of this cases..`);
}
