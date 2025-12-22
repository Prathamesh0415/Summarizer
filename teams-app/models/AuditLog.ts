import { Schema, model, models, Types } from "mongoose"

const AuditLogScehma = new Schema(
    {
        userId: {
            type: Types.ObjectId,
            ref: 'User'
        },
        action:{
            type: String,
            enum: [
                "LOGIN",
                "LOGOUT",
                "TOKEN_REFERESH",
                "PASSWORD_CHANGE",
                "EMAIL_VERIFIED",
                "FAILED_LOGIN"
            ],
            required: true
        }, 
        ip: String,
        userAgent: String
    },
    { timestamps: true }
)