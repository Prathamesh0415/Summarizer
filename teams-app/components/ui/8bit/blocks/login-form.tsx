"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginInput } from "@/lib/validators/auth";
import { cn } from "@/lib/utils";

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
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LoginPageProps {
  type: "login" | "register";
}

export default function LoginPage({ type }: LoginPageProps) {
  const { setAccessToken, accessToken } = useAuth();
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Helper for dynamic text
  const actionText = type === "login" ? "Login" : "Sign up";

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
    if (accessToken) {
        router.replace("/dashboard");
        return;
      }

      // 🔑 Case 2: OAuth login (temp cookie)
      const match = document.cookie
        .split("; ")
        .find(row => row.startsWith("accessTokenTemp="));

      if (match) {
        const token = match.split("=")[1];

        setAccessToken(token);

        // delete temp cookie
        document.cookie = "accessTokenTemp=; Max-Age=0; path=/";

        router.replace("/dashboard");
      }
  }, [isLoading, accessToken, router, setAccessToken]);

  async function handleLogin(data: LoginInput) {
    setIsLoading(true);
    setError(null);

    try {
      if (type === "login") {
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
      } else {
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
        router.push("/login"); // Redirect to login after register? Or dashboard directly depending on flow
      }
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  }

  // Placeholder handler for social buttons
  const handleSocialLogin = (provider: string) => {
    //console.log(`Login with ${provider}`);
    // Add your OAuth logic here
    window.location.href = "/api/auth/google"

  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className={cn("flex flex-col gap-6 w-full max-w-md")}>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl capitalize">
              {type === "login" ? "Login" : "Create an Account"}
            </CardTitle>
            <CardDescription className="text-xs">
              {type === "login"
                ? "Enter your email below to login to your account"
                : "Enter your email to create a new account"}
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
                    className={
                      errors.email ? "border-red-500 ring-red-500" : ""
                    }
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500 font-medium">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div className="grid gap-2">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <Label htmlFor="password">Password</Label>
                    {type === "login" && (
                      <a
                        href="/forgot-password"
                        className="inline-block text-xs underline-offset-4 hover:underline"
                      >
                        Forgot password?
                      </a>
                    )}
                  </div>
                  <Input
                    id="password"
                    type="password"
                    {...register("password")}
                    className={
                      errors.password ? "border-red-500 ring-red-500" : ""
                    }
                  />
                  {errors.password && (
                    <p className="text-xs text-red-500 font-medium">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Main Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || isFormSubmitting}
                >
                  {isLoading || isFormSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {type === "login" ? "Signing In..." : "Registering..."}
                    </>
                  ) : (
                    <>{type === "login" ? "Login" : "Register"}</>
                  )}
                </Button>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-muted" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                {/* Social Login Buttons */}
                <div className="flex flex-col gap-4">
                  {/* <Button
                    variant="outline"
                    type="button"
                    className="w-full gap-2"
                    onClick={() => handleSocialLogin("apple")}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className="h-5 w-5 fill-current"
                    >
                      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
                    </svg>
                    {actionText} with Apple
                  </Button> */}
                  <Button
                    variant="outline"
                    type="button"
                    className="w-full gap-2"
                    onClick={() => handleSocialLogin("google")}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className="h-5 w-5 fill-current"
                    >
                      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                    </svg>
                    {actionText} with Google
                  </Button>
                </div>
              </div>

              {/* Bottom Switcher */}
              <div className="mt-4 text-center text-xs">
                {type === "login" ? (
                  <>
                    Don&apos;t have an account?{" "}
                    <a
                      href="/register"
                      className="underline underline-offset-4"
                    >
                      Register
                    </a>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <a
                      href="/login"
                      className="underline underline-offset-4"
                    >
                      Login
                    </a>
                  </>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}