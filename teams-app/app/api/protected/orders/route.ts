import { NextResponse, NextRequest } from "next/server";
import { Order } from "@/models/Order";
import dbConnect from "@/lib/db";
import { getAuthContext } from "@/lib/auth/context";

export async function GET(req: NextRequest) {
  try{
    const { userId } = await getAuthContext(req);

    await dbConnect()

    const orders = await Order.find({ userId })
        .sort({ createdAt: -1 })
        .lean();

    return NextResponse.json({ data: orders });
  }catch(error){
    console.log(error)
    return NextResponse.json({
        success: false,
        message: "error fetching order history"
    })
  }
    
}
