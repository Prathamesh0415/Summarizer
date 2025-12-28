import { NextRequest, NextResponse } from "next/server";
import { User } from "@/models/User";
import dbConnect from "@/lib/db";
import { logAuditEvent } from "@/lib/audit/logger";

export async function GET(req: NextRequest){
    try {
        await dbConnect()

        const { searchParams } = new URL(req.url)
        //console.log(searchParams)
        const token = searchParams.get("token")
        //console.log(token)

        if(!token) {
            //console.log("hello")
            return NextResponse.json(
                {error: "Invalid token"},
                {status: 400}
            )
        }

        const user = await User.findOne({
            emailVerificationToken: token,
            emailVerificationExpiry: { $gt: Date.now() }
        })

        if(!user){
            console.log("hello")
            return NextResponse.json(
                {error: "Token expired or invalid"},
                {status: 400}
            )
        }

        user.emailVerified = true
        user.emailVerificationToken = undefined
        user.emailVerificationExpiry = undefined

        await user.save()

        try {
            await logAuditEvent({
                userId: user._id.toString(),
                action: "EMAIL_VERIFIED"
            })
        } catch (auditError) {
            console.error("Failed to log audit event:", auditError)
        }

        return NextResponse.json({
            success: true,
            message: "Email verified successfully"
        })

    } catch(error) {
        console.error("Email verification error:", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}