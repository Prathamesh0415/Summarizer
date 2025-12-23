import { Schema, model, models, Types } from "mongoose"

export type AuditAction = 
    | "LOGIN_SUCCESS"
    | "LOGIN_FAIL"
    | "LOGOUT"
    | "LOGOUT_ALL"
    | "TOKEN_REFRESH"
    | "TOKEN_REUSE_DETECTED"
    | "PASSWORD_RESET"
    | "EMAIL_VERIFIED"

const AuditLogSchema = new Schema(
    {
        userId: {
            type: Types.ObjectId,
            ref: 'User',
            index: true
        },
        action:{
            type: String,
            required: true
        }, 
        ip: String,
        userAgent: String,

        metadata: {
            type: Schema.Types.Mixed
        }
    },
    { timestamps: true }
)

export const AuditLog =
  models.AuditLog || model("AuditLog", AuditLogSchema);