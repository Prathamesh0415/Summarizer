import { SignJWT, jwtVerify } from "jose";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

const SECRET_KEY = new TextEncoder().encode(ACCESS_TOKEN_SECRET);

export interface AccessTokenPayload {
  userId: string;
  sessionId: string;
}

export async function signAccessToken(payload: AccessTokenPayload) {
  return await new SignJWT({ 
      userId: payload.userId, 
      sessionId: payload.sessionId 
    })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(SECRET_KEY);
}

export async function verifyAccessToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      algorithms: ["HS256"],
    });

    console.log(payload)

    if (
      typeof payload !== "object" ||
      !payload.userId ||
      !payload.sessionId
    ) {
      throw new Error("Invalid access token payload");
    }

    return {
      userId: payload.userId as string,
      sessionId: payload.sessionId as string,
    };
  } catch (error) {
    console.log(error)
    throw error;
  }
}