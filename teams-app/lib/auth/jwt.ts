import jwt from "jsonwebtoken"

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET

export async function signAccessToken(payload: {
    userId: string
    role: string
    sessionId: string
}){
    return jwt.sign(payload, ACCESS_TOKEN_SECRET!, {
        expiresIn: "15m"
    })
}

export function verifyAccessToken(token: string){
    return jwt.verify(token, ACCESS_TOKEN_SECRET!)
}


