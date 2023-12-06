import { Document, Schema, model } from "mongoose";

interface ITokenPosition extends Document {
  buyCounter: number;
  totalBuyAmount: number;
  currentHoldings: number;
}

interface ITrader extends Document {
  name: string;
  address: string;
  positions: Record<string, ITokenPosition>;
}

const tokenPositionSchema = new Schema<ITokenPosition>({
  buyCounter: { type: Number, required: true },
  totalBuyAmount: { type: Number, required: true },
  currentHoldings: { type: Number, required: true },
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
