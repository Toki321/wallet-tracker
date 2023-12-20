import { ethers } from "ethers";
import { NotifyConfig } from "../../../../config/notify.config";

const config = NotifyConfig.getInstance();
const provider = config.getProvider();

export async function isERC20Contract(address: string): Promise<boolean> {
  try {
    const contract = new ethers.Contract(
      address,
      [
        "function totalSupply() view returns (uint256)",
        "function balanceOf(address) view returns (uint)",
        "function transfer(address, uint) returns (bool)",
      ],
      provider
    );

    // Attempt to call a method to verify if it's an ERC-20 contract
    await contract.totalSupply();

    return true;
  } catch (error) {
    return false;
  }
}
