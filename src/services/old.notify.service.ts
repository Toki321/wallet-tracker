import { Network, WebhookType } from 'alchemy-sdk';
import NotifyModel from '../../database/models/notify.model';
import { DbOperationFailed } from '../../../../utils/errors/operation-failed';
import { BlockchainConfigFactory } from '../../../../config/blockchain/factory.class';
import UserModel from '../../database/models/user.model';
import { InvalidInput } from '../../../../utils/errors/bad-input';
import { IUserNotify, TxTYPE, INotifyModel } from '../../../../utils/interfaces/notify.interface';
import { ITrackedAddress } from '../../../../utils/interfaces/user.interface';

const configFactory = BlockchainConfigFactory.getInstance();
const notifyConfig = configFactory.NOTIFY_CONFIG;

export class NotifyService {
    private static alchemyNotifySDK = notifyConfig.getAlchemyNotifySDK();
    private static webhookId = notifyConfig.WEBHOOK_ID;
    private static BASE_URL = notifyConfig.BASE_URL;

    /**HANDLERS FOR CONTROLLERS */
    static async handleStartNotifications(chatId: string, address: string, types: TxTYPE[]) {
        try {
            // If webhook isn't created, create and automatically add the inputted address
            if (!this.webhookId) {
                await this.initializeWebhookAndAddAddress(chatId, address, types);
            }
            // If webhook is already created, then just keep on adding addresses to it
            else {
                await Promise.all([this.addAddressToWebhook(address), this.addAddressToDb(chatId, address, types)]);
            }
        } catch (err) {
            console.error('Error in handleStartNotifcations');
            throw err;
        }
    }

    static async handleStopNotifications(chatId: string, address: string) {
        try {
            await Promise.all([this.removeAddressFromWebhook(address), this.removeAddressFromDb(chatId, address)]);
        } catch (err) {
            console.error('Error in handleStopNotifications');
            throw err;
        }
    }

    /**Private methods that are used in the above handlers. */
    private static async initializeWebhookAndAddAddress(chatId: string, address: string, types: TxTYPE[]) {
        try {
            const addressTransactionWebhook = await NotifyService.alchemyNotifySDK.notify.createWebhook(
                this.BASE_URL + '/api/v1/notify/receiveNotification',
                WebhookType.ADDRESS_ACTIVITY,
                {
                    addresses: [address],
                    network: Network.ETH_MAINNET,
                },
            );
            this.webhookId = addressTransactionWebhook.id;
            console.log('Generated webhook:\n', addressTransactionWebhook);

            await this.addAddressToDb(chatId, address, types);
        } catch (err) {
            console.error('Error in initializeWebhookAndAddAddress');
            throw err;
        }
    }

    private static async addAddressToWebhook(address: string): Promise<void> {
        try {
            await this.alchemyNotifySDK.notify.updateWebhook(this.webhookId, {
                addAddresses: [address],
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.error('error from addAddressForTracking:\n');
            throw err;
        }
    }

    private static async addAddressToDb(chatId: string, address: string, types: TxTYPE[]) {
        try {
            await Promise.all([this.handleUserModel(chatId, address, types), this.handleNotifyModel(chatId, address, types)]);
        } catch (err) {
            console.error('Error from addAddressToDb: Could not save to DB');
            throw err;
        }
    }

    private static async handleUserModel(chatId: string, address: string, types: TxTYPE[]): Promise<void> {
        try {
            // Fetch the user document
            const user = await UserModel.findOne({ telegramChatId: chatId });

            if (!user) {
                throw new Error('User not found');
            }

            // Check if the address exists in trackedAddresses
            const trackedAddress = user.trackedAddresses?.find(item => item.address === address);

            if (trackedAddress) {
                // If the address exists, merge or replace txTypes as per your requirement
                trackedAddress.txTypes = types;
            } else {
                // If the address doesn't exist, push a new object
                user.trackedAddresses?.push({ address, txTypes: types });
            }

            // Save the user document
            await user.save();
        } catch (err) {
            console.error('Err in handleUserModel');
            throw err;
        }
    }

    private static async handleNotifyModel(chatId: string, address: string, types: TxTYPE[]) {
        try {
            const notifyModel = await NotifyModel.findOne({ address });
            if (!notifyModel) {
                await this.createNewNotifyModel(chatId, address, types);
            } else {
                await this.addUserToNotifyModel(notifyModel, chatId, types);
            }
        } catch (err) {
            console.error('Err in handleNotifyModel');
            throw err;
        }
    }

    private static async addUserToNotifyModel(notifyModel: INotifyModel, chatId: string, types: TxTYPE[]) {
        // Check if chatId already exists for the given address to avoid duplicates
        const userForChatId = notifyModel.users.find(user => user.chatId === chatId);
        if (!userForChatId) {
            try {
                await notifyModel.updateOne({ $push: { users: { chatId, txTypes: types } } });
            } catch (err) {
                console.error('Error in addUserToNotifyModel');
                throw err;
            }
        }
    }

    private static async createNewNotifyModel(chatId: string, address: string, types: TxTYPE[]) {
        const notifyModel = new NotifyModel({ address, users: [{ chatId, txTypes: types }] });
        try {
            await notifyModel.save();
        } catch (err) {
            console.error('Error in createNewNotifyModel', err);
            throw err;
        }
    }

    private static async removeAddressFromWebhook(address: string): Promise<void> {
        try {
            await this.alchemyNotifySDK.notify.updateWebhook(this.webhookId, {
                removeAddresses: [address],
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.error('error from removeAddressFromWebhook:\n');
            throw err;
        }
    }

    private static async removeAddressFromDb(chatId: string, address: string): Promise<void> {
        try {
            await Promise.all([this.handleNotifyRemovalModel(chatId, address), this.removeAddressFromUserModel(chatId, address)]);
        } catch (err) {
            console.error('Error from removeAddressFromDb: Could not remove from DB');
            throw err;
        }
    }

    private static async handleNotifyRemovalModel(chatId: string, address: string): Promise<void> {
        try {
            const notifyModel = await NotifyModel.findOne({ address });
            if (notifyModel) {
                const users = notifyModel.users;
                const numberUsers = users.length;

                // If more chatIds are subscribed to the same address, then keep model and remove user with provided chatId
                if (numberUsers > 1) {
                    await this.deleteOneUserFromModel(notifyModel, users, chatId);
                }
                // If it's only 1 address to 1 user, remove the whole AddressUser object from db
                else {
                    await notifyModel.deleteOne({ address });
                }
            }
        } catch (err) {
            console.error('Err in handleNotifyRemovalModel');
            throw err;
        }
    }

    private static async deleteOneUserFromModel(NotifyModel: INotifyModel, users: IUserNotify[], chatId: string): Promise<void> {
        const index = this.getIndex(users, chatId); //?todo make more efficient
        if (index > -1) {
            NotifyModel.users.splice(index, 1);
        }
        try {
            await NotifyModel.save();
        } catch (err) {
            console.error('Err in deleteOneUserFromModel');
            throw err;
        }
    }

    private static getIndex(users: IUserNotify[], chatId: string): number {
        let i = 0;
        for (const user of users) {
            if (user.chatId == chatId) {
                return i;
            }
            i++;
        }

        return -1;
    }

    private static async removeAddressFromUserModel(chatId: string, address: string): Promise<void> {
        try {
            await UserModel.updateOne({ telegramChatId: chatId }, { $pull: { trackedAddresses: { address: address } } });
        } catch (err) {
            console.error('error in removeAddressFromUserModel');
            throw err;
        }
    }

    /**
     * Fetches the addresses being tracked by a specific chatId from the User model
     * @param chatId The chatId you want to look up
     * @returns An array of addresses associated with the chatId
     */
    public static async getTrackedAddressesByChatId(chatId: string): Promise<ITrackedAddress[]> {
        try {
            const user = await UserModel.findOne({ telegramChatId: chatId });
            if (!user) {
                throw new InvalidInput('user with that chat id does not exist');
            }
            return user.trackedAddresses || []; // Return the trackedAddresses or an empty array if user is null
        } catch (err) {
            console.error('err in getTrackedAddressesByChatId');
            throw err;
        }
    }
}
