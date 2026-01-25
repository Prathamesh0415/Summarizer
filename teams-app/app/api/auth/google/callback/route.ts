import { NextRequest, NextResponse } from "next/server";
import { User } from "@/models/User";
import dbConnect from "@/lib/db";
import { signAccessToken } from "@/lib/auth/jwt";
import { generateRefreshToken } from "@/lib/auth/session";
import { createSession } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit/logger";

export async function GET(req: NextRequest){
    try{
        const { searchParams } = new URL(req.url)
        const code = searchParams.get("code")

        if(!code){
            return NextResponse.redirect(new URL("/login?error=oauth", req.url))
        }

        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                code,
                grant_type: "authorization_code",
                redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
                }),
            })

        if (!tokenRes.ok) {
            console.error("Google Token Error:", await tokenRes.text());
            return NextResponse.redirect(new URL("/login?error=google_token_fail", req.url));
        }

        const tokenData = await tokenRes.json()

        const profileRes = await fetch(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            {
                headers: {
                    Authorization: `Bearer ${tokenData.access_token}`
                }
            }
        )

        if (!profileRes.ok) {
            if (!profileRes.ok) {
                const errorBody = await profileRes.text(); // Get the raw error text
                console.error("❌ Google Profile Error Status:", profileRes.status);
                console.error("❌ Google Profile Error Body:", errorBody);
                console.error("ℹ️ Access Token Used:", tokenData.access_token ? "Token exists" : "Token is undefined");
                
                return NextResponse.redirect(new URL("/login?error=google_profile_fail", req.url));
            }
           // return NextResponse.redirect(new URL("/login?error=google_profile_fail", req.url));
        }

        const profile = await profileRes.json()

        await dbConnect()

        let user = await User.findOne({email: profile.email})

        if(!user){
            user = await User.create({
                email: profile.email,
                emailVerified: true,
                planName: "free",
                isGoogle: true,
                credits: 5,
            });
        }

        const sessionId = crypto.randomUUID()
        const refreshToken = generateRefreshToken()

        await createSession({
            userId: user._id.toString(),
            sessionId,
            refreshToken,
            ip: req.headers.get("x-forwarded-for") ?? "",
            userAgent: req.headers.get("user-agent") ?? "",
        })

        const accessToken = await signAccessToken({userId: user._id, sessionId})

        const response = NextResponse.redirect(new URL("/dashboard", req.url))
    
        response.cookies.set("refreshToken", `${sessionId}:${refreshToken}`, {
                httpOnly: true,
                maxAge: 7 * 24 * 60 * 60,
                path: "/"
        })

        response.cookies.set("accessTokenTemp", accessToken, {
            httpOnly: false,
            maxAge: 5
        })

        try{
            await logAuditEvent({
                    userId: user._id.toString(),
                    action: "LOGIN_SUCCESS_OAUTH",
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
            success: false,
            message: "Error in Login"
        }, {status: 500})
    }
}