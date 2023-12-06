import { TraderModel } from "../../db/notify.model";
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

  for (const trader of newTraders) {
    const saveTrader = new TraderModel({ name: trader.name, address: trader.address });
    await saveTrader.save();
  }

  const tradersFromDB = await TraderModel.find({}).exec();
  const deletedTraders = [];

  const map = new Map();
  for (const trader of tradersFromSpreadSheet) {
    map.set(trader.name, true);
  }

  for (const trader of tradersFromDB) {
    const formSpreadsheet = map.get(trader.name);
    if (formSpreadsheet == null) {
      // delete from db because at this point all from spreadsheet should be in db. if it's in db and not in spreadsheet DELET
    }
  }
};
