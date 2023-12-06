import { ethers, providers } from "ethers";
import { DotenvConfig } from "./env.config";
import { eventsAbi } from "../static/events.abi";
import { Alchemy, Network } from "alchemy-sdk";

const envConfig = DotenvConfig.getInstance();

export class NotifyConfig {
  private BASE_URL: string;
  private WEBHOOK_ID: string;
  private ethersProvider: ethers.providers.JsonRpcProvider;
  private alchemySDK: Alchemy;
  public static instance: NotifyConfig;

  private constructor() {
    this.BASE_URL = envConfig.get("NOTIFY_BASE_URL");
    this.WEBHOOK_ID = envConfig.get("WEBHOOK_ID");

    const url = envConfig.get("ETHERS_RPC_URL");
    this.ethersProvider = new ethers.providers.JsonRpcProvider(url);

    const network = envConfig.get("BLOCKCHAIN_NETWORK");
    const notifyToken = envConfig.get("ALCHEMY_TOKEN");

    if (network === "sepolia") {
      this.alchemySDK = new Alchemy({
        authToken: notifyToken,
        network: Network.ETH_SEPOLIA,
      });
    } else {
      this.alchemySDK = new Alchemy({
        authToken: notifyToken,
        network: Network.ETH_MAINNET,
      });
    }
  }

  public getProvider(): providers.JsonRpcProvider {
    return this.ethersProvider;
  }

  public getAlchemyNotifySDK(): Alchemy {
    return this.alchemySDK;
  }

  public getAbiForDecodingLogs(): string[] {
    return eventsAbi;
  }

  public getBaseUrl(): string {
    return this.BASE_URL;
  }

  public getWebhookId(): string {
    return this.WEBHOOK_ID;
  }

  public static getInstance(): NotifyConfig {
    if (!NotifyConfig.instance) {
      NotifyConfig.instance = new NotifyConfig();
    }
    return NotifyConfig.instance;
  }
}
