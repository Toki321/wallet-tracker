import { TraderModel } from "../../db/notify.model";
import { AlchemyHandler } from "./alchemy.class";
import { fetchTradersFromSheet } from "./google-sheet";
import { ITraderInfo } from "./interfaces";

const main = async () => {
  const tradersFromSpreadSheet = await fetchTradersFromSheet();

  const newTraders = [];

  for (const trader of tradersFromSpreadSheet) {
    const dbTrader = await TraderModel.find({ name: trader.name, address: trader.address }).exec();
    if (!dbTrader) {
      newTraders.push(trader);
    }
  }

  await AlchemyHandler.addAddressesForTracking(newTraders);

  const tradersFromDB = await TraderModel.find({}).exec();
  const deletedTraders = [];

  const map = new Map();
  for (const trader of tradersFromSpreadSheet) {
    map.set(trader.name, true);
  }

  for (const trader of tradersFromDB) {
    const formSpreadsheet = map.get(trader.name);
    // if NOT in spreadsheet but IN db. DELETE.
    if (formSpreadsheet == null) {
      deletedTraders.push(trader);
    }
  }

  await AlchemyHandler.removeAddressesForTracking(deletedTraders);
};
