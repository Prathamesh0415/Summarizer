import jwt, { JwtPayload } from "jsonwebtoken"

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET

export interface AccessTokenPayload {
  userId: string;
  role: "USER" | "ADMIN";
  sessionId: string;
}

export async function signAccessToken(payload: AccessTokenPayload){
    return jwt.sign(payload, ACCESS_TOKEN_SECRET!, {
        expiresIn: "15m"
    })
}

export function verifyAccessToken(token: string){
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET!, {
    algorithms: ["HS256"],
    }) as JwtPayload;

    if (
        typeof decoded !== "object" ||
        !decoded.userId ||
        !decoded.role ||
        !decoded.sessionId
        ) {
            throw new Error("Invalid access token payload");
        }

    return {
        userId: decoded.userId,
        role: decoded.role,
        sessionId: decoded.sessionId,
    };
}


