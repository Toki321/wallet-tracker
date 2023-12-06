import dotenv, { DotenvParseOutput } from "dotenv";

export interface IDotenvConfig {
  get(key: string): string;
}

// singleton pattern
export class DotenvConfig implements IDotenvConfig {
  private static instance: DotenvConfig;
  private config: DotenvParseOutput;

  private constructor() {
    let error, parsed;
    if (process.env.NODE_ENV === "development") {
      const res = dotenv.config({ path: "../.env.development" });
      error = res.error;
      parsed = res.parsed;
    } else {
      const res = dotenv.config();
      error = res.error;
      parsed = res.parsed;
    }

    if (error) throw new Error("No .env file found");
    if (!parsed) throw new Error(".env is empty");

    this.config = parsed;
  }

  get(key: string): string {
    const res = this.config[key];
    if (!res) throw new Error(`Key "${key}" not found in .env`);
    return res;
  }

  static getInstance(): DotenvConfig {
    if (!DotenvConfig.instance) {
      DotenvConfig.instance = new DotenvConfig();
    }
    return DotenvConfig.instance;
  }
}
