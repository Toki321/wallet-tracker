import { Alchemy } from "alchemy-sdk";
import { ethers } from "ethers";

export interface IBlockchainConfigFactory {
  getNotifyConfig(): AbstractNotifyConfig;
}

export abstract class AbstractNotifyConfig {
  abstract getProvider(): ethers.providers.JsonRpcProvider;
  abstract getAlchemyNotifySDK(): Alchemy;
}
