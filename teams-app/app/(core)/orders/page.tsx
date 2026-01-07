"use client";

import React, { useEffect, useState } from "react";
import { 
  Receipt, 
  Calendar, 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Download
} from "lucide-react";

// Hooks
import { useAuth } from "@/context/AuthContext";
import { useFetch } from "@/hooks/useFetch";

// 8bitcn Components
import { Button } from "@/components/ui/8bit/button";
import { Badge } from "@/components/ui/8bit/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/8bit/card";

interface Order {
  _id: string;
  stripeSessionId: string;
  amount: number;      
  currency: string;
  creditsAdded: number;
  planName: string;
  status: "success" | "failed";
  createdAt: string;
}

export default function OrderHistoryPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const fetchWithAuth = useFetch();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      try {
        setIsLoading(true);
        const res = await fetchWithAuth("/api/protected/orders"); 
        const json = await res.json();

        if (res.ok && Array.isArray(json.data)) {
          setOrders(json.data);
        }
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100); 
  };

  if (isAuthLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    // 1. Centering Wrapper
    <div className="flex flex-col items-center w-full min-h-screen py-10 px-4">
      
      {/* 2. Content Container */}
      <div className="w-full max-w-5xl space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase flex items-center gap-3 text-black dark:text-white">
              <Receipt className="h-8 w-8" /> Order History
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-1 font-medium">
              View your past transactions and credit purchases.
            </p>
          </div>
          
          <Button 
            variant="outline" 
            className="border-2 border-black dark:border-zinc-400 dark:text-white dark:hover:bg-zinc-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_#fff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
          >
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>

        {/* Orders Card */}
        <Card className="border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_#fff] bg-white dark:bg-zinc-950">
          <CardHeader className="bg-zinc-100 dark:bg-zinc-900 border-b-2 border-black dark:border-white px-6 py-4">
            <CardTitle className="text-lg font-bold text-black dark:text-white">Transaction Logs</CardTitle>
            <CardDescription className="text-zinc-500 dark:text-zinc-400">
              Securely processed via Stripe.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            {/* --- Div-Based Table Header (Hidden on Mobile) --- */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-xs uppercase font-bold tracking-wider text-zinc-500 dark:text-zinc-400">
              <div className="col-span-4">Plan / Description</div>
              <div className="col-span-3">Date</div>
              <div className="col-span-2">Credits</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1 text-right">Amount</div>
            </div>

            {/* --- Div-Based Table Body --- */}
            <div className="flex flex-col">
              {isLoading ? (
                // Loading State
                [...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-center h-20 border-b border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Fetching records...
                  </div>
                ))
              ) : orders.length === 0 ? (
                // Empty State
                <div className="flex flex-col items-center justify-center h-40 gap-3 text-zinc-500 dark:text-zinc-400">
                  <CreditCard className="h-10 w-10 opacity-20" />
                  <p className="font-medium">No orders found.</p>
                </div>
              ) : (
                // Data Rows
                orders.map((order) => (
                  <div 
                    key={order._id} 
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 items-center border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                  >
                    {/* 1. Plan Name */}
                    <div className="col-span-1 md:col-span-4 flex flex-col">
                      <span className="font-bold text-base capitalize text-black dark:text-white">{order.planName} Plan</span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-500 font-mono truncate max-w-[200px]" title={order.stripeSessionId}>
                        ID: {order.stripeSessionId.slice(-8)}
                      </span>
                    </div>

                    {/* 2. Date */}
                    <div className="col-span-1 md:col-span-3 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                       <Calendar className="h-3 w-3 md:hidden lg:block" />
                       <span className="md:hidden text-xs uppercase font-bold text-zinc-400 mr-2">Date:</span>
                       {new Date(order.createdAt).toLocaleDateString(undefined, {
                         year: 'numeric',
                         month: 'short',
                         day: 'numeric'
                       })}
                    </div>

                    {/* 3. Credits Added */}
                    <div className="col-span-1 md:col-span-2">
                      <div className="flex items-center md:hidden mb-1 text-xs uppercase font-bold text-zinc-400">Credits:</div>
                      <Badge variant="outline" className="w-fit bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 font-bold">
                        +{order.creditsAdded} Credits
                      </Badge>
                    </div>

                    {/* 4. Status */}
                    <div className="col-span-1 md:col-span-2 flex items-center">
                       <span className="md:hidden text-xs uppercase font-bold text-zinc-400 mr-4">Status:</span>
                       {order.status === "success" ? (
                          <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-bold text-xs uppercase">
                            <CheckCircle2 className="h-4 w-4" /> Paid
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-bold text-xs uppercase">
                            <XCircle className="h-4 w-4" /> Failed
                          </div>
                        )}
                    </div>

                    {/* 5. Amount */}
                    <div className="col-span-1 md:col-span-1 text-left md:text-right">
                      <span className="md:hidden text-xs uppercase font-bold text-zinc-400 mr-4">Total:</span>
                      <span className="text-lg font-black tracking-tight text-black dark:text-white">
                        {formatCurrency(order.amount, order.currency)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}