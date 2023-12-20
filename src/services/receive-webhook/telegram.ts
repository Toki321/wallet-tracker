import { txtype } from "./decide-type";
import { IBuyInfo, IReceiveETH, ISellInfo, ISendETH } from "./extract-data";
import { getNameHyperLinkNotify, getTxHashHyperLinkNotify } from "./utils/text-utils";

// 🟢🔴

export async function notifyTelegram(data: IBuyInfo | ISellInfo | ISendETH | IReceiveETH, type: txtype): Promise<string> {
  let line1, line2, line3, line4;
  let nameHyperLink = "";
  switch (type) {
    case "BUY":
      console.log("Entered BUY in notifyTelegram");
      data = data as IBuyInfo;

      nameHyperLink = getNameHyperLinkNotify(data.traderName, data.traderAddress);
      line1 = `🟢 <b>BUY ALERT</b> - ${nameHyperLink}`;

      line2 = `💰 Bought <b>${data.ethAmount}</b> (${data.usdAmount}$) for <b>${data.tokenAmount} ${data.tokenSymbol}</b> - (Buy #${data.buyCount})`;

      line3 = `<b>${data.tokenSymbol}:</b> <code>${data.traderAddress}</code>`;

      line4 = getTxHashHyperLinkNotify(data.txHash);

      return line1 + "\n" + line2 + "\n" + line3 + "\n" + line4;
    case "SELL":
      console.log("Entered SELL in notifyTelegram");
      data = data as ISellInfo;

      nameHyperLink = getNameHyperLinkNotify(data.traderName, data.traderAddress);
      line1 = `🟢 <b>BUY ALERT</b> - ${nameHyperLink}`;

      line2 = `💰 Bought <b>${data.ethAmount}</b> (${data.usdAmount}$) for <b>${data.tokenAmount} ${data.tokenSymbol}</b> - (Buy #${data.buyCount})`;

      line3 = `<b>${data.tokenSymbol}:</b> <code>${data.traderAddress}</code>`;

      line4 = getTxHashHyperLinkNotify(data.txHash);

      return line1 + "\n" + line2 + "\n" + line3 + "\n" + line4;

      break;
    case "RECEIVEETH":
      // Handle RECEIVEETH transaction
      console.log("Handling RECEIVEETH transaction");
      break;
    case "SENDETH":
      // Handle SENDETH transaction
      console.log("Handling SENDETH transaction");
      break;
  }
}
