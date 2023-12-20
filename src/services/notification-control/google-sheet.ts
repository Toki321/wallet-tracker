import { google } from "googleapis";
import { ITraderInfo } from "./interfaces";
import { DotenvConfig } from "../../../config/env.config";

const envConfig = DotenvConfig.getInstance();

const clientEmail = envConfig.get("CLIENT_EMAIL");
const privKey = envConfig.get("GOOGLE_PRIVATE_KEY");
const spreadsheetId = envConfig.get("SPREADSHEET_ID");

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: clientEmail,
    private_key: privKey,
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

const sheets = google.sheets({ version: "v4", auth: auth });

export async function fetchTradersFromSheet(): Promise<ITraderInfo[]> {
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
    traders.reverse();
    traders.pop();
    return traders;
  } catch (err) {
    console.log(err);
    return [];
  }
}
