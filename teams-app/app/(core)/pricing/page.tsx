"use client";

import React, { useState } from "react";
import { Check, Zap, Crown, Shield, Loader2, X, Terminal } from "lucide-react";
import { PLANS } from "@/lib/plans";
import { useFetch } from "@/hooks/useFetch";

// 8bitcn / UI Components
import { Button } from "@/components/ui/8bit/button";
import { Badge } from "@/components/ui/8bit/badge";
import { Separator } from "@/components/ui/8bit/separator";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/8bit/card";

// --- 1. CONFIG: Visual Themes (Adaptive) ---
const PLAN_DETAILS: Record<string, any> = {
  standard: {
    displayPrice: "$9.99",
    description: "For casual players.",
    icon: <Zap className="w-6 h-6 text-white" />,
    features: ["100 Credits", "Basic Analytics", "Email Support"],
    // Blue Retro Theme
    headerColor: "bg-blue-600 dark:bg-blue-700",
    buttonColor: "bg-white text-black hover:bg-blue-50 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700",
    featureIconColor: "bg-blue-600",
  },
  pro: {
    displayPrice: "$29.99",
    description: "For power users.",
    icon: <Shield className="w-6 h-6 text-white" />,
    features: ["500 Credits", "Advanced Analytics", "Priority Support", "No Watermark"],
    isPopular: true,
    // Purple Synthwave Theme
    headerColor: "bg-purple-600 dark:bg-purple-700",
    buttonColor: "bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600",
    featureIconColor: "bg-purple-600",
  },
  enterprise: {
    displayPrice: "$99.99",
    description: "For the boss.",
    icon: <Crown className="w-6 h-6 text-black" />,
    features: ["1000 Credits", "Team Dashboard", "24/7 Dedicated Support", "API Access"],
    // Amber/Gold Industrial Theme
    headerColor: "bg-amber-400 dark:bg-amber-500",
    buttonColor: "bg-white text-black hover:bg-amber-50 dark:bg-amber-400 dark:hover:bg-amber-500",
    featureIconColor: "bg-amber-500",
  },
};

// --- 2. COMPONENT: Retro System Popup ---
function RetroPopup({ message, onClose }: { message: string; onClose: () => void }) {
  if (!message) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-zinc-100 dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[12px_12px_0px_0px_#000] dark:shadow-[12px_12px_0px_0px_#fff]">
        <div className="bg-red-600 text-white px-3 py-1 flex justify-between items-center border-b-4 border-black dark:border-white">
          <span className="font-bold font-mono text-sm uppercase flex items-center gap-2">
            <Terminal className="w-4 h-4" /> System_Error.exe
          </span>
          <button onClick={onClose} className="hover:bg-red-800 active:translate-y-1 transition-transform">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-8 flex flex-col items-center text-center gap-6">
          <div className="text-5xl animate-bounce">💣</div>
          <p className="font-bold font-mono text-lg text-black dark:text-white">{message}</p>
          <Button 
            onClick={onClose}
            className="w-full border-2 border-black dark:border-white dark:text-white shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
          >
            ACKNOWLEDGE
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- 3. MAIN PAGE ---
export default function PricingPage() {
  const fetchWithAuth = useFetch();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleCheckout = async (planKey: string, priceId: string) => {
    setLoadingId(planKey);
    setErrorMsg("");

    try {
      const res = await fetchWithAuth("/api/protected/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Connection refused by server.");
      if (data.url) window.location.href = data.url;
      
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "Critical Failure. Try again.");
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen font-mono bg-[#f0f0f0] dark:bg-zinc-950 flex flex-col items-center py-10 px-4 relative overflow-hidden transition-colors duration-300">
      
      {/* Background Pattern (Adaptive) */}
      <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
      />

      {errorMsg && <RetroPopup message={errorMsg} onClose={() => setErrorMsg("")} />}

      {/* HEADER */}
      <div className="relative z-10 text-center max-w-2xl mb-25 space-y-6">
        <Badge variant="outline" className="bg-white dark:bg-zinc-900 text-black dark:text-white border-2 border-black dark:border-white px-4 py-1.5 text-sm shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff]">
          NO SUBSCRIPTIONS • ONE-TIME PAYMENT
        </Badge>
        <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter text-black dark:text-white transition-colors" style={{ textShadow: '4px 4px 0px rgba(0,0,0,0.1)' }}>
          Choose Your Loadout
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-lg max-w-lg mx-auto leading-relaxed">
          Unlock premium credits instantly. Secure your upgrade and get back to the game.
        </p>
      </div>

      {/* PLANS GRID */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full items-center">
        {Object.entries(PLANS).map(([key, plan]) => {
          const details = PLAN_DETAILS[key] || {};
          const isPopular = details.isPopular;

          return (
            <Card 
              key={key}
              className={`
                relative flex flex-col border-[3px] border-black dark:border-white bg-white dark:bg-zinc-900 overflow-visible
                transition-all duration-300
                ${isPopular 
                  ? 'scale-105 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] dark:shadow-[16px_16px_0px_0px_rgba(255,255,255,1)] z-20 md:-mt-4' 
                  : 'shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] hover:-translate-y-1'
                }
              `}
            >
              {/* Popular Badge (Floating) */}
              {isPopular && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-30">
                  <div className="bg-yellow-400 text-black text-xs font-black border-[3px] border-black px-4 py-1.5 uppercase tracking-widest shadow-[4px_4px_0px_0px_#000] rotate-2">
                    Best Value
                  </div>
                </div>
              )}

              {/* COLORED HEADER BLOCK */}
              <div className={`${details.headerColor} p-6 border-b-[3px] border-black dark:border-white flex justify-between items-center`}>
                <h3 className={`text-2xl font-black uppercase tracking-tight ${key === 'enterprise' ? 'text-black' : 'text-white'}`}>
                  {plan.name}
                </h3>
                <div className="bg-black/10 p-2 rounded-md border-2 border-black/20 backdrop-blur-sm">
                  {details.icon}
                </div>
              </div>

              <CardHeader className="pt-8 pb-2 text-center">
                <div className="flex justify-center items-baseline gap-1">
                  {/* PRICE TEXT VISIBILITY FIX */}
                  <span className="text-5xl font-black tracking-tighter text-black dark:text-white">
                    {details.displayPrice}
                  </span>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 font-bold text-sm uppercase tracking-wide mt-2">
                  {details.description}
                </p>
              </CardHeader>

              <div className="px-6">
                 <Separator className="bg-zinc-200 dark:bg-zinc-700 h-[2px]" />
              </div>

              <CardContent className="flex-1 py-8 px-6">
                <ul className="space-y-4">
                  {/* HERO FEATURE */}
                  <li className="flex items-center gap-4 font-bold text-black dark:text-white bg-zinc-50 dark:bg-zinc-800 p-3 border-2 border-black dark:border-zinc-600 rounded-sm shadow-sm">
                    <div className={`${details.featureIconColor} text-white p-1 rounded-sm`}>
                      <Check className="w-3 h-3" />
                    </div>
                    {plan.credits} Credits
                  </li>

                  {/* STANDARD FEATURES */}
                  {details.features?.slice(1).map((feature: string, i: number) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-medium text-zinc-600 dark:text-zinc-300">
                      <div className="w-1.5 h-1.5 bg-zinc-300 dark:bg-zinc-600 rounded-full" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pb-8 px-6">
                <Button 
                  className={`
                    w-full h-14 text-lg font-bold border-[3px] border-black dark:border-white uppercase tracking-wide
                    shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff]
                    hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all
                    ${details.buttonColor}
                  `}
                  onClick={() => handleCheckout(key, plan.priceId)}
                  disabled={!!loadingId}
                >
                  {loadingId === key ? (
                    <div className="flex items-center gap-1">
                      <Loader2 className="h-5 w-5 animate-spin" /> Processing...
                    </div>
                  ) : (
                    <>Buy</>
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <div className="mt-20 flex items-center gap-2 text-zinc-400 dark:text-zinc-500 text-sm font-medium bg-white dark:bg-zinc-900 px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-full shadow-sm">
         <Shield className="w-4 h-4 text-green-500" />
         <span>Transactions secured by <span className="text-black dark:text-white font-bold">Stripe</span> 256-bit SSL</span>
      </div>
    </div>
  );
}