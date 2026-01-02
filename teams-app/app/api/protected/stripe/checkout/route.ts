import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe"
import { User } from "@/models/User";
import dbConnect from "@/lib/db";
import { getAuthContext } from "@/lib/auth/context";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest){
    try{
        const { priceId } = await req.json()
        const { userId } = await getAuthContext(req)

        await dbConnect()
        const user = await User.findOne({_id: userId})
        const sessionStripe = await stripe.checkout.sessions.create({
            customer_email: user.email,
            line_items: [{ price: priceId, quantity: 1 }],
            mode: "payment", 
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
            metadata: {
                userId: user._id.toString(),
            },
            
        });
        return NextResponse.json({ url: sessionStripe.url });
    }catch(error){
        console.log(error)
        return NextResponse.json({ error: "Internal Server Error in checkout" }, { status: 500 })
    }
}