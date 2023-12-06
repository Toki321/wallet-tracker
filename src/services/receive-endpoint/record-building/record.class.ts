import { IRecordApproval, IRecordERC20, IRecordETH, TxTYPE } from "../utils/interfaces";

// data to send to telegram for one transaction.
// this object is built up during the analysis of a tx (builder pattern).
// once built up, a TelegramMessenger is created with the object as input
// the TelegramMessenger gets data from this and notifies user
export class TransactionRecord {
  ERC20Records: IRecordERC20[] = [];
  ETHRecords: IRecordETH[] = [];
  ApprovalRecord?: IRecordApproval;
  txHash?: string;
  trackedEOA!: string;
  type: TxTYPE = TxTYPE.undetermined;
  deployedContractAddress?: string;

  constructor(txHash?: string) {
    this.txHash = txHash;
  }

  addERC20Record(record: IRecordERC20) {
    this.ERC20Records.push(record);
  }

  addETHRecord(record: IRecordETH) {
    this.ETHRecords.push(record);
  }

  setTrackedEOA(trackedEOA: string) {
    this.trackedEOA = trackedEOA;
  }

  setType(type: TxTYPE) {
    this.type = type;
  }

  setApprovalRecord(record: IRecordApproval): void {
    this.ApprovalRecord = record;
  }

  setDeployedContractAddress(address: string): void {
    this.deployedContractAddress = address;
  }

  // combinePartialERC20Transfers(): void {}
}
