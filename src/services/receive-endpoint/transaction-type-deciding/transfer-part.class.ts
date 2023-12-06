import { ethers } from "ethers";
import { ContractCreation, TransferETH, TypeCheckerTransfer } from "./strategies/transfer-strategies.class";
import { TxTYPE } from "../utils/interfaces";
import Logger from "../../../../utils/logger/winston-logger";

// decides Type of tx from non-events part, which is the eth transfer
export class TxTypeDeciderFromTransfer {
  protected checkersTx: TypeCheckerTransfer[]; // checks based on ethers.Transaction as input
  protected type: TxTYPE;
  private readonly tx: ethers.Transaction;

  constructor(tx: ethers.Transaction) {
    this.tx = tx;
    this.type = TxTYPE.undetermined;
    this.checkersTx = [new ContractCreation(), new TransferETH()];
  }

  public async getType(): Promise<TxTYPE> {
    try {
      await this.determineType();
    } catch (err) {
      Logger.error("Error in getType() in TxTypeDeciderFromTransfer");
      throw err;
    }
    return this.type;
  }

  protected async determineType(): Promise<void> {
    for (const checker of this.checkersTx) {
      try {
        this.type = await checker.checkType(this.tx);
      } catch (err) {
        Logger.error("Error in determineType() in TxTypeDeciderFromTransfer");
        throw err;
      }

      if (this.type != TxTYPE.undetermined) {
        break;
      }
    }
  }
}
