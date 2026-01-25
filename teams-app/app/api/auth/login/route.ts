import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import { User } from "@/models/User";
import { verifyPassword } from "@/lib/auth/password";
import crypto from "crypto"
import { createSession, generateRefreshToken } from "@/lib/auth/session";
import { signAccessToken } from "@/lib/auth/jwt";
import { logAuditEvent } from "@/lib/audit/logger";
import { rateLimit } from "@/lib/security/rateLimit";
import { loginSchema } from "@/lib/validators/auth"; // Import Schema

export async function POST(req: NextRequest){
    try{
        const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"
    
        const { allowed } = await rateLimit({
            key: `rl:login:ip:${ip}`,
            limit: 5,
            windowInSeconds: 300
        })

        if(!allowed){
            await logAuditEvent({
                action: "LOGIN_FAILED",
                metadata: {reason: "rate_limited", ip}
            })

            return NextResponse.json({
                error: "Too Many Login Attempts. Please try again later"
            }, {status: 429})
        }
    }catch(error){
        console.log("Error in rate limiter", error)
    }
    
    try{
        await dbConnect()
        const body = await req.json()

        const validation = loginSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                error: "Invalid inputs",
                details: validation.error.flatten().fieldErrors
            }, { status: 400 });
        }

        const { email, password } = validation.data;

        const user = await User.findOne({email})
        if(!user){
            return NextResponse.json(
                {error: "Invalid credentials"},
                {status: 401}
            )
        }

        if(user && user.isGoogle){
            return NextResponse.json(
                {error: "Email used in Google login"},
                {status: 401}
            )
        }

        const isValid = await verifyPassword(password, user.passwordHash)
        if(!isValid){
            
            await logAuditEvent({
                action: "LOGIN_FAILED",
                ip: req.headers.get("x-forwarded-for"),
                userAgent: req.headers.get("user-agent"),
                metadata: { email },
            });

            return NextResponse.json(
                {error: "Invalid credentials"},
                {status: 401}
            )
        }
        if(!user.emailVerified){
            return NextResponse.json(
                {error: "Email not verified"},
                {status: 403}
            )
        }


        const sessionId = crypto.randomUUID()
        const refreshToken = generateRefreshToken()

        await createSession({
            userId: user._id.toString(),
            sessionId,
            refreshToken,
            ip: req.headers.get("x-forwared-for") ?? "",
            userAgent: req.headers.get("user-agent") ?? "",
        })

        const accessToken = await signAccessToken({
            userId: user._id.toString(),
            sessionId
        })

        const response =  NextResponse.json({
            accessToken,
        })

        response.cookies.set("refreshToken", `${sessionId}:${refreshToken}`, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60,
            path: "/"
        })

        try{
            await logAuditEvent({
                userId: user._id.toString(),
                action: "LOGIN_SUCCESS",
                ip: req.headers.get("x-forwarded-for"),
                userAgent: req.headers.get("user-agent")
            })
        }catch(error){
            console.log("Error while loging in login", error)
        }

        return response

    }catch(error){
        console.log(error)
        return NextResponse.json({
            error: "Internal Server error at login"
        }, {status: 500})
    }
}