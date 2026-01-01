import { NextRequest, NextResponse } from "next/server";
// Ensure your ./lib/auth/jwt file is the one we just updated with 'jose'
import { verifyAccessToken } from "./lib/auth/jwt"; 

export async function proxy(req: NextRequest) {
    const authHeader = req.headers.get("authorization");

    // 1. Check if the header exists and is formatted correctly
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    const token = authHeader.split(" ")[1];

    try {
        // 2. Verify the token
        // We MUST use 'await' here because jose's verification is asynchronous
        const payload = await verifyAccessToken(token);
        

        // console.log("hello")
        // console.log(payload)


        // 3. Set headers for the downstream API route
        const requestHeaders = new Headers(req.headers);
        requestHeaders.set("x-user-id", payload.userId);
        //requestHeaders.set("x-user-role", payload.role);
        requestHeaders.set("x-session-id", payload.sessionId);
        
        // 4. Continue the request with the new headers
        return NextResponse.next({
            request: {
                headers: requestHeaders
            }
        });
    
    } catch (error) {
        console.error("Middleware auth error:", error); // Optional logging
        return NextResponse.json(
            { error: "Invalid or expired token" },
            { status: 401 }
        );
    }
}

export const config = {
    // 5. Updated Matcher: Added '*' to handle nested routes 
    // (e.g., /api/protected/user/profile)
    matcher: ["/api/protected/:path*"]
};