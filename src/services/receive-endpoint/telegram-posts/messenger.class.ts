import axios from "axios";
import { TransactionRecord } from "../record-building/record.class";
import Bottleneck from "bottleneck";
import { MessageCreator } from "./message-creation/msg-creator.class";
import { DotenvConfig } from "../../../../config/env.config";

const limiter = new Bottleneck({
  minTime: 1000, // Number of milliseconds to wait before making the next request
});
const configService = DotenvConfig.getInstance();

export class TelegramMessenger {
  private chatIds: number[];
  private messageCreator: MessageCreator;

  constructor(chatIds: string[], record: TransactionRecord) {
    this.chatIds = chatIds.map((id) => Number(id));
    this.messageCreator = new MessageCreator(record);
  }

  async notifyTelegram(): Promise<void> {
    const message = this.messageCreator.formulateFinalMessage();
    if (!message) {
      console.log("Nothing of interest was found in the tx made");
      return;
    }
    console.log("finalMessage: \n", message);
    await Promise.all(this.chatIds.map((chatId) => this.postToChat(chatId, message)));
  }

  private async postToChat(chatId: number, message: string) {
    try {
      await limiter.schedule(() =>
        axios.post(`https://api.telegram.org/bot${configService.get("BOT_TOKEN")}/sendMessage`, {
          chat_id: chatId,
          text: message,
          disable_web_page_preview: true,
          parse_mode: "HTML",
        })
      );
    } catch (err: any) {
      console.log(`Error while sending message to chatId ${chatId}:`, err.response.data);
    }
  }
}
