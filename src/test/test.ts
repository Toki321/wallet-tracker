import { ethers } from "ethers";
import { NotifyConfig } from "../../config/notify.config";
import { ERC20ABI } from "../../static/erc20.abi";

const config = NotifyConfig.getInstance();
const provider = config.getProvider();
