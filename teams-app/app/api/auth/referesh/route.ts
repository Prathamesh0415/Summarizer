import { NextResponse, NextRequest } from "next/server";
import { generateRefereshToken, hashToken } from "@/lib/auth/session";
import redis from "@/lib/redis";
import { signAccessToken } from "@/lib/auth/jwt";
import { deleteAllSessions } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit/logger";

export async function POST(req: NextRequest){
    const {userId, role, sessionId, refereshToken} = await req.json()

    if(!userId || !sessionId || !refereshToken){
        return NextResponse.json(
            {error: "Invalid request"},
            {status: 400}
        )
    }

    const storedHash = await redis.get(`referesh:${sessionId}`)

    if(!storedHash || storedHash != hashToken(refereshToken)){
        if(storedHash != hashToken(refereshToken)){
            await logAuditEvent({
                userId,
                action: "TOKEN_REUSE_DETECTED",
                metadata: { sessionId },
            });
        }

        await deleteAllSessions(userId)
        return NextResponse.json(
            {error: "Session compromised, Re-login required"},
            {status: 401}
        )
    }

    const newRefereshToken = generateRefereshToken()

    await redis.set(`referesh:${sessionId}`,
        hashToken(newRefereshToken),
        "KEEPTTL" // DOSENT CAHNDE THE EXPIRY TIME OF THE ORIGINAL TOKEN
    )

    const newAccessToken = signAccessToken({
        userId,
        role,
        sessionId
    })

    await logAuditEvent({
        userId,
        action: "TOKEN_REFRESH",
    });


    return NextResponse.json({
        accessToken: newAccessToken,
        refereshToken: newRefereshToken
    })

}