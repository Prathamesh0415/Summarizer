import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "./lib/auth/jwt";

export function middleware(req: NextRequest){
    const authHeader = req.headers.get("authorization")

    if(!authHeader || !authHeader.startsWith("Bearer ")){
        return NextResponse.json(
            {error: "Unauthorized"},
            {status: 401}
        )
    }

    const token = authHeader.split(" ")[1]

    try{

        const payload = verifyAccessToken(token)

        const requestHeaders = new Headers(req.headers)
        requestHeaders.set("x-user-id", payload.userId)
        requestHeaders.set("x-user-role", payload.role)
        requestHeaders.set("x-session-id", payload.sessionId)
        
        return NextResponse.next({
            request: {
                headers: requestHeaders
            }
        })
    
    }catch(error){
        return NextResponse.json(
            {error: "Invalid or expired tokne"},
            {status: 401}
        )
    }
}

export const config = {
    matcher:["/api/protected/:path"]
}