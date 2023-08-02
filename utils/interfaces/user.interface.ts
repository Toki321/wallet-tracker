// sth
import { IBundle } from './bundle.interface';

export interface IUser {
    _id: string;
    webCredentials?: IWebCredentials;
    telegramChatId?: string;
    userWallet?: string;
    userOpsinWallets?: string[];
    bundles?: IBundle[];
    transform: () => IUser;
}

export interface IWebCredentials {
    username: string;
    password: string;
}
