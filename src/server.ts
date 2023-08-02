import express, { Request, Response, NextFunction } from "express";
import http from "http";
import cookieParser from "cookie-parser";
import compression from "compression";
import cors from "cors";
import { ConfigService } from "../config/config.service";

const configService = ConfigService.getInstance();

const app = express();

const StartServer = () => {
  console.log(`Starting server...`);
  console.log(`NODE_ENV:`, process.env.NODE_ENV);
  console.log(`FRONTEND_URL:`, process.env.FRONTEND_URL);

  const corsOptions = {
    origin: "*",
    credentials: true,
  };

  app.use(cors(corsOptions));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(compression());
  app.use(cookieParser());

  /**Routes */
  app.post("/receiveHook", (req: Request, res: Response) => {});

  /**Healthcheck */
  app.get("/api/v1/ping", (req, res) => res.status(200).json({ message: "pong" }));

  /** Error handling */
  app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(error); // Log error stack trace to the console
    res.status(500).json({ message: "An internal error occurred!" });
  });

  http
    .createServer(app)
    .listen(configService.get("SERVER_PORT"), () =>
      console.log(`Server running on port ${configService.get("SERVER_PORT")}`)
    );
};

StartServer();
