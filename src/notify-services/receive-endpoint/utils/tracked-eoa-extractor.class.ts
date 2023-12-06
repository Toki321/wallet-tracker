import { ethers } from 'ethers';
import NotifyModel from '../../../../database/models/notify.model';
import { LogInfo } from './interfaces';
import { IUserNotify } from '../../../../../../utils/interfaces/notify.interface';

// handles fethching from db only in relation to /receiveNotification endpoint
// task is to extract the tracked EOA from the given transaction
// one way is from logs and the other from the basic eth transfer(from and to)
// we get tracked EOA from db and then compare with data from txs until we find a match
export class TrackedEOAExtractor {
    private ethersTx: ethers.Transaction;
    private users: IUserNotify[] = [];

    constructor(ethersTx: ethers.Transaction) {
        this.ethersTx = ethersTx;
    }

    /**
     * @dev determines what is the EOA we are tracking in the transaction, from the Event Logs
     */
    public async getTrackedEOAFromLogInfos(logInfos: LogInfo[]): Promise<string | undefined> {
        for (const logInfo of logInfos) {
            const { args } = logInfo.decodedLog;
            const addresses = [args.from, args.to];
            const trackedAddress = await this.getFirstTrackedAddress(addresses);
            if (trackedAddress) {
                return trackedAddress;
            }
        }
        // If none of the addresses in any of the logs are tracked, return undefined.
        return undefined;
    }

    private async getFirstTrackedAddress(addresses: string[]): Promise<string | undefined> {
        for (const address of addresses) {
            const isAddressTracked = await this.isTracked(address);
            if (isAddressTracked) {
                // If the address is tracked, return it immediately.
                return address;
            }
        }
        // If none of the addresses are tracked, return undefined.
        return undefined;
    }

    /**
     * @dev determines what is the EOA we are tracking in the transaction from the FROM and TO addresses
     */
    public async getTrackedEOAFromETHTransfer(): Promise<string | undefined> {
        const [isFromAddressTracked, isToAddressTracked] = await Promise.all([
            this.isTracked(this.ethersTx.from),
            this.isTracked(this.ethersTx.to),
        ]);
        if (isFromAddressTracked) return this.ethersTx.from;
        else if (isToAddressTracked) return this.ethersTx.to;
        return undefined;
    }

    private async isTracked(address: string | undefined): Promise<boolean> {
        if (address == undefined) return false;
        let existingDocument;
        try {
            existingDocument = await NotifyModel.findOne({ address });
        } catch (err: any) {
            console.log('err from getChatIds, tried to fetch tracked address');
            throw err;
        }
        if (!existingDocument) {
            return false;
        }
        // here chatIds will never be an empty arr. Handled on db level.
        this.users = existingDocument.users;
        return true;
    }

    public getUsers(): IUserNotify[] {
        return this.users;
    }
}
