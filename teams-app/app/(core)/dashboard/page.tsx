"use client";

import React, { useEffect, useState } from "react";
import {
  FileText,
  Clock,
  Zap,
  Loader2,
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";

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
} from "@/components/ui/8bit/card";

// shadcn/ui Dialog (Popup)
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import Link from "next/link";

// -------------------- TYPES --------------------
interface Summary {
  _id: string;
  title: string;
  type: "video" | "article" | "text";
  createdAt: string;
  originalLength?: string;
}

// -------------------- COMPONENT --------------------
export default function DashboardPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const fetchWithAuth = useFetch();

  const [recentSummaries, setRecentSummaries] = useState<Summary[]>([]);
  const [isSummariesLoading, setIsSummariesLoading] = useState(true);

  // 🔔 Stripe success popup
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // -------------------- USER STATS --------------------
  const totalSummaries = Number(user?.totalSummaries) || 0;
  const credits = user?.credits || 0;
  const planName = user?.planName || "Free";

  const timeSavedMinutes = totalSummaries * 20;
  const timeSavedHours = Math.round(timeSavedMinutes / 60);

  // -------------------- STRIPE SUCCESS HANDLER --------------------
  useEffect(() => {
    const success = searchParams.get("success");

    if (success === "true") {
      setShowSuccessModal(true);

      // Clean URL so popup doesn't reappear
      const params = new URLSearchParams(searchParams.toString());
      params.delete("success");
      router.replace(`/dashboard?${params.toString()}`, { scroll: false });
    }
  }, [searchParams, router]);

  // -------------------- FETCH RECENT SUMMARIES --------------------
  useEffect(() => {
    const loadRecent = async () => {
      if (!user) return;

      try {
        setIsSummariesLoading(true);
        const res = await fetchWithAuth("/api/protected/my-summaries?limit=2");
        const data = await res.json();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // -------------------- LOADING --------------------
  if (isAuthLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // -------------------- RENDER --------------------
  return (
    <>
      {/* ✅ Stripe Success Popup */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="border-2 border-black bg-black text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <DialogHeader>
            <DialogTitle className="text-green-400 text-xl">
              Payment Successful 🎉
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Your credits have been added to your account.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end mt-4">
            <Button onClick={() => setShowSuccessModal(false)}>
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-10">
        {/* -------------------- STATS -------------------- */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-6">
            Dashboard Overview
          </h2>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Summaries
                </CardTitle>
                <FileText className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalSummaries}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Lifetime generated
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Time Saved
                </CardTitle>
                <Clock className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{timeSavedHours}h</div>
                <p className="text-xs text-muted-foreground mt-1">
                  ~20 mins saved per summary
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Credits
                </CardTitle>
                <Zap className="h-5 w-5 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{credits}</div>
                <p className="text-xs text-muted-foreground mt-1 capitalize">
                  {planName} plan
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* -------------------- RECENT HISTORY -------------------- */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Recent History</h3>
            <Link href="my-summaries">
              <Button
                variant="outline"
                size="sm"
                className="border-2 border-black"
              >
                View All
              </Button>
            </Link>
          </div>

          <div className="w-full rounded-md border-2 border-muted bg-background">
            <div className="grid grid-cols-12 gap-4 border-b-2 border-muted p-4 font-medium text-muted-foreground">
              <div className="col-span-6">Content Title</div>
              <div className="col-span-3 text-center">Type</div>
              <div className="col-span-3 text-center">Date</div>
            </div>

            <div className="flex flex-col">
              {isSummariesLoading ? (
                <div className="flex h-24 items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading history...
                </div>
              ) : recentSummaries.length === 0 ? (
                <div className="flex h-24 items-center justify-center text-muted-foreground">
                  No summaries found. Start by creating one!
                </div>
              ) : (
                recentSummaries.map((summary) => (
                  <div
                    key={summary._id}
                    className="grid grid-cols-12 gap-4 border-b border-muted p-4 hover:bg-muted/10 items-center"
                  >
                    <div className="col-span-6 truncate font-medium">
                      {summary.title}
                    </div>

                    <div className="col-span-3 flex justify-center">
                      <Badge variant="outline" className="capitalize">
                        {summary.type}
                      </Badge>
                    </div>

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
    </>
  );
}
