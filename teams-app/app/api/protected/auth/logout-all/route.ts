import { NextResponse, NextRequest } from "next/server";
import { deleteAllSessions } from "@/lib/auth/session";
import { getAuthContext } from "@/lib/auth/context";

export async function POST(req: NextRequest){
    const { userId } = getAuthContext(req)
    await deleteAllSessions(userId)

    return NextResponse.json({
        success:true,
        message: "logged out from all device"
    })
}

