import { NextRequest, NextResponse } from "next/server";
import { User } from "@/models/User";
import dbConnect from "@/lib/db";

export async function GET(req: NextRequest){
    await dbConnect()

    const { searchParams } = new URL(req.url)
    const token = searchParams.get("token")

    if(!token) {
        return NextResponse.json(
            {error: "Invalid token"},
            {status: 400}
        )
    }

    const user = await User.findOne({
        emailVerificationToken: token,
        emailVerifictionExpiry: { $gt: Date.now() }
    })

    if(!user){
        return NextResponse.json(
            {error: "Token expired or invalid"},
            {status: 400}
        )
    }

    user.emailVerified = true
    user.emailVerificationToken = undefined
    user.emailVerificationExpiry = undefined

    await user.save()

    return NextResponse.json({
        success: true,
        message: "Email verified successfully"
    })
}