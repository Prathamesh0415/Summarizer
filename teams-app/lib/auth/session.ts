import crypto from "crypto"
import redis from "../redis" 

interface Session {
    sessionId: string;
    [key: string]: any; 
}

export function generateRefreshToken(): string{
    return crypto.randomBytes(64).toString("hex")
}

export function hashToken(token: string): string{
    return crypto.createHash("sha256").update(token).digest("hex")
}

export async function createSession({
    userId,
    sessionId,
    refreshToken,
    ip,
    userAgent,
}: {
    userId: string
    sessionId: string
    refreshToken: string
    ip: string
    userAgent: string
})  {
    const tokenHash = hashToken(refreshToken)

    await redis.set(
        `refresh:${sessionId}`, 
        JSON.stringify({ 
            hash: tokenHash,
            userId: userId, 
        }),
        "EX",
        60 * 60 * 24 * 7 
    )

    await redis.hset(`session:${sessionId}`, {
        userId,
        ip: ip ?? "",
        userAgent: userAgent ?? "",
        createdAt: Date.now().toString()
    })

    await redis.expire(`session:${sessionId}`, 60 * 60 * 24 * 7)

    await redis.sadd(`user_sessions:${userId}`, sessionId)
}

export async function deleteSession(sessionId: string, userId: string){
    
    //pipeline created to perform multiple operations in one go rather than waiting for one to finish then starting the next
    const pipeline = redis.pipeline()

    pipeline.del(`refresh:${sessionId}`) 
    pipeline.del(`session:${sessionId}`)
    pipeline.srem(`user_sessions:${userId}`, sessionId)

    await pipeline.exec()
}

export async function deleteAllSessions(userId: string){

    const sessionIds = await redis.smembers(`user_sessions:${userId}`)

    const pipeline = redis.pipeline(); 

    for(const id of sessionIds){
        pipeline.del(`refresh:${id}`) 
        pipeline.del(`session:${id}`)
    }
    
    pipeline.del(`user_sessions:${userId}`)
    
    await pipeline.exec();
}

export async function getUserSessions(userId: string){

    const sessionIds = await redis.smembers(`user_sessions:${userId}`)
    
    if(sessionIds.length === 0){
        return []
    }

    const pipeline = redis.pipeline()
    for(const sid of sessionIds){
        pipeline.hgetall(`session:${sid}`)
    }

    const result = await pipeline.exec()

    if(!result){
        return []
    }
    
    const sessions: Session[] = []

    sessionIds.forEach((sid, index) => {
        
        const [err, sessionData] = result[index] as [Error | null, any]; 

        if(!err && sessionData && Object.keys(sessionData).length > 0){
            sessions.push({
                sessionId: sid,
                ...sessionData
            })
        }
    })

    return sessions
}