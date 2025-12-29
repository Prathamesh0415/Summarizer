"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginInput } from "@/lib/validators/auth";
import { cn } from "@/lib/utils";

// 1. UPDATED IMPORTS: Using the 8-bit components
import { Button } from "@/components/ui/8bit/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/8bit/card";
import { Input } from "@/components/ui/8bit/input";
import { Label } from "@/components/ui/8bit/label";
// Keeping standard Alert as no 8-bit version was provided
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LoginPageProps {
  type: "login" | "register"
}

export default function LoginPage({type}: LoginPageProps) {
  const { setAccessToken, accessToken } = useAuth();
  const router = useRouter();
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: isFormSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!isLoading && accessToken) {
      router.replace("/dashboard");
    }
  }, [isLoading, accessToken, router]);

  async function handleLogin(data: LoginInput) {
    setIsLoading(true);
    setError(null);

    try {
        if(type === "login"){
          const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const responseData = await res.json();

        if (!res.ok) {
          throw new Error(responseData.error || "Login failed");
        }

        setAccessToken(responseData.accessToken);
        router.push("/dashboard");
      }else{
          const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const responseData = await res.json();

        if (!res.ok) {
          throw new Error(responseData.error || "Register failed");
        }

        setAccessToken(responseData.accessToken);
        router.push("/login");
      }
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className={cn("flex flex-col gap-6 w-full max-w-md")}>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{
                type === "login" ? "login"
                : "register"
              }</CardTitle>
            <CardDescription className="text-xs">{
                type == "login" ? "Enter your email below to login to your account"
                : "Enter you email to register"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(handleLogin)}>
              <div className="flex flex-col gap-6">
                
                {/* Error Alert Display */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Email Field */}
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    {...register("email")}
                    className={errors.email ? "border-red-500 ring-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>
                  )}
                </div>

                {/* Password Field */}
                <div className="grid gap-2">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <Label htmlFor="password">Password</Label>
                    {
                      type === "login" ? (
                        <a
                          href="/forgot-password"
                          className="inline-block text-xs underline-offset-4 hover:underline"
                        >
                          Forgot password?
                        </a>
                      ):(
                        null
                      )
                    }
                  </div>
                  <Input
                    id="password"
                    type="password"
                    {...register("password")}
                    className={errors.password ? "border-red-500 ring-red-500" : ""}
                  />
                  {errors.password && (
                    <p className="text-xs text-red-500 font-medium">{errors.password.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || isFormSubmitting}
                >
                  {isLoading || isFormSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {type === "login" ? "Signing In..." : "Registering"}
                    </>
                  ) : (
                    type === "login" ? "login" : "register"
                  )}
                </Button>
              </div>
              {
                type === "login" ? (
                  <div className="mt-4 text-center text-xs">
                    Don&apos;t have an account?{" "}
                    <a href="/register" className="underline underline-offset-4">
                      Register
                    </a>
                  </div>
                ):(
                  <div className="mt-4 text-center text-xs">
                    Already have an account?{" "}
                    <a href="/login" className="underline underline-offset-4">
                      Login
                    </a>
                  </div>
                )
              }
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}