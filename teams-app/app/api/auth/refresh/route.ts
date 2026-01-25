import { NextResponse, NextRequest } from "next/server";
import { generateRefreshToken, hashToken, deleteAllSessions } from "@/lib/auth/session";
import redis from "@/lib/redis";
import { signAccessToken } from "@/lib/auth/jwt";
import { logAuditEvent } from "@/lib/audit/logger";
import { rateLimit } from "@/lib/security/rateLimit";
import { User } from "@/models/User";
import dbConnect from "@/lib/db";

export async function POST(req: NextRequest){
    try {    
        const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";

        const { allowed } = await rateLimit({
            key: `rl:refresh:ip:${ip}`,
            limit: 10,
            windowInSeconds: 300
        });
        
        if(!allowed){
            return NextResponse.json(
                { error: "Too many refresh attempts" }, 
                { status: 429 }
            );
        }
    } catch(error) {
        console.error("Rate limit error", error);
    }
    
    try {

        const cookieStore = req.cookies;
        const compositeToken = cookieStore.get("refreshToken")?.value;

        if(!compositeToken){
            return NextResponse.json({ error: "No refresh token" }, { status: 401 });
        }

        const [sessionId, refreshToken] = compositeToken.split(":");

        if(!sessionId || !refreshToken){
            return NextResponse.json({ error: "Invalid token format" }, { status: 401 });
        }

        const rawData = await redis.get(`refresh:${sessionId}`);

        if(!rawData) {
            return NextResponse.json({ error: "Session expired" }, { status: 401 });
        }

        const sessionData = JSON.parse(rawData); 
        const { hash: storedHash, userId} = sessionData;

        await dbConnect()

        const user = await User.findOne({_id: userId})

        const incomingHash = hashToken(refreshToken);
        
        if(storedHash !== incomingHash){
            await logAuditEvent({
                userId,
                action: "TOKEN_REUSE_DETECTED",
                metadata: { sessionId },
            });

            await deleteAllSessions(userId);

            const response = NextResponse.json({ error: "Session compromised" }, { status: 401 });
            response.cookies.delete("refreshToken"); 
            return response;
        }

        const newRefreshToken = await generateRefreshToken();
        const newAccessToken = await signAccessToken({ 
            userId,
            sessionId
        });

        await redis.set(
            `refresh:${sessionId}`,
            JSON.stringify({ 
                hash: hashToken(newRefreshToken), 
                userId, 
            }),
            "KEEPTTL"
        );

        await logAuditEvent({ userId, action: "TOKEN_REFRESH" });

        const response = NextResponse.json({ 
            accessToken: newAccessToken,
            user:{
                userId: userId,
                email: user.email,
                credits: user.credits,
                planName: user.planName,
                totalSummaries: user.totalSummaries
            }
        });

        response.cookies.set("refreshToken", `${sessionId}:${newRefreshToken}`, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60,
            path: "/"
        });

        return response;

    } catch(error) {
        console.error("Refresh error:", error);
        return NextResponse.json(
            { error: "Internal server error" }, 
            { status: 500 }
        );
    }
}