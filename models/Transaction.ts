import mongoose, { Schema, Model } from "mongoose";

export interface ITransaction {
  user_id: mongoose.Types.ObjectId;
  amount_cents: number;
  currency: string;
  type: "purchase" | "usage" | "refund";
  provider: "paypal" | "stripe" | "system";
  provider_order_id?: string;
  status: "pending" | "completed" | "failed" | "canceled";
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount_cents: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "USD",
    },
    type: {
      type: String,
      enum: ["purchase", "usage", "refund"],
      required: true,
    },
    provider: {
      type: String,
      enum: ["paypal", "stripe", "system"],
      required: true,
    },
    provider_order_id: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "canceled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

const Transaction: Model<ITransaction> =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", TransactionSchema);

export default Transaction;
