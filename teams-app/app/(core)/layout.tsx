"use client"

import React, { useState, useEffect } from "react"; // Added useEffect for debugging
import { 
  Search, 
  Plus, 
  LogOut, 
  Settings, 
  User 
} from "lucide-react";

import { DesktopSidebar, MobileSidebar } from "@/components/sidebar/Sidebar"; 
import { Button } from "@/components/ui/8bit/button";
import { Input } from "@/components/ui/8bit/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/8bit/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/8bit/dropdown-menu";
import Link from "next/link";
import { useFetch } from "@/hooks/useFetch";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const fetchWithAuth = useFetch()
    
    // 1. Destructure 'isLoading' to prevent rendering before data arrives
    const { setAccessToken, user, isLoading } = useAuth() 
    const router = useRouter()
    
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // 2. DEBUG: Check your browser console to see what is happening
    useEffect(() => {
        console.log("AppLayout Auth State:", { isLoading, user });
    }, [isLoading, user]);

    const getUserInitials = () => {
        if (!user || !user.username) return "JD";
        return user.username.substring(0, 2).toUpperCase();
    }

    const handleLogout = async () => {
        try {
            await fetchWithAuth("/api/protected/auth/logout", {
                method: "POST",
            });
        } catch (error) {
            console.error("Logout request failed", error);
        } finally {
            setAccessToken(null);
            router.push("/"); // Redirect to login page
        }
    };

    // 3. SHOW A LOADING SCREEN (Optional but recommended)
    // This prevents the "logged out" UI from flashing while we check cookies
    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background font-mono">
                <div className="text-xl font-bold animate-pulse">Loading User Data...</div>
            </div>
        );
    }

  return (
    <div className="flex min-h-screen bg-background font-mono">
      
      <DesktopSidebar 
        className="hidden md:flex h-screen sticky top-0" 
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className="flex-1 flex flex-col min-h-screen transition-all duration-300">
        
        <header className="sticky top-0 z-50 flex h-20 items-center justify-between border-b-4 border-muted px-6 md:px-10 bg-background/95 backdrop-blur">
          
          <div className="md:hidden">
            <MobileSidebar />
          </div>

          <div className="hidden md:flex w-full max-w-md items-center gap-2 ml-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-10 border-2 border-muted" />
            </div>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <Link href="summarize">
            <Button size="sm" className="hidden sm:flex gap-2 border-2 border-black bg-green-600 hover:bg-green-700 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Plus size={16} /> <span className="hidden lg:inline">New Summary</span>
            </Button>
            </Link>

            <Button 
                variant="ghost" 
                onClick={handleLogout}
                className="w-40 justify-start gap-3 mt-2 text-red-600 hover:bg-red-50 hover:text-red-700 hover:underline"
            >
                <LogOut size={18} />
                Log Out
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full border-2 border-black p-0 overflow-hidden">
                  <Avatar className="h-full w-full">
                    {/* Updated to use optional chaining just in case */}
                    <AvatarImage src="/placeholder-avatar.jpg" alt={user?.username || "@user"} />
                    <AvatarFallback className="bg-yellow-300 text-black font-bold">
                        {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" align="end">
                <DropdownMenuLabel>
                    {/* Logic to display User Data */}
                    {user ? (
                        <div className="flex flex-col space-y-1">
                            <span className="font-bold">{user.username}</span>
                            <span className="text-xs font-normal text-muted-foreground break-all">{user.email}</span>
                            <span className="text-xs font-bold text-green-600 pt-1">
                              {user.planName} Plan
                            </span>
                            <span className="text-xs font-bold text-green-600 pt-1">
                              {user.credits} Credits
                            </span>
                        </div>
                    ) : (
                        "My Account"
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600"><LogOut className="mr-2 h-4 w-4" /> Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-10">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
        
      </div>
    </div>
  );
}