import crypto, { createHash } from "crypto"
import redis from "../redis"

export function generateRefereshToken(): string{
    return crypto.randomBytes(64).toString("hex")
}

export function hashToken(token: string): string{
    return crypto.createHash("sha256").update(token).digest("hex")
}

export async function createSession({
    userId,
    sessionId,
    refereshToken,
    ip,
    userAgent
}: {
    userId: string
    sessionId: string
    refereshToken: string
    ip: string
    userAgent: string
})  {
    const tokenHash = hashToken(refereshToken)

    await redis.set(
        `referesh:${sessionId}`,
        tokenHash,
        "EX",
        60 * 60 * 24 * 7
    )

    await redis.hset(`session:${sessionId}`, {
        userId,
        ip: ip ?? "",
        userAgent: userAgent ?? "",
        createdAt: Date.now().toString()
    })

    await redis.expire( `session:{sessionId}`, 60 * 60 * 24 * 7)

    await redis.sadd(`user_sessions:${userId}`, sessionId)
}

export async function deleteAllSessions(userId: string){
    const sessionIds = await redis.smembers(`user_sessions:${userId}`)

    for(const id of sessionIds){
        await redis.del(`referesh:${id}`)
        await redis.del(`session:${id}`)
    }
    
    await redis.del(`user_session:${userId}`)

}

export async function getUserSessions(userId: string){
    const sessionIds = await redis.smembers(`user_session:${userId}`)
    const sessions = []

    for(const sid of sessionIds) {
        const meta = await redis.hgetall(`session:${sid}`)
        if(Object.keys(meta).length > 0){
            sessions.push({sessionId: sid, ...meta})
        }
    }

    return sessions
}