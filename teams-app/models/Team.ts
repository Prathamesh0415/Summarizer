import { Schema, model, models, Types } from 'mongoose'

const TeamSchema = new Schema(
    {
        name: {
            type: String,
            required: true
        },

        ownerId: {
            type: Types.ObjectId,
            ref: 'User',
            required: true
        },

        members: [
            {
                userId: {
                    type: Types.ObjectId,
                    ref: 'User'
                },
                role: {
                    type: String,
                    enum: ["MEMBER" , "ADMIN"],
                    default: "MEMBER"
                }
            }
        ]
    },
    {timestamps: true}
)

export const Team = models.Team || model("Team", TeamSchema)