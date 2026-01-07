import { headers } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { User } from "@/models/User"
import connectDB from "@/lib/db"
import { PLANS } from "@/lib/plans"
import { Order } from "@/models/Order";


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

const getCreditsForPrice = (priceId: string) => {

  const plans = PLANS;

  // 1. Get all plans as an array: [{priceId: '...', credits: 100}, ...]
  const allPlans = Object.values(plans);

  // 2. Find the one where the priceId matches
  const plan = allPlans.find((p) => p.priceId === priceId);

  // 3. Return the plan details or a default
  if (plan) {
    return { credits: plan.credits, name: plan.name };
  }
  
  // Debug log if price isn't found (check your terminal for this)
  console.error(`Price ID ${priceId} not found in PLANS config.`);
  return { credits: 0, name: 'free' };
}

export async function POST(req: Request) {
  const body = await req.text();
//   const headersList = await headers()
  const sig = req.headers.get("stripe-signature") as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
  }

  await connectDB();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const amount = session.amount_total;
    const currency = session.currency;
    const stripeSessionId = session.id;
    const paymentIntentId = session.payment_intent as string;

    // Retrieve line items to find which package was bought
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    const priceId = lineItems.data[0].price?.id;
    
    if (userId && priceId) {
      const { credits, name } = getCreditsForPrice(priceId);
      
      // CHANGE 2: Use $inc to ADD to existing credits instead of replacing them
      await User.findByIdAndUpdate(userId, {
        $inc: { credits: credits }, // Increment operator
        planName: name, // Optional: Update their "Badge" to the latest pack bought
        // Note: We don't save subscriptionId anymore
      });

      await Order.create({
          userId,
          stripeSessionId,
          stripePaymentIntentId: paymentIntentId,
          amount,
          currency,
          creditsAdded: credits,
          planName: name,
          status: "success",
        })
    }
  }

  return NextResponse.json({ received: true });
}