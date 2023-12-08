import { DotenvConfig } from "../../../../config/env.config";

const envConfig = DotenvConfig.getInstance();

export class TextFormatter {
  public static getNameHyperLinkNotify(name: string, address: string): string {
    const network = envConfig.get("BLOCKCHAIN_NETWORK");
    if (network == "mainnet") {
      return `<a href="https://etherscan.io/address/${address}">${name}</a>`;
    }
    return `<a href="https://sepolia.etherscan.io/address/${address}">${name}</a>`;
  }

  public static getTxHashHyperLinkNotify(txHash?: string): string {
    const network = envConfig.get("BLOCKCHAIN_NETWORK");
    if (network == "mainnet") {
      return `<a href="https://etherscan.io/tx/${txHash}">View Transaction on Explorer</a>`;
    }
    return `<a href="https://sepolia.etherscan.io/tx/${txHash}">View Transaction on Explorer</a>`;
  }

  public static getBold(msg: string): string {
    return `<b>${msg}</b>`;
  }

  public static getMonoSpace(msg?: string): string {
    return `<code>${msg}</code>`;
  }
}
