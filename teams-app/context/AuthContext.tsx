"use client"

import { createContext, useContext, ReactNode, useState, useEffect } from "react"

interface User {
    _id: string;
    email: string;
    username: string;
    credits: number;
    planName: string
    totalSummaries: number
}

interface AuthContextType {
    accessToken: string | null;
    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>
    setAccessToken: (token: string | null) => void;
    isLoading: boolean; // Add loading state so you don't redirect while checking auth
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children } : {children: ReactNode}){
    const [accessToken, setAccessToken] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true) // Start loading by default
    const [user, setUser] = useState<User | null>(null)

    useEffect(() => {
        // Define the silent refresh logic
        const refreshAuth = async () => {
            try {
                // Call your backend refresh endpoint
                // The browser automatically attaches the HttpOnly cookie!
                const res = await fetch("/api/auth/refresh", {
                    method: "POST", 
                });

                console.log(res)

                if (res.ok) {
                    const data = await res.json();
                    setAccessToken(data.accessToken);
                    setUser(data.user)
                } else {
                    // If refresh fails (token expired/invalid), ensure we are logged out
                    setAccessToken(null);
                    setUser(null)
                }
            } catch (error) {
                console.error("Silent refresh failed", error);
                setAccessToken(null);
                setUser(null)
            } finally {
                setIsLoading(false); // Auth check is done
            }
        };

        refreshAuth();
    }, []);

    return (
        <AuthContext.Provider value={{ accessToken, user, setUser, setAccessToken, isLoading }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if(context === undefined){
        throw new Error("useAuth must be within an AuthProvider")
    }
    return context
}