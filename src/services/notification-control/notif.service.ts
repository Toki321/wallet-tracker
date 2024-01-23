import { TraderModel } from "../../db/notify.model";
import * as schedule from "node-schedule";
import { AlchemyHandler } from "./alchemy.class";
import { fetchTradersFromSheet } from "./google-sheet";

export const main = async () => {
  const tradersFromSpreadSheet = await fetchTradersFromSheet();
  console.log("fetched tradersFromSpreadSheet:", tradersFromSpreadSheet);

  const newTraders = [];

  const map = new Map();
  for (const trader of tradersFromSpreadSheet) {
    map.set(trader.name, true);
    const dbTrader = await TraderModel.findOne({ name: trader.name, address: trader.address }).exec();
    console.log("fetched dbTrader:", dbTrader);
    if (!dbTrader) {
      console.log("Non existent. pushing to newTraders arr");
      newTraders.push(trader);
    }
  }

  console.log("saving to db and webhook..");
  await AlchemyHandler.addAddressesForTracking(newTraders);
  console.log("saved successfully");

  console.log("Fetching ALL traders from db again, this time should be all from spreadsheet in too");
  const tradersFromDB = await TraderModel.find({}).exec();
  // console.log("Fetched", tradersFromDB);
  const deletedTraders = [];

  for (const trader of tradersFromDB) {
    const isTraderFromSpreadsheet = map.get(trader.name);
    // console.log("isTraderFromSpreadsheet:", isTraderFromSpreadsheet);
    // if NOT in spreadsheet but IN db. DELETE.
    if (isTraderFromSpreadsheet == null) {
      console.log("Trader has been deleted from Spreadsheet, deleting from db: ", trader.name);
      deletedTraders.push(trader);
    }
  }

  console.log("Traders to be deleted:", deletedTraders);
  await AlchemyHandler.removeAddressesForTracking(deletedTraders);
  console.log("gg");
};

export const schedulesChecks = () => {
  console.log("Starting scheduled job..");
  schedule.scheduleJob("*/1 * * * *", async function () {
    console.log("Scheduler triggered, calling main()");
    main()
      .then(() => console.log("main() executed successfully"))
      .catch((err) => console.error("Error in main():", err));
  });
};
