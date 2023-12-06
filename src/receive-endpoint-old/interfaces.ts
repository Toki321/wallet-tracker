import { ethers } from 'ethers';
import bigDecimal from 'js-big-decimal';

export abstract class MessageStrategy {
    abstract getMessageETH(record: IRecordETH): string;
    abstract getMessageERC20(record: IRecordERC20): string;
}

export interface IERC20 {
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
    token: IERC20 | undefined;
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
