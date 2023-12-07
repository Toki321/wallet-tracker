import { ethers } from "ethers";
import { TxTYPE } from "../../utils/interfaces";
import { NotifyConfig } from "../../../../../config/notify.config";
import Logger from "../../../../utils/logger/winston-logger";

const provider = NotifyConfig.getInstance().getProvider();

export abstract class TypeCheckerTransfer {
  abstract checkType(tx: ethers.Transaction): TxTYPE | Promise<TxTYPE>;
}

export class ContractCreation extends TypeCheckerTransfer {
  public checkType(tx: ethers.Transaction): TxTYPE {
    if (tx.to == null) {
      return TxTYPE.contractCreation;
    }
    return TxTYPE.undetermined;
  }
}

export class TransferETH extends TypeCheckerTransfer {
  public async checkType(tx: ethers.Transaction): Promise<TxTYPE> {
    // console.log('\nEnter TransferETH:');
    // console.log('\nEtx: ', tx);
    let areBothEOA;
    try {
      areBothEOA = await this.isEOAtoEOA(tx.from, tx.to);
    } catch (err) {
      Logger.error("Error in checkType:");
      throw err;
    }
    // console.log('areBothEOA ', areBothEOA);
    // console.log('Leave TransferETH\n');
    if (areBothEOA) {
      return TxTYPE.transfer;
    }
    return TxTYPE.undetermined;
  }

  private async isEOAtoEOA(from?: string, to?: string): Promise<boolean> {
    // console.log('\nEnter isEOAtoEOA:');
    // console.log('from:', from);
    // console.log('to:', to);
    if (!from || !to) {
      return false;
    }

    let codeFrom, codeTo;
    try {
      [codeFrom, codeTo] = await Promise.all([provider.getCode(from), provider.getCode(to)]);
    } catch (err) {
      Logger.error("Error in isEOAtoEOA:");
      throw err;
    }

    const isEOAtoEOA = codeFrom == "0x" && codeTo == "0x";
    return isEOAtoEOA;
  }
}
