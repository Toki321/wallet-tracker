import { google } from "googleapis";
import * as schedule from "node-schedule";
import { ITraderInfo } from "./interfaces";
import { DotenvConfig } from "../../../config/env.config";

const envConfig = DotenvConfig.getInstance();

const clientEmail = envConfig.get("CLIENT_EMAIL");
const spreadsheetId = envConfig.get("SPREADSHEET_ID");

const sheets = google.sheets({ version: "v4", auth: clientEmail });

export async function fetchTradersFromSheet() {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: "Sheet1!A:B",
    });

    const rows = response.data.values;
    if (!rows) {
      throw new Error("No data found.");
    }

    // Convert rows to ITraderInfo[]
    const traders: ITraderInfo[] = rows.map(([name, address]) => ({ name, address }));
    return traders;
  } catch (err) {
    console.error("The API returned an error: " + err);
    throw err;
  }
}

// schedule.scheduleJob("*/15 * * * *", async function () {
//   console.log("Fetching traders data from Google Sheets...");
//   const traders = await fetchTradersFromSheet();
//   console.log("Traders Data:", traders);
//   // Additional logic for traders data can be added here
// });
