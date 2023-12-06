import { ethers } from 'ethers';
import { TransactionRecord } from './record.class';
import { IRecordETH, TYPE } from '../utils/interfaces';

import { RecordBuilder } from './builder.class';

// This gets data from the non - events, normal transfer of ETH part and adds it to the TransactionRecord
export class ETHRecordBuilder extends RecordBuilder {
    tx: ethers.Transaction;

    constructor(tx: ethers.Transaction, trackedEOA: string) {
        super(trackedEOA);
        this.tx = tx;
    }

    async build(record: TransactionRecord): Promise<TransactionRecord> {
        const { from, to, value } = this.tx;

        // if 0 ETH was transferred then we have no interest in this part of the Transaction
        if (value.toString() == '0') return record;

        if (from == this.trackedEOA) {
            const recordToAdd = await this.buildETHRecord(TYPE.sent);
            record.addETHRecord(recordToAdd);
        } else if (to == this.trackedEOA) {
            const recordToAdd = await this.buildETHRecord(TYPE.received);
            record.addETHRecord(recordToAdd);
        }
        return record;
    }

    private async buildETHRecord(type: TYPE): Promise<IRecordETH> {
        const amountWei = this.tx.value;
        const from = this.tx.from;
        const to = this.tx.to;
        const amountETH = this.formatWeiToETH(amountWei);
        const valueUSD = await this.getUSDValueFromETHTransfer(amountWei);
        const record = this.createETHRecord(type, from, to, amountETH, valueUSD);
        return record;
    }
}
