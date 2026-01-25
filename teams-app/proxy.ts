import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "./lib/auth/jwt"; 

export async function proxy(req: NextRequest) {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    const token = authHeader.split(" ")[1];

    try {
        const payload = await verifyAccessToken(token);

        const requestHeaders = new Headers(req.headers);
        requestHeaders.set("x-user-id", payload.userId);
        requestHeaders.set("x-session-id", payload.sessionId);
        
        return NextResponse.next({
            request: {
                headers: requestHeaders
            }
        });
    
    } catch (error) {
        console.error("Middleware auth error:", error); 
        return NextResponse.json(
            { error: "Invalid or expired token" },
            { status: 401 }
        );
    }
}

export const config = {
    matcher: ["/api/protected/:path*"]
};