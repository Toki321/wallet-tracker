import { ITrader, TraderModel } from "../../db/notify.model";
import { NotifyConfig } from "../../../config/notify.config";
import { ethers } from "ethers";
import { isERC20Contract } from "./utils/utils";

type txtype = "BUY" | "SELL" | "RECEIVEETH" | "SENDETH" | "SENDTOKEN" | "RECEIVETOKEN";

const config = NotifyConfig.getInstance();
const provider = config.getProvider();

interface IDecideTypeResult {
  type: txtype;
  trackedTrader: string; // address
}

async function decideType(alchemyTransaction: any): Promise<IDecideTypeResult> {
  // fetch with ethers.js for more consistent and better outlook on the tx data
  console.log("Fetching ethers Transaction and Receipt");
  try {
    const [tx, receipt] = await Promise.all([
      provider.getTransaction(alchemyTransaction.hash),
      provider.getTransactionReceipt(alchemyTransaction.hash),
    ]);

    // if it's a contract deployment this is null I think, hence irrelevant
    if (!tx.to) throw new Error("Tx.to is null so this tx is of no interest");

    // get the trader we are tracking. will throw error if to and from arent tracked
    const trader = await getTrader(receipt);

    const code = await provider.getCode(tx.to);

    // is to address a contract?
    if (code !== "0x") {
      console.log(`to address aka ${tx.to} is a contract!`);

      const isERC20 = await isERC20Contract(tx.to);
      console.log(`The tx.to is an ERC20: ${isERC20}`);

      // if it's an interaction with an erc20 contarct check if sending or receiving tokens, those are the only options
      if (isERC20) {
        const decodedLog = decodeToTransferEvent(receipt.logs[0]);
        if (decodedLog !== null) {
          // if it's an interaction with an erc20 and the tracked trader isn't found out yet then it's possible that the tracked trader is receing erc20 tokens which would mean he is in to field on a transfer Event and not found in to or from on tx data
          // if trader is undefined it means there is 1 log event and we should check if it's a transfer event
          if (trader === undefined) {
            // if it's not null then it's a Transfer event with a to and from..
            // if to address in the event is trader then this means he's receing erc20 tokens..
            const trader = await TraderModel.findOne({ address: decodedLog.args[1] });

            if (trader) {
              return { type: "RECEIVETOKEN", trackedTrader: trader.address };
            } else {
              throw new Error(`tracked address isn't even in the event of transfer to address, no tracked address found, exit`);
            }

            // else if tracked address is the from, check if it's sending erc20 tokens..
          } else if (trader.address === tx.from && trader.address === decodedLog.args[2])
            return { type: "SENDTOKEN", trackedTrader: tx.from };
        }

        // if not an erc20 but a contract.. check if there is log where
      } else {
        // if there are events
        if (receipt.logs.length !== 0) {
          // loop all events and check if there is a 'swap' event on v2 or v3
          if (isThereSwapEvent(receipt.logs) === true) {
            // now determine if it's a buy or sell...
            // if eth is sent in the tx then it's BUY, else a sell
            if (tx.value.toString() === "0") return { type: "SELL", trackedTrader: tx.from };
            return { type: "BUY", trackedTrader: tx.from };
          }
        }
      }
      // else if tx.to is an EOA
    } else {
      if (trader === undefined)
        throw new Error(`To address isn't a contract and no tracked EOA was found in from or to addresses.. Exiting gracefully`);

      if (trader.address === tx.from) return { type: "SENDETH", trackedTrader: tx.from };
      if (trader.address === tx.to) return { type: "RECEIVEETH", trackedTrader: tx.to };
    }

    throw new Error(`After whole analysis no tracked address was found in the transaction! Exiting gracefully..`);
  } catch (err) {
    console.error("err in decideType");
    throw err;
  }
}

async function getTrader(receipt: ethers.providers.TransactionReceipt): Promise<ITrader | undefined> {
  console.log("entering getTrader");

  const traderFromPromise = TraderModel.findOne({ address: receipt.from }).exec();
  const traderToPromise = TraderModel.findOne({ address: receipt.to }).exec();

  const [traderFrom, traderTo] = await Promise.all([traderFromPromise, traderToPromise]);
  console.log("Fetched traderFrom of db", traderFrom);
  console.log("Fetched traderTo of db", traderTo);

  if (traderFrom) {
    console.log(`from address is tracked, returning traderFrom and exiting getTrader`);
    return traderFrom;
  }
  if (traderTo) {
    console.log(`to address is tracked, returning traderTo and exiting getTrader`);
    return traderTo;
  }

  // if there are events check for Transfer events
  if (receipt.logs.length === 1) return undefined;

  throw new Error(
    `from and to address in this transaction are not in db AND number of events fired isn't 1 (which means it's not a erc20 transfer), hence not tracked`
  );
}

function decodeToTransferEvent(log: ethers.providers.Log): ethers.utils.LogDescription | null {
  const transferEventAbi = "event Transfer(address indexed from, address indexed to, uint256 value)";

  const iface = new ethers.utils.Interface([transferEventAbi]);
  let decodedLog;

  try {
    decodedLog = iface.parseLog(log);
  } catch (err) {
    // this means it's not a Transfer so we put null
    decodedLog = null;
  }

  return decodedLog;
}

function isThereSwapEvent(logs: ethers.providers.Log[]) {
  const swapEventSignatureV2 = "0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822";
  const swapEventSignatureV3 = "0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67";

  for (const log of logs) {
    // first topic is always event signature..
    if (log.topics[0] == swapEventSignatureV2 || log.topics[0] == swapEventSignatureV3) return true;
  }
  return false;
}
