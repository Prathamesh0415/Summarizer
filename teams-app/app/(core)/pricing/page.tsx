"use client";

import React, { useState } from "react";
import { Check, Zap, Crown, Shield, Loader2 } from "lucide-react";
//import { useToast } from "@/hooks/use-toast"; // Ensure you have shadcn toast hook
import { PLANS } from "@/lib/plans"; // Import your plans file

// 8bitcn Components
import { Button } from "@/components/ui/8bit/button";
import { Badge } from "@/components/ui/8bit/badge";
import { Separator } from "@/components/ui/8bit/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/8bit/card";
import { useFetch } from "@/hooks/useFetch";

// Helper to map your DB plans to UI details (Price display, icons, etc.)
const PLAN_DETAILS: Record<string, any> = {
  standard: {
    displayPrice: "$9.99",
    description: "Perfect for getting started.",
    icon: <Zap className="w-6 h-6 text-blue-500" />,
    features: ["100 Credits / month", "Basic Analytics", "Email Support"],
    color: "bg-blue-100 text-blue-700 border-blue-700",
  },
  pro: {
    displayPrice: "$29.99",
    description: "For power users who need more.",
    icon: <Shield className="w-6 h-6 text-purple-500" />,
    features: ["500 Credits / month", "Advanced Analytics", "Priority Support", "No Watermark"],
    color: "bg-purple-100 text-purple-700 border-purple-700",
    isPopular: true, // Highlights this card
  },
  enterprise: {
    displayPrice: "$99.99",
    description: "Maximum power for teams.",
    icon: <Crown className="w-6 h-6 text-yellow-600" />,
    features: ["1000 Credits / month", "Team Dashboard", "24/7 Dedicated Support", "API Access"],
    color: "bg-yellow-100 text-yellow-700 border-yellow-700",
  },
};

export default function PricingPage() {
    const fetchWithAuth = useFetch()
  const [loadingId, setLoadingId] = useState<string | null>(null);
  //const { toast } = useToast();

  const handleCheckout = async (planKey: string, priceId: string) => {
    setLoadingId(planKey);

    try {
      // 1. Call your backend to create a Stripe Session
      const res = await fetchWithAuth("/api/protected/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to start checkout");

      // 2. Redirect user to Stripe's hosted page
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error(error);
    //   toast({
    //     title: "Error",
    //     description: "Could not initiate checkout. Please try again.",
    //     variant: "destructive",
    //   });
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background font-mono py-20 px-4 md:px-10 flex flex-col items-center">
      
      <div className="text-center max-w-2xl mb-16">
        <Badge variant="outline" className="mb-4 border-2 border-black bg-yellow-300 text-black px-4 py-1">
          Simple Pricing
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Choose Your Power Level
        </h1>
        <p className="text-muted-foreground text-lg">
          Unlock more credits and features to summarize everything faster.
        </p>
      </div>

      {/* PLANS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl w-full">
        {Object.entries(PLANS).map(([key, plan]) => {
          const details = PLAN_DETAILS[key] || {};
          const isPopular = details.isPopular;

          return (
            <Card 
              key={key}
              className={`relative flex flex-col border-2 border-black transition-transform duration-300 hover:-translate-y-2
                ${isPopular ? 'shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] scale-105 z-10' : 'shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]'}
              `}
            >
              {isPopular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <Badge className="bg-primary text-primary-foreground border-2 border-black px-4 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader>
                <div className="flex justify-between items-center mb-4">
                   <div className={`p-2 rounded-lg border-2 bg-muted/20 ${details.color.split(" ")[2]}`}>
                     {details.icon}
                   </div>
                   <Badge variant="secondary" className={details.color}>
                     {plan.name}
                   </Badge>
                </div>
                <CardTitle className="text-3xl font-bold">
                  {details.displayPrice}
                  <span className="text-base font-normal text-muted-foreground">/mo</span>
                </CardTitle>
                <CardDescription className="mt-2 text-sm">
                   {details.description}
                </CardDescription>
              </CardHeader>

              <Separator className="bg-black/10" />

              <CardContent className="flex-1 py-6">
                <ul className="space-y-3">
                  {/* Credits Feature (From your DB file) */}
                  <li className="flex items-center gap-3 font-bold">
                    <div className="bg-green-100 text-green-700 p-0.5 rounded-full border border-green-700">
                      <Check className="w-3 h-3" />
                    </div>
                    {plan.credits} Credits Included
                  </li>

                  {/* Visual Features (From local map) */}
                  {details.features?.slice(1).map((feature: string, i: number) => (
                    <li key={i} className="flex items-center gap-3 text-muted-foreground text-sm">
                      <Check className="w-4 h-4 text-black/40" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pb-8 pt-2">
                <Button 
                  className={`w-full h-12 text-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all
                    ${isPopular ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}
                  `}
                  onClick={() => handleCheckout(key, plan.priceId)}
                  disabled={!!loadingId}
                >
                  {loadingId === key ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    "Buy Plan"
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <p className="mt-12 text-sm text-muted-foreground text-center">
        Payments are secured by Stripe. You can cancel at any time.
      </p>
    </div>
  );
}