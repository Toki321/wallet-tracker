import { JsonRpcProvider } from "@ethersproject/providers";
import { Alchemy, Network } from "alchemy-sdk";
import { ethers } from "ethers";
import { ConfigService } from "../../config.service";
import { AbstractNotifyConfig } from "../interfaces";

const envConfig = ConfigService.getInstance();

export class NotifyMainnetConfig extends AbstractNotifyConfig {
  constructor() {
    super();
  }

  getTrackedEOA(): string {
    const address = envConfig.get("REM_ADDRESS");
    return address;
  }

  getProvider(): JsonRpcProvider {
    const url = envConfig.get("MAINNET_RPC_URL");
    return new ethers.providers.JsonRpcProvider(url);
  }

  getAlchemyNotifySDK(): Alchemy {
    return new Alchemy({
      authToken: envConfig.get("ALCHEMY_NOTIFY_TOKEN"),
      network: Network.ETH_MAINNET, // network set here
    });
  }
}
