import { NextResponse, NextRequest } from "next/server";
import { deleteAllSessions } from "@/lib/auth/session";
import { getAuthContext } from "@/lib/auth/context";
import { logAuditEvent } from "@/lib/audit/logger";

export async function POST(req: NextRequest){
    const { userId } = getAuthContext(req)
    await deleteAllSessions(userId)

    await logAuditEvent({
        userId,
        action: "LOGOUT_ALL",
    });


    return NextResponse.json({
        success:true,
        message: "logged out from all device"
    })
}

