"use client";

import React, { useEffect, useState } from "react";
import {
  FileText,
  Clock,
  Zap,
  MoreVertical,
  Loader2,
  AlertCircle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns"; // Optional: for "2 hours ago" format

// Hooks
import { useAuth } from "@/context/AuthContext";
import { useFetch } from "@/hooks/useFetch"; // Assuming you have this from previous steps

// 8bitcn Components
import { Button } from "@/components/ui/8bit/button";
import { Badge } from "@/components/ui/8bit/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/8bit/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/8bit/table";
import Link from "next/link";

// Type definition for a Summary (adjust to match your actual backend response)
interface Summary {
  _id: string;
  title: string;
  type: "video" | "article" | "text"; // mapped from your backend
  createdAt: string;
  originalLength?: string; // e.g. "12 mins"
}

export default function DashboardPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const fetchWithAuth = useFetch();
  
  const [recentSummaries, setRecentSummaries] = useState<Summary[]>([]);
  const [isSummariesLoading, setIsSummariesLoading] = useState(true);
  
  // 1. Calculate dynamic stats
  // Fallback to 0 if user data isn't loaded yet
  const totalSummaries = Number(user?.totalSummaries) || 0; 
  //console.log(totalSummaries)
  const credits = user?.credits || 0;
  const planName = user?.planName || "Free";

  // Estimate: Assuming average summary saves 20 mins
  const timeSavedMinutes = totalSummaries * 20;
  const timeSavedHours = Math.round(timeSavedMinutes / 60);

  // 2. Fetch Recent Summaries
  useEffect(() => {
    const loadRecent = async () => {
      if (!user) return; // Wait for auth
      
      try {
        setIsSummariesLoading(true);
        // Replace with your actual endpoint to get recent summaries
        const res = await fetchWithAuth("/api/protected/my-summaries?limit=2"); 
        const data = await res.json();
        
        // FIX 1: Read from data.data instead of data.summaries
        if (res.ok && Array.isArray(data.data)) {
           setRecentSummaries(data.data);
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setIsSummariesLoading(false);
      }
    };

    loadRecent();
    // FIX 2: Removed fetchWithAuth to stop infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Loading State
  if (isAuthLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      
      {/* Stats Overview */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-6">Dashboard Overview</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          
          {/* Stat Card 1: Total Summaries */}
          <Card className="border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)] hover:translate-y-[-2px] transition-transform">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Summaries</CardTitle>
              <FileText className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalSummaries}</div>
              <p className="text-xs text-muted-foreground mt-1">Lifetime generated</p>
            </CardContent>
          </Card>

          {/* Stat Card 2: Time Saved (Calculated) */}
          <Card className="border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)] hover:translate-y-[-2px] transition-transform">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
              <Clock className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{timeSavedHours}h</div>
              <p className="text-xs text-muted-foreground mt-1">~20 mins saved per summary</p>
            </CardContent>
          </Card>

          {/* Stat Card 3: Credits (From User Context) */}
          <Card className="border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)] hover:translate-y-[-2px] transition-transform">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credits</CardTitle>
              <Zap className="h-5 w-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{credits}</div>
              <p className="text-xs text-muted-foreground mt-1 capitalize">{planName} plan</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Recent History</h3>
          <Link href="my-summaries">
          <Button variant="outline" size="sm" className="border-2 border-black">View All</Button>
          </Link>
        </div>
        
        {/* Added w-full here */}


<div className="w-full rounded-md border-2 border-muted bg-background">
  {/* Header Row */}
  <div className="grid grid-cols-12 gap-4 border-b-2 border-muted p-4 font-medium text-muted-foreground">
    <div className="col-span-6">Content Title</div>
    <div className="col-span-3 text-center">Type</div>
    <div className="col-span-3 text-center">Date</div>
  </div>

  {/* Body Content */}
  <div className="flex flex-col">
    {isSummariesLoading ? (
      /* Loading State */
      <div className="flex h-24 items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading history...
      </div>
    ) : recentSummaries.length === 0 ? (
      /* Empty State */
      <div className="flex h-24 items-center justify-center text-muted-foreground">
        No summaries found. Start by creating one!
      </div>
    ) : (
      /* Data Rows */
      recentSummaries.map((summary) => (
        <div
          key={summary._id}
          className="grid grid-cols-12 gap-4 border-b border-muted p-4 transition-colors hover:bg-muted/10 items-center"
        >
          {/* 1. Title Column */}
          <div className="col-span-6 flex items-center gap-3 overflow-hidden">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded border text-[10px] font-bold
                ${
                  summary.type === "video"
                    ? "bg-red-100 border-red-200 text-red-600"
                    : "bg-blue-100 border-blue-200 text-blue-600"
                }`}
            >
              {summary.type === "video" ? "YT" : "DOC"}
            </div>
            <span className="truncate font-medium" title={summary.title}>
              {summary.title}
            </span>
          </div>

          {/* 2. Type Column */}
          <div className="col-span-3 flex justify-center">
            <Badge
              variant="outline"
              className={`capitalize border ${
                summary.type === "video"
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-blue-50 text-blue-700 border-blue-200"
              }`}
            >
              {summary.type}
            </Badge>
          </div>

          {/* 3. Date Column */}
          <div className="col-span-3 text-center text-sm text-muted-foreground">
            {new Date(summary.createdAt).toLocaleDateString()}
          </div>
        </div>
      ))
    )}
  </div>
</div>
      </div>

    </div>
  );
}