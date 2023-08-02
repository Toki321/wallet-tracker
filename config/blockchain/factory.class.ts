import { ConfigService } from "../config.service";
import { AbstractNotifyConfig, IBlockchainConfigFactory } from "./interfaces";
import { NotifyMainnetConfig } from "./notify-configs/mainnet.class";
import { NotifySepoliaConfig } from "./notify-configs/sepolia.class";

const envConfig = ConfigService.getInstance();

// singleton factory
export class BlockchainConfigFactory implements IBlockchainConfigFactory {
  private static instance: BlockchainConfigFactory;
  public NOTIFY_CONFIG!: AbstractNotifyConfig;
  private NOTIFY_NETWORK = envConfig.get("NOTIFY_NETWORK");

  private constructor() {
    if (this.NOTIFY_NETWORK == "mainnet") this.NOTIFY_CONFIG = new NotifyMainnetConfig();
    else if (this.NOTIFY_NETWORK == "sepolia") this.NOTIFY_CONFIG = new NotifySepoliaConfig();
  }

  public static getInstance(): BlockchainConfigFactory {
    if (!this.instance) {
      this.instance = new BlockchainConfigFactory();
    }
    return this.instance;
  }

  getNotifyConfig(): AbstractNotifyConfig {
    return this.NOTIFY_CONFIG;
  }
}
