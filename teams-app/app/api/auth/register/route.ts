import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import { User } from "@/models/User";
import { hashPassword } from "@/lib/auth/password";
import crypto from "crypto"

export async function POST(req: NextRequest){
    await dbConnect()
    const { email, password } = await req.json()
    if(!email || !password){
        return NextResponse.json(
            {error: "Missing fields"},
            { status: 400 }
        )
    }
    const existingUser = await User.findOne({ email })
    if(existingUser){
        return NextResponse.json(
            {error: "Email already registered"},
            {status: 400}
        )
    }
    const passwordHash = await hashPassword(password)
    const user = await User.create({
        email,
        passwordHash,
        emailVerified: false
    })

    const token = crypto.randomBytes(32).toString("hex")

    //for now use mongo db for storing these tokens, later shift them to redis
    user.emailVerificationToken = token
    user.emailVerificationExpiry = Date.now() + 15 * 60 * 1000
    await user.save()

    //TODO: email verification
    console.log("please do email verification")

    return NextResponse.json({
        success: true,
        message: "User registered successfully"
    })

}