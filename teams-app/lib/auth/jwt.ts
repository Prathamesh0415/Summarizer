import { SignJWT, jwtVerify } from "jose";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

// jose requires the secret to be a Uint8Array, not a simple string
const SECRET_KEY = new TextEncoder().encode(ACCESS_TOKEN_SECRET);

//console.log(SECRET_KEY)

export interface AccessTokenPayload {
  userId: string;
  // role: "USER" | "ADMIN";
  sessionId: string;
}

export async function signAccessToken(payload: AccessTokenPayload) {
  return await new SignJWT({ 
      userId: payload.userId, 
      //role: payload.role, 
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

    // Manual Type Guarding for extra safety
    if (
      typeof payload !== "object" ||
      !payload.userId ||
      // !payload.role ||
      !payload.sessionId
    ) {
      throw new Error("Invalid access token payload");
    }

    return {
      userId: payload.userId as string,
      // role: payload.role as "USER" | "ADMIN",
      sessionId: payload.sessionId as string,
    };
  } catch (error) {
    // Retrowing simplifies handling in middleware
    throw error;
  }
}