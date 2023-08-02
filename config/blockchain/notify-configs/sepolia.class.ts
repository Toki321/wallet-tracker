import { JsonRpcProvider } from "@ethersproject/providers";
import { Alchemy, Network } from "alchemy-sdk";
import { AbstractNotifyConfig } from "../interfaces";
import { ethers } from "ethers";
import { ConfigService } from "../../config.service";

const envConfig = ConfigService.getInstance();

export class NotifySepoliaConfig extends AbstractNotifyConfig {
  constructor() {
    super();
  }

  getTrackedEOA(): string {
    const address = envConfig.get("TOKI_SEPOLIA_ADDRESS");
    return address;
  }

  getProvider(): JsonRpcProvider {
    const url = envConfig.get("SEPOLIA_RPC_URL");
    return new ethers.providers.JsonRpcProvider(url);
  }

  getAlchemyNotifySDK(): Alchemy {
    return new Alchemy({
      authToken: envConfig.get("ALCHEMY_NOTIFY_TOKEN"),
      network: Network.ETH_SEPOLIA,
    });
  }
}
