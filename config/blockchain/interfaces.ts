import { Alchemy } from "alchemy-sdk";
import { ethers } from "ethers";
import { ERC20ABI } from "../../src/static/erc20.abi";
import { eventsAbi } from "../../src/static/events.abi";

export interface IBlockchainConfigFactory {
  getNotifyConfig(): AbstractNotifyConfig;
}

export abstract class AbstractNotifyConfig {
  public ERC20ABI = ERC20ABI;
  public eventsABI = eventsAbi;

  abstract getProvider(): ethers.providers.JsonRpcProvider;
  abstract getAlchemyNotifySDK(): Alchemy;
  abstract getTrackedEOA(): string;
}
