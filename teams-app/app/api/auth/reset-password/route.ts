import dbConnect from "@/lib/db";
import { User } from "@/models/User";
import { hashPassword } from "@/lib/auth/password";
import { NextResponse } from "next/server";
import { logAuditEvent } from "@/lib/audit/logger";

export async function POST(req: Request) {
    try{
        await dbConnect();
        const { token, newPassword } = await req.json();

        const user = await User.findOne({
          passwordResetToken: token,
          //passwordResetExpires: { $gt: Date.now() },
        });
        if (!user) {
          return NextResponse.json(
            { error: "Invalid or expired token" },
            { status: 400 }
          )}

          user.passwordHash = await hashPassword(newPassword);
          user.passwordResetToken = undefined;
          user.passwordResetExpires = undefined;

          await user.save();
          try{
            await logAuditEvent({
              userId: user._id.toString(),
              action: "PASSWORD_RESET"
            })
          }catch(error){
            console.log("Eroor while loging inn reset pass", error)
          }
          
          return NextResponse.json({ message: "Password reset successful" });
        }catch(error){
          console.log(error)
          return NextResponse.json({
            error: "Internal server error"
          }, {status: 500})
    }
}
  

