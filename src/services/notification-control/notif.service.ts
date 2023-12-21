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

  console.log("saving to db and webhook");
  await AlchemyHandler.addAddressesForTracking(newTraders);
  console.log("saved successfully");

  console.log("Fetching ALL traderes from db again, this time should be all from spreadsheet in too");
  const tradersFromDB = await TraderModel.find({}).exec();
  console.log("Fetched", tradersFromDB);
  const deletedTraders = [];

  for (const trader of tradersFromDB) {
    const formSpreadsheet = map.get(trader.name);
    console.log("fromSpreadsheet:", formSpreadsheet);
    // if NOT in spreadsheet but IN db. DELETE.
    if (formSpreadsheet == null) {
      console.log("Doesn't exist in db, pushing in delete arr", formSpreadsheet);
      deletedTraders.push(trader);
    }
  }

  console.log("deleteing..");
  console.log("deletarr:", deletedTraders);
  await AlchemyHandler.removeAddressesForTracking(deletedTraders);
  console.log("gg");
};

export const schedulesChecks = () => {
  console.log("Starting scheduled job..");
  schedule.scheduleJob("*/1* * * *", async function () {
    main()
      .then()
      .catch((err) => console.error(err));
  });
};
