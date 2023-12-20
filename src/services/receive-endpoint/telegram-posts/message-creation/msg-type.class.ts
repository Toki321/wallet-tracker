import { TransactionRecord } from "../../record-building/record.class";
import { TextFormatter } from "../../utils/format-text.class";
import { IRecordApproval, TYPE, TxTYPE } from "../../utils/interfaces";
import Logger from "../../../../utils/logger/winston-logger";
import { ITokenPosition, TokenPositionModel, TraderModel } from "../../../../db/notify.model";
import { TokenInfoFetcher } from "../../utils/tokenInfoFetcher.class";

export abstract class TypeDependantMessage {
  abstract getMessage(record: TransactionRecord): string | Promise<string>;
}

export class ApprovalMessage extends TypeDependantMessage {
  getMessage(record: TransactionRecord): string {
    if (record.type == TxTYPE.approval) {
      const approvalRecord: IRecordApproval | undefined = record.ApprovalRecord;
      const spender = TextFormatter.getMonoSpace(approvalRecord?.spender);
      if (!approvalRecord) {
        throw new Error("The tx has been determined as Approval, but the ApprovalRecord is undefined");
      }
      return `\nHas approved a spending of ${approvalRecord.amount} to ${spender}`;
    }

    return "";
  }
}

export class ContractCreationMessage extends TypeDependantMessage {
  getMessage(record: TransactionRecord): string {
    if (record.type == TxTYPE.contractCreation) {
      const contractAddress = TextFormatter.getMonoSpace(record.deployedContractAddress);

      if (!contractAddress) {
        Logger.error("Could not determine the address of the contract");
      }
      return `\nHas deployed a contract at ${contractAddress}`;
    }

    return "";
  }
}

export class SwapMessage extends TypeDependantMessage {
  // eth amount
  // usd amount of the ETH
  // token name
  // if buy Number of buy | if sell - how much % remaining from the all prev buys amount
  // token contract address (clickable)
  async getMessage(record: TransactionRecord): Promise<string> {
    let message: string = "";

    // if this is not a swap just return empty string
    if (record.type !== TxTYPE.swap) {
      return message;
    }

    const ethRecord = record.ETHRecords[0];
    const erc20Record = record.ERC20Records[0];

    const trader = await TraderModel.findOne({ address: record.trackedEOA });
    if (!trader) {
      throw new Error("Trader not found");
    }

    if (!erc20Record.token) throw new Error("No token");

    const tokenAddress = erc20Record.token.address;
    if (!tokenAddress) throw new Error("No token address");

    const erc20Fetcher = new TokenInfoFetcher(tokenAddress);
    const holdings = await erc20Fetcher.getHoldings(record.trackedEOA);
    console.log("holdings:", holdings);

    let tokenPosition = trader.positions.get(tokenAddress);
    if (!tokenPosition) {
      tokenPosition = new TokenPositionModel({ totalBuyAmount: holdings });
      trader.positions.set(tokenAddress, tokenPosition);
    }

    // if it sends ETH it means a BUY
    if (record.ETHRecords[0].type == TYPE.sent && record.ERC20Records[0].type == TYPE.received) {
      tokenPosition.buyCounter++;
      if (tokenPosition.buyCounter !== 1) {
        tokenPosition.totalBuyAmount += Number(erc20Record.amount);
      }
      if (holdings) tokenPosition.currentHoldings = holdings;

      message = `\n🟢 Buy: ${ethRecord.amount} (${ethRecord.valueUSD}$) worth of ${erc20Record.token?.name} @${erc20Record.amount} - (Buy #${tokenPosition.buyCounter})`;
    } else if (record.ETHRecords[0].type == TYPE.received && record.ERC20Records[0].type == TYPE.sent) {
      let remainingPercent;
      if (holdings) {
        tokenPosition.currentHoldings = holdings;
        if (holdings === 0) remainingPercent = 0;
        else {
          remainingPercent = (tokenPosition.totalBuyAmount / holdings) * 100;
          remainingPercent = remainingPercent.toFixed(0);
          remainingPercent = Number(remainingPercent);
        }
      }

      message = `\n🔴 Sell: ${ethRecord.amount} (${ethRecord.valueUSD}$) worth of ${erc20Record.token?.name} @${erc20Record.amount} - (${remainingPercent}% remaining)`;
    }

    await tokenPosition.save();
    await trader.save();

    return message;
  }
}
