import { Schema, model, models, Types } from "mongoose";
import { boolean } from "zod";

export type UserRole = "USER" | "ADMIN";

const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },

    passwordHash: {
      type: String,
      required: false,
    },

    // role: {
    //   type: String,
    //   enum: ["USER", "ADMIN"],
    //   default: "USER",
    // },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationToken: String,
    emailVerificationExpiry: Date,

    passwordResetToken: String,
    passwordResetExpires: Date,

    stripeCustomerId: {
      type: String
    },
    stripeSubscriptionId: {
      type: String
    },

    planName:{
      type: String,
      default: "free",
      enum: ["free", "standard", "pro", "enterprise"]
    },

    credits: {
      type: Number,
      default: 5
    },

    totalSummaries: {
      type: Number,
      default: 0
    },

    isGoogle: {
      type: boolean,
      default: false
    }

  

    // teams: [
    //   {
    //     type: Types.ObjectId,
    //     ref: "Team",
    //   },
    // ],
  },
  { timestamps: true }
);

export const User = models.User || model("User", UserSchema);
