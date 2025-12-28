"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email address...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }

    // Call the API automatically when the page loads
    const verify = async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${token}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          //body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          setMessage("Your email has been successfully verified.");
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed.");
        }
      } catch (error) {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    };

    verify();
  }, [token]);

  return (
    <Card className="w-full max-w-md shadow-lg text-center">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Email Verification</CardTitle>
        <CardDescription>
          {status === "loading" && "Please wait while we verify your token."}
          {status === "success" && "You're all set!"}
          {status === "error" && "Verification failed."}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col items-center justify-center gap-4 py-6">
        {status === "loading" && (
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <p className="text-lg font-medium text-green-700">Verified!</p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-2">
            <XCircle className="h-16 w-16 text-red-500" />
            <p className="font-medium text-red-700">Invalid Token</p>
          </div>
        )}

        <p className="text-muted-foreground">{message}</p>
      </CardContent>

      <CardFooter className="flex justify-center">
        {status === "success" ? (
          <Button asChild className="w-full">
            <Link href="/login">Continue to Login</Link>
          </Button>
        ) : (
          <Button variant="ghost" asChild>
            <Link href="/login">Back to Login</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      {/* Suspense is required when using useSearchParams in Next.js App Router */}
      <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin" />}>
        <VerifyEmailForm />
      </Suspense>
    </div>
  );
}