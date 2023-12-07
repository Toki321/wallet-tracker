import { NotifyConfig } from "../../../config/notify.config";
import { TraderModel } from "../../db/notify.model";
import { ITraderInfo } from "./interfaces";

const notifyConfig = NotifyConfig.getInstance();

export class AlchemyHandler {
  private static alchemyNotifySDK = notifyConfig.getAlchemyNotifySDK();
  private static webhookId = notifyConfig.getWebhookId();

  public static async addAddressesForTracking(traders: ITraderInfo[]): Promise<void> {
    if (traders.length === 0) return;
    try {
      // Add each trader to the database
      for (const traderInfo of traders) {
        const trader = new TraderModel({
          name: traderInfo.name,
          address: traderInfo.address,
          positions: new Map(), // Initialize positions as an empty Map
        });

        await trader.save(); // Save the trader to the database
      }
      console.log("saved to db.. saving to webhook");

      // Add the addresses to webhook, to start getting tracked
      const addresses = traders.map((trader) => trader.address);
      await this.alchemyNotifySDK.notify.updateWebhook(this.webhookId, {
        addAddresses: addresses,
      });
      console.log("saved to webhook", this.webhookId);
    } catch (err: any) {
      console.error("Error from addAddressesForTracking:\n", err);
    }
  }

  public static async removeAddressesForTracking(traders: ITraderInfo[]): Promise<void> {
    if (traders.length === 0) return;
    try {
      // remove each trader from the database
      for (const trader of traders) {
        await TraderModel.deleteOne({ name: trader.name });
      }
      console.log("Successfully removed from db.. removing from webhook");

      // remove the addresses from webhook, to stop getting tracked
      const addresses = traders.map((trader) => trader.address);
      await this.alchemyNotifySDK.notify.updateWebhook(this.webhookId, {
        removeAddresses: addresses,
      });
    } catch (err: any) {
      console.error("Error from addAddressesForTracking:\n", err);
    }
  }
}
