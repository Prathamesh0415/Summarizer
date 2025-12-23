import { Schema, model, models, Types } from "mongoose";

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
      required: true,
    },

    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER",
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationToken: String,
    emailVerificationExpiry: Date,

    passwordResetToken: String,
    passwordResetExpires: Date,

    teams: [
      {
        type: Types.ObjectId,
        ref: "Team",
      },
    ],
  },
  { timestamps: true }
);

export const User = models.User || model("User", UserSchema);
