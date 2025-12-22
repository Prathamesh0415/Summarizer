import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { User } from "@/models/User";
import crypto from "crypto"

export async function POST(req: NextRequest){
    await dbConnect()
    const { email } = await req.json()

    const user = await User.findOne({ email })

    if(!user){
        return NextResponse.json({
            message: "if user exists, reset link sent"
        })
    }

    const token = crypto.randomBytes(32).toString("hex")

    user.passwordResetToken = token
    user.passwordResetExpires = Date.now() + 15 * 60 * 1000
    await user.save()

    //TODO: Reset pass email
    console.log("send the reset password email")

    return NextResponse.json({
        success: true,
        message: "reset link sent"
    })
}