import { ethers, providers } from "ethers";
import { TypeCheckerTransfer } from "./transfer-strategies.class";
import { TxTYPE } from "../../utils/interfaces";

export abstract class TypeCheckerEvent {
  abstract checkType(log: providers.Log): TxTYPE;
}

export class Approval extends TypeCheckerTransfer {
  private readonly approvalFunctionSignature = "0x095ea7b3";

  checkType(tx: ethers.Transaction): TxTYPE {
    if (tx.data.startsWith(this.approvalFunctionSignature)) {
      return TxTYPE.approval;
    }
    return TxTYPE.undetermined;
  }
}

export class TransferERC20 extends TypeCheckerTransfer {
  private readonly transferFunctionSignature = "0xa9059cbb";

  checkType(tx: ethers.Transaction): TxTYPE {
    if (tx.data.startsWith(this.transferFunctionSignature)) {
      return TxTYPE.transfer;
    }
    return TxTYPE.undetermined;
  }
}

export class Swap extends TypeCheckerEvent {
  private readonly swapEventSignatureV2 = "0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822"; //V2 signature
  private readonly swapEventSignatureV3 = "0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67"; //V3 signature

  checkType(log: providers.Log): TxTYPE {
    if (log.topics[0] == this.swapEventSignatureV2 || log.topics[0] == this.swapEventSignatureV3) {
      return TxTYPE.swap;
    }
    return TxTYPE.undetermined;
  }
}

export class AddLiq extends TypeCheckerEvent {
  private readonly mintEventSignatureV2 = "0x4c209b5fc8ad50758f13e2e1088ba56a560dff690a1c6fef26394f4c03821c4f"; // v2

  checkType(log: providers.Log): TxTYPE {
    if (log.topics[0] === this.mintEventSignatureV2) {
      return TxTYPE.addLiq;
    }
    return TxTYPE.undetermined;
  }
}

export class BurnLiq extends TypeCheckerEvent {
  private readonly burnEventSignatureV2 = "0xdccd412f0b1252819cb1fd330b93224ca42612892bb3f4f789976e6d81936496"; // v2

  checkType(log: providers.Log): TxTYPE {
    if (log.topics[0] === this.burnEventSignatureV2) {
      return TxTYPE.burnLiq;
    }
    return TxTYPE.undetermined;
  }
}

// const ApprovalClass = new Approval();
// const tx = BlockchainConfigFactory.getInstance()
//     .NOTIFY_CONFIG.getProvider()
//     .getTransaction('0x498dd97b9ea7cb50f66e82761521ddd5914f9daa8455cd3204f473dca1d2b06e')
//     .then(tx => console.log(ApprovalClass.checkType(tx)))
//     .catch(err => console.log(err));
