import express, { Request, Response, NextFunction } from "express";
import http from "http";
import cookieParser from "cookie-parser";
import compression from "compression";
import cors from "cors";
import { DotenvConfig } from "../config/env.config";
import mongoose from "mongoose";
import Logger from "./utils/logger/winston-logger";
import { schedulesChecks } from "./services/notification-control/notif.service";
import { decideType } from "./services/receive-webhook/decide-type";
import { getMsgInfo } from "./services/receive-webhook/extract-data";
import { getMessageForTelegram, notifyChannel } from "./services/receive-webhook/telegram";

const envConfig = DotenvConfig.getInstance();

const app = express();

// autoIndex should be set to false in production? (see mongoose docs)
console.log(`Connecting to ${envConfig.get("MONGO_URL")}`);
mongoose
  .connect(envConfig.get("MONGO_URL"))
  .then(() => {
    Logger.info("Connected to mongoDB");
    StartServer();
  })
  .catch((error) => {
    Logger.error("Unable to connect: ");
    Logger.error(error);
  });

try {
  schedulesChecks();
} catch (err: unknown) {
  console.error("Error occured in the scheduled job:", err);
}

const StartServer = () => {
  console.log(`Starting server...`);
  console.log(`NODE_ENV:`, process.env.NODE_ENV);

  const corsOptions = {
    origin: "*",
    credentials: true,
  };

  app.use(cors(corsOptions));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(compression());
  app.use(cookieParser());

  const notifiedTransactions = new Map<string, boolean>();
  /**Routes */
  app.post("/api/v1/notify/receiveNotification", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const alchemyTransaction = req.body.event.activity[0];

      // alchemy problem with repeatable notifications about same txs solved with hash map
      const prevTransaction = notifiedTransactions.get(alchemyTransaction.hash);

      if (prevTransaction === true) {
        throw new Error("ok");
      }

      notifiedTransactions.set(alchemyTransaction.hash, true);

      console.log("Transaction received succesfsully");
      console.log("req.body:", req.body);

      const info = await decideType(alchemyTransaction);
      const dataToSend = await getMsgInfo(info);
      const msg = await getMessageForTelegram(dataToSend, info.type);
      await notifyChannel(msg);

      res.status(200).json({});
    } catch (err: unknown) {
      next(err);
    }
  });

  /**Healthcheck */
  app.get("/api/v1/ping", (req, res) => res.status(200).json({ message: "pong" }));

  /** Error handling */
  app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
    if (error.message === "ok") console.log("repeat - notif. skip");
    else {
      console.error(error); // Log error stack trace to the console
    }
    res.status(500).json({ message: "Error has occured.." });
  });

  http
    .createServer(app)
    .listen(envConfig.get("SERVER_PORT"), () => console.log(`Server running on port ${envConfig.get("SERVER_PORT")}`));
};
