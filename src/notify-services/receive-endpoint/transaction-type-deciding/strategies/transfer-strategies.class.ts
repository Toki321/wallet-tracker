import { ethers, providers } from 'ethers';
// import { TxTYPE } from '../../../../database/models/notify.model';
import { BlockchainConfigFactory } from '../../../../../../../config/blockchain/factory.class';
import { TxTYPE } from '../../../../../../../utils/interfaces/notify.interface';
import Logger from '../../../../../../../utils/logger/winston-logger';

const factory = BlockchainConfigFactory.getInstance();
const provider = factory.NOTIFY_CONFIG.getProvider();

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
            Logger.error('Error in checkType:');
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
            Logger.error('Error in isEOAtoEOA:');
            throw err;
        }

        // console.log('codeFrom: ', codeFrom);
        // console.log('codeTo: ', codeTo);

        const isEOAtoEOA = codeFrom == '0x' && codeTo == '0x';
        // console.log('isEOAtoEOA result: ', isEOAtoEOA);
        // console.log('Leave isEOAtoEOA\n');
        return isEOAtoEOA;
    }
}

// const ApprovalClass = new Approval();
// const tx = BlockchainConfigFactory.getInstance()
//     .NOTIFY_CONFIG.getProvider()
//     .getTransaction('0x498dd97b9ea7cb50f66e82761521ddd5914f9daa8455cd3204f473dca1d2b06e')
//     .then(tx => console.log(ApprovalClass.checkType(tx)))
//     .catch(err => console.log(err));
