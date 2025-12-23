import dbConnect from "@/lib/db";
import { AuditLog, AuditAction } from "@/models/AuditLog";

export async function logAuditEvent({
    userId,
    action,
    ip,
    userAgent,
    metadata
}: {
    userId? :string,
    action: string,
    ip?: string | null,
    userAgent?: string | null
    metadata?: Record<string, any>
}){
    try{
        await dbConnect()

        await AuditLog.create({
            userId,
            action,
            ip,
            userAgent,
            metadata
        })
    }catch(error){
        console.log("Audit log failed", error)
    }
}
