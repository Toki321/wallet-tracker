import { Context } from 'telegraf';
import { Update } from 'typegram';
import { IUser } from '../../utils/interfaces/user.interface';

export interface ISession {
    waitingForEthAddress?: boolean;
    waitingForBundleName?: boolean;
    waitingForNewBundleName?: boolean;
    waitingForSnipeAddress?: boolean;
    waitingForSnipeAmountETH?: boolean;
    currentNumericInput?: string;
    bundleToAddTo?: string | null;
    oldBundleName?: string;
    lastEnteredAddress?: string;
    snipeERC20Address?: string;
    snipeAmountETH?: string;
    user?: IUser | null;
}

export interface IContext extends Context<Update> {
    session: ISession;
    match?: RegExpExecArray;
}
