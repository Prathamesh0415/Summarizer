import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { User } from "@/models/User";
import crypto from "crypto"
import { rateLimit } from "@/lib/security/rateLimit";
import { hashToken } from "@/lib/auth/session";
import { sendPasswordResetEmail } from "@/lib/mail";

export async function POST(req: NextRequest){
    try{
        const ip = req.headers.get("x-forwarded-for")?.split(",")[0] /*|| req.ip*/ || "unknown"
        
        const { allowed } = await rateLimit({
            key: `rl:forgot:ip:${ip}`,
            limit: 3,
            windowInSeconds: 300
        })
    
        if(!allowed){
            return NextResponse.json({
                error: "Too Many  Attempts. Please try again later"
            }, {status: 429})
        }
    }catch(error){
        console.log("Error in rate limiter at forgot-pass",error);
    }

    try{
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

        await sendPasswordResetEmail(email, token)

        return NextResponse.json({
            success: true,
            message: "if user exists, reset link sent"
        })
    }catch(error){
        return NextResponse.json({
            error: "Internal Server error (for-pass)"
        }, {status: 500})
    }
    
    
}