import { NextResponse, NextRequest } from "next/server";
import { deleteSession} from "@/lib/auth/session";
import { getAuthContext } from "@/lib/auth/context";

export async function POST(req: NextRequest){
    const { userId, sessionId } = getAuthContext(req)
    await deleteSession(userId, sessionId)

    return NextResponse.json({
        success:true,
        message: "logged out from current device"
    })
}

