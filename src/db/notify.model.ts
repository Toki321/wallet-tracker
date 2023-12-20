import { Document, Schema, model } from "mongoose";

export interface ITokenPosition extends Document {
  buyCounter: number;
  totalBuyAmountUSD: number;
  currentHoldings: number;
  totalSellAmountUSD: number;
}

export interface ITrader extends Document {
  name: string;
  address: string;
  positions: Map<string, ITokenPosition>;
}

const tokenPositionSchema = new Schema<ITokenPosition>({
  buyCounter: { type: Number, required: true, default: 0 },
  totalBuyAmountUSD: { type: Number, required: true, default: 0 },
  currentHoldings: { type: Number, required: true, default: 0 },
  totalSellAmountUSD: { type: Number, required: true, default: 0 },
});

const traderSchema = new Schema<ITrader>({
  name: { type: String, required: true },
  address: { type: String, required: true, unique: true },
  positions: {
    type: Map,
    of: tokenPositionSchema,
  },
});

traderSchema.index({ address: 1 });

export const TokenPositionModel = model<ITokenPosition>("TokenPosition", tokenPositionSchema);
export const TraderModel = model<ITrader>("Trader", traderSchema);
