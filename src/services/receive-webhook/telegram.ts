import axios from "axios";
import { DotenvConfig } from "../../../config/env.config";
import { txtype } from "./decide-type";
import { IBuyInfo, IReceiveETH, ISellInfo, ISendETH } from "./extract-data";
import { getNameHyperLinkNotify, getTxHashHyperLinkNotify } from "./utils/text-utils";

export async function notifyChannel(message: string) {
  console.log("Entered notifyChannel");
  console.log("message for notifying:", message);

  const dotenv = DotenvConfig.getInstance();

  const channelId = dotenv.get("TG_GROUP_CHAT_ID");
  const botToken = dotenv.get("BOT_TOKEN");

  try {
    await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: channelId,
      text: message,
      disable_web_page_preview: true,
      parse_mode: "HTML",
    });
  } catch (err) {
    console.error("Error in notifyChannel function..");
    throw err;
  }
}

export async function getMessageForTelegram(data: IBuyInfo | ISellInfo | ISendETH | IReceiveETH, type: txtype): Promise<string> {
  let line1, line2, line3, line4, line5;
  let nameHyperLink = "";

  switch (type) {
    case "BUY":
      console.log("Entered BUY in notifyTelegram");
      data = data as IBuyInfo;

      nameHyperLink = getNameHyperLinkNotify(data.traderName, data.traderAddress);
      line1 = `🟢 <b>BUY ALERT</b> - ${nameHyperLink}`;

      line2 = `💰 Bought <b>${data.tokenAmount} ${data.tokenSymbol}</b> @${data.tokenPrice.toFixed(4)}$ for <b>${data.ethAmount}</b> ETH (${data.usdAmount}$)  - (Buy #${data.buyCount})`;

      line3 = `<b>${data.tokenSymbol}:</b> <code>${data.tokenAddress}</code>`;

      line4 = getTxHashHyperLinkNotify(data.txHash);

      return line1 + "\n\n" + line2 + "\n\n" + line3 + "\n\n" + line4;
    case "SELL":
      console.log("Entered SELL in notifyTelegram");
      data = data as ISellInfo;

      nameHyperLink = getNameHyperLinkNotify(data.traderName, data.traderAddress);
      line1 = `🔴 <b>SELL ALERT</b> - ${nameHyperLink}`;

      line2 = `💰 Sold <b>${data.tokenAmount} ${data.tokenSymbol}</b> @${data.tokenPrice.toFixed(4)}$ for ${data.ethAmount} ETH (${data.usdAmount}$)`; // need price here

      line3 = `Accounting for ${data.percentSold}% of his entire ${data.tokenSymbol} position`;

      line4 = `<b>${data.tokenSymbol}:</b> <code>${data.tokenAddress}</code>`;

      line5 = getTxHashHyperLinkNotify(data.txHash);

      return line1 + "\n\n" + line2 + "\n\n" + line3 + "\n\n" + line4 + "\n\n" + line5;

    case "RECEIVEETH":
      console.log("Entered RECEIVEETH in notifyTelegram");
      data = data as IReceiveETH;

      nameHyperLink = getNameHyperLinkNotify(data.traderName, data.traderAddress);
      line1 = `🤑 <b>TRANSFER ALERT</b> - ${nameHyperLink}`;

      line2 = `Received <b>${data.ethAmount} ETH</b> (${data.usdAmount}$)`;

      line3 = `from <code>${data.from}</code>`;

      line4 = getTxHashHyperLinkNotify(data.txHash);

      return line1 + "\n\n" + line2 + "\n\n" + line3 + "\n\n" + line4;

    case "SENDETH":
      console.log("Entered SENDETH in notifyTelegram");
      data = data as ISendETH;

      nameHyperLink = getNameHyperLinkNotify(data.traderName, data.traderAddress);
      line1 = `💸 <b>TRANSFER ALERT</b> - ${nameHyperLink}`;

      line2 = `Sent <b>${data.ethAmount} ETH</b> (${data.usdAmount}$)`;

      line3 = `to <code>${data.to}</code>`;

      line4 = getTxHashHyperLinkNotify(data.txHash);

      return line1 + "\n\n" + line2 + "\n\n" + line3 + "\n\n" + line4;
  }

  throw new Error("Error, no switch case was entered in getMessageForTelegram");
}
