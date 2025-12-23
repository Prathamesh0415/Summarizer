import { NextResponse, NextRequest } from "next/server";
import { AuditLog } from "@/models/AuditLog";
import { requireRole } from "@/lib/auth/rbac";
import dbConnect from "@/lib/db";

export async function GET(req: NextRequest){
    const deny = requireRole(["ADMIN"])(req)
    if (deny) return deny
    
    await dbConnect()

    const logs = await AuditLog.find().sort({createdAt: -1}).limit(100)

    return NextResponse.json({logs})
}