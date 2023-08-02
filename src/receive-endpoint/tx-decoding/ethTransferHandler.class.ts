import { ethers, utils } from 'ethers';
import { TransactionRecord } from '../record.class';
import { IRecordETH, TYPE } from '../interfaces';

import { TokenInfoFetcher } from '../../../../utils/tokenInfoFetcher.class';
import { ConfigService } from '../../../../../../config/config.service';

const NATIVE_WRAPPED_TOKEN_ADDRESS = ConfigService.getInstance().get('NATIVE_WRAPPED_TOKEN_ADDRESS');

export class ETHTransferHandler {
    ethersTx: ethers.Transaction;
    trackedEOA: string;

    constructor(ethersTx: ethers.Transaction, trackedEOA: string) {
        this.ethersTx = ethersTx;
        this.trackedEOA = trackedEOA;
    }

    async fillTransactionRecord(record: TransactionRecord): Promise<TransactionRecord> {
        const { from, to, value } = this.ethersTx;
        if (value.toString() == '0') return record;
        if (from == this.trackedEOA) {
            const recordToAdd = await this.createSendRecord();
            record.addETHRecord(recordToAdd);
        } else if (to == this.trackedEOA) {
            const recordToAdd = await this.createReceiveRecord();
            record.addETHRecord(recordToAdd);
        }
        return record;
    }

    private async createSendRecord(): Promise<IRecordETH> {
        const amount = this.ethersTx.value;
        const formattedAmount = parseFloat(utils.formatEther(amount)).toFixed(4);

        const record: IRecordETH = {
            type: TYPE.sent,
            from: this.ethersTx.from,
            to: this.ethersTx.to,
            amount: formattedAmount,
            valueUSD: TokenInfoFetcher.getUSDValue(
                await TokenInfoFetcher.getTokenPrice(NATIVE_WRAPPED_TOKEN_ADDRESS),
                amount,
                18,
            ),
        };
        return record;
    }

    private async createReceiveRecord(): Promise<IRecordETH> {
        const amount = this.ethersTx.value;
        const formattedAmount = parseFloat(utils.formatEther(amount)).toFixed(4);
        const record: IRecordETH = {
            type: TYPE.received,
            from: this.ethersTx.from,
            to: this.ethersTx.to,
            amount: formattedAmount,
            valueUSD: TokenInfoFetcher.getUSDValue(
                await TokenInfoFetcher.getTokenPrice(NATIVE_WRAPPED_TOKEN_ADDRESS),
                amount,
                18,
            ),
        };
        return record;
    }
}
