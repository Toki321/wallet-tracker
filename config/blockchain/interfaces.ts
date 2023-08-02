import { Alchemy } from "alchemy-sdk";
import { ethers } from "ethers";
import { ERC20ABI } from "../../src/static/erc20abi";

export interface IBlockchainConfigFactory {
  getNotifyConfig(): AbstractNotifyConfig;
}

export abstract class AbstractNotifyConfig {
  public ERC20ABI = ERC20ABI;

  abstract getProvider(): ethers.providers.JsonRpcProvider;
  abstract getAlchemyNotifySDK(): Alchemy;
  abstract getTrackedEOA(): string;
}
