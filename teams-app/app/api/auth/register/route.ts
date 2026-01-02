import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import { User } from "@/models/User";
import { hashPassword } from "@/lib/auth/password";
import crypto from "crypto";
import { rateLimit } from "@/lib/security/rateLimit";
import { logAuditEvent } from "@/lib/audit/logger";
import { loginSchema } from "@/lib/validators/auth"; // Reusing the same schema for email/pass rules
import { sendVerificationEmail } from "@/lib/mail";

export async function POST(req: NextRequest){
    try{
        // 1. Rate Limiting ("Token Check")
        const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";

        const { allowed } = await rateLimit({
            key: `rl:register:ip:${ip}`, // Distinct key for registration
            limit: 3, // Stricter limit for account creation (3 per 10 mins)
            windowInSeconds: 600
        });

        if(!allowed){
            await logAuditEvent({
                action: "REGISTER_FAILED",
                metadata: { reason: "rate_limited", ip }
            });

            return NextResponse.json({
                error: "Too many accounts created from this IP. Please try again later."
            }, { status: 429 });
        }
    }catch(error){
        console.log("Error in rate limiter", error);
    }

    try{
        await dbConnect();
        const body = await req.json();

        // 2. Zod Validation
        const validation = loginSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                error: "Invalid inputs",
                details: validation.error.flatten().fieldErrors
            }, { status: 400 });
        }

        const { email, password } = validation.data;

        // 3. Existing Logic
        const existingUser = await User.findOne({ email });
        
        if(existingUser){
            return NextResponse.json(
                {error: "Email already registered"},
                {status: 400}
            );
        }

        const passwordHash = await hashPassword(password);
        
        const user = await User.create({
            email,
            passwordHash,
            emailVerified: false,
            planName: "free"

        });

        const token = crypto.randomBytes(32).toString("hex");

        user.emailVerificationToken = token;
        user.emailVerificationExpiry = Date.now() + 15 * 60 * 1000; // 15 mins
        await user.save();

        await logAuditEvent({
            action: "REGISTER_SUCCESS",
            userId: user._id.toString(),
            ip: req.headers.get("x-forwarded-for"),
            metadata: { email }
        });

        await sendVerificationEmail(email, token)

        return NextResponse.json({
            success: true,
            message: "User registered successfully"
        });

    }catch(error){
        console.error("Register Error:", error);
        return NextResponse.json({
            error: "Internal server error at Register"
        }, {status: 500});
    }
}