import mongoose, { Schema, models } from "mongoose";

const OrderSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    stripeSessionId: {
      type: String,
      required: true,
      unique: true, // prevent duplicates
    },

    stripePaymentIntentId: {
      type: String,
    },

    amount: {
      type: Number, // in smallest unit (e.g. paise)
      required: true,
    },

    currency: {
      type: String,
      default: "usd",
    },

    creditsAdded: {
      type: Number,
      required: true,
    },

    planName: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["success", "failed"],
      default: "success",
    },
  },
  { timestamps: true }
);

export const Order = models.Order || mongoose.model("Order", OrderSchema);
