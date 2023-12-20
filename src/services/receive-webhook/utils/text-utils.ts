import { DotenvConfig } from "../../../../config/env.config";

const envConfig = DotenvConfig.getInstance();

const network = envConfig.get("BLOCKCHAIN_NETWORK");

export function getNameHyperLinkNotify(name: string, address: string): string {
  if (network == "mainnet") {
    return `<a href="https://etherscan.io/address/${address}">${name}</a>`;
  }
  return `<a href="https://sepolia.etherscan.io/address/${address}">${name}</a>`;
}

export function getTxHashHyperLinkNotify(txHash: string): string {
  if (network == "mainnet") {
    return `<a href="https://etherscan.io/tx/${txHash}">View Transaction on Explorer</a>`;
  }
  return `<a href="https://sepolia.etherscan.io/tx/${txHash}">View Transaction on Explorer</a>`;
}
