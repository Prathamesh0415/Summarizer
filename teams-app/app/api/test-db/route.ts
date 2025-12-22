// app/api/users/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
//import User from "@/models/User"; // Assuming you have a User model

export async function GET() {
  await dbConnect(); // <--- Connects or reuses connection

//   try {
//     const users = await User.find({});
//     return NextResponse.json({ success: true, data: users });
//   } catch (error) {
//     return NextResponse.json({ success: false }, { status: 400 });
//   }
}