import { ethers } from "ethers";
import bigDecimal from "js-big-decimal";

export abstract class MessageStrategy {
  abstract getMessageETH(record: IRecordETH): string;
  abstract getMessageERC20(record: IRecordERC20): string;
}

export interface ITokenInfo {
  address: string | undefined;
  name: string | undefined;
  symbol: string | undefined;
  price: bigDecimal | undefined;
  decimals?: number | undefined;
}

export interface LogInfo {
  decodedLog: ethers.utils.LogDescription;
  tokenAddress: string;
}

export enum TYPE {
  sent,
  received,
}

export interface IRecordERC20 {
  type: TYPE;
  from: string;
  to: string;
  token: ITokenInfo | undefined;
  amount: string;
  valueUSD: string | undefined;
}

export interface IRecordETH {
  type: TYPE;
  from: string | undefined;
  to: string | undefined;
  amount: string;
  valueUSD: string | number | undefined;
}

export interface IRecordApproval {
  token: ITokenInfo | undefined;
  owner: string;
  spender: string;
  amount: string;
}

export enum TxTYPE {
  undetermined = "UNDETERMINED",
  swap = "SWAP",
  transfer = "TRANSFER",
  burnLiq = "REMOVE LIQUIDITY",
  addLiq = "ADD LIQUIDITY",
  approval = "APPROVAL",
  contractCreation = "CONTRACT CREATION",
}

export interface IUserNotify {
  chatId: string;
  txTypes: TxTYPE[];
}
