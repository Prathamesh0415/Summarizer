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
        
        // 1. Rate Limiting (Strict for refresh endpoints)
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
        // 2. Get the Cookie
        // The cookie name must match what you set in the login route
        const cookieStore = req.cookies;
        const compositeToken = cookieStore.get("refreshToken")?.value;

        console.log(cookieStore)



        if(!compositeToken){
            return NextResponse.json({ error: "No refresh token" }, { status: 401 });
        }

        // 3. Parse the Composite Cookie (sessionId:token)
        // We use a separator (e.g., ":") to pack both values into one cookie
        const [sessionId, refreshToken] = compositeToken.split(":");

        if(!sessionId || !refreshToken){
            return NextResponse.json({ error: "Invalid token format" }, { status: 401 });
        }

        // 4. Fetch Session Data from Redis
        const rawData = await redis.get(`refresh:${sessionId}`);

        if(!rawData) {
            return NextResponse.json({ error: "Session expired" }, { status: 401 });
        }

        // Parse the JSON data we stored during login
        const sessionData = JSON.parse(rawData); 
        const { hash: storedHash, userId} = sessionData;

        await dbConnect()

        const user = await User.findOne({_id: userId})

        // 5. Verify Token Hash
        const incomingHash = hashToken(refreshToken);
        
        if(storedHash !== incomingHash){
            // 🚨 Reuse Detection Logic
            await logAuditEvent({
                userId,
                action: "TOKEN_REUSE_DETECTED",
                metadata: { sessionId },
            });

            await deleteAllSessions(userId); // Revoke all access
            
            // clear the cookie
            const response = NextResponse.json({ error: "Session compromised" }, { status: 401 });
            response.cookies.delete("refreshToken"); 
            return response;
        }

        // 6. Token Rotation (Generate New Pair)
        const newRefreshToken = await generateRefreshToken();
        const newAccessToken = await signAccessToken({ // await is needed for jose
            userId,
            //role,
            sessionId
        });

        // 7. Update Redis (Preserve TTL)
        // We update the hash but keep the userId/role
        await redis.set(
            `refresh:${sessionId}`,
            JSON.stringify({ 
                hash: hashToken(newRefreshToken), 
                userId, 
                //role 
            }),
            "KEEPTTL"
        );

        // 8. Log Success
        await logAuditEvent({ userId, action: "TOKEN_REFRESH" });

        // 9. Prepare Response with NEW Cookie
        const response = NextResponse.json({ 
            accessToken: newAccessToken,
            user:{
                userId: userId,
                email: user.email,
                credits: user.credits,
                planName: user.planName,
                totalSummaries: user.totalSummaries
            }
            // Note: We DO NOT send refreshToken in body anymore
        });

        response.cookies.set("refreshToken", `${sessionId}:${newRefreshToken}`, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60, // 7 Days
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