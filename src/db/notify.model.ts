import { Document, Schema, model } from "mongoose";

export interface ITokenPosition extends Document {
  buyCounter: number;
  totalBuyAmount: number;
  currentHoldings: number;
}

interface ITrader extends Document {
  name: string;
  address: string;
  positions: Map<string, ITokenPosition>;
}

const tokenPositionSchema = new Schema<ITokenPosition>({
  buyCounter: { type: Number, required: true, default: 0 },
  totalBuyAmount: { type: Number, required: true, default: 0 },
  currentHoldings: { type: Number, required: true, default: 0 },
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
