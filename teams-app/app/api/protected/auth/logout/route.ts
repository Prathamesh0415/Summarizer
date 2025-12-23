import { NextResponse, NextRequest } from "next/server";
import { deleteSession} from "@/lib/auth/session";
import { getAuthContext } from "@/lib/auth/context";
import { logAuditEvent } from "@/lib/audit/logger";

export async function POST(req: NextRequest){
    const { userId, sessionId } = getAuthContext(req)
    await deleteSession(userId, sessionId)

    await logAuditEvent({
        userId,
        action: "LOGOUT",
        ip: req.headers.get("x-forwarded-for"),
        userAgent: req.headers.get("user-agent"),
        metadata: { sessionId },
    });


    return NextResponse.json({
        success:true,
        message: "logged out from current device"
    })
}

