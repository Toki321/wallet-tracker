import { ethers, providers } from "ethers";
import { TxTypeDeciderFromTransfer } from "./transfer-part.class";
import { AddLiq, Approval, BurnLiq, Swap, TransferERC20, TypeCheckerEvent } from "./strategies/events-strategies.class";
import { TxTYPE } from "../utils/interfaces";

export class TxTypeDeciderFromEvents extends TxTypeDeciderFromTransfer {
  receipt: providers.TransactionReceipt;
  checkersLog: TypeCheckerEvent[];

  constructor(tx: ethers.Transaction, receipt: providers.TransactionReceipt) {
    super(tx);
    this.receipt = receipt;

    this.checkersTx.pop(); //? todo make this better
    this.checkersTx.push(new Approval(), new TransferERC20());

    // these check the event logs
    this.checkersLog = [new Swap(), new AddLiq(), new BurnLiq()];
  }

  public async getType(): Promise<TxTYPE> {
    try {
      await this.determineType();
    } catch (err) {
      console.error("Err in getType in TxTypeDeciderFromEvents");
    }

    return this.type;
  }

  protected async determineType(): Promise<void> {
    try {
      await super.determineType(); // get type if it's possible from transfer

      if (this.type == TxTYPE.undetermined) {
        this.determineTypeFromLogs();
      }
    } catch (err) {
      console.error("Err in deterimneType in TxTypeDeciderFromEvents");
    }

    if (this.type != TxTYPE.undetermined) {
      return;
    }
  }

  private determineTypeFromLogs() {
    for (const checker of this.checkersLog) {
      this.checkLogs(checker);

      if (this.type != TxTYPE.undetermined) {
        break;
      }
    }
  }

  private async checkLogs(checker: TypeCheckerEvent) {
    const logs = this.receipt.logs;
    for (const log of logs) {
      this.type = checker.checkType(log);
    }
  }

  // add special checkers for events
  // checkers should be with different input in the abstract class
}
