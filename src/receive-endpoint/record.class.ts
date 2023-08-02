import { IRecordERC20, IRecordETH } from './interfaces';

// data to send to telegram for one transaction.
// this object is built up during the analysis of a tx (simple builder pattern).
// once built up, a TelegramMessenger is created with the object as input
// the TelegramMessenger gets data from this and notifies user
export class TransactionRecord {
    ERC20Records: IRecordERC20[] = [];
    ETHRecords: IRecordETH[] = [];
    txHash!: string;
    trackedEOA!: string;

    addERC20Record(record: IRecordERC20) {
        this.ERC20Records.push(record);
    }

    addETHRecord(record: IRecordETH) {
        this.ETHRecords.push(record);
    }

    setTxHash(txHash: string): void {
        this.txHash = txHash;
    }

    setTrackedEOA(trackedEOA: string): void {
        this.trackedEOA = trackedEOA;
    }

    // combinePartialERC20Transfers(): void {}
}
