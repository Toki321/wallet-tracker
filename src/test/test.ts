import { ethers } from "ethers";
import { NotifyConfig } from "../../config/notify.config";
import { ERC20ABI } from "../../static/erc20.abi";

const config = NotifyConfig.getInstance();
const provider = config.getProvider();

async function getSymbolDecimals(address: string) {
  try {
    const contract = new ethers.Contract(address, ERC20ABI, provider);
    const [decimals, symbol] = await Promise.all([contract.decimals(), contract.symbol()]);
    return { decimals, symbol };
  } catch (err) {
    throw err;
  }
}

getSymbolDecimals("0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984")
  .then((res) => console.log(res))
  .catch((err) => console.log(err));
