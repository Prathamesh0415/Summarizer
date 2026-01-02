"use client"

import React, { useState } from "react";
import { 
  Search, 
  Plus, 
  LogOut, 
  Settings, 
  User 
} from "lucide-react";

// Import your Sidebar components
import { DesktopSidebar, MobileSidebar } from "@/components/sidebar/Sidebar"; 

// 8bitcn UI Imports
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
    const { setAccessToken } = useAuth()
    const router = useRouter()
    
    // 1. STATE FOR SIDEBAR
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const handleLogout = async () => {
    try {
      await fetchWithAuth("/api/protected/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout request failed, forcing client logout", error);
    } finally {
      setAccessToken(null);
      router.push("/");
    }
  };

  return (
    <div className="flex min-h-screen bg-background font-mono">
      
      {/* 1. FIXED SIDEBAR with Collapse Props */}
      <DesktopSidebar 
        className="hidden md:flex h-screen sticky top-0" 
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-h-screen transition-all duration-300">
        
        {/* SHARED HEADER */}
        <header className="sticky top-0 z-50 flex h-20 items-center justify-between border-b-4 border-muted px-6 md:px-10 bg-background/95 backdrop-blur">
          
          {/* Mobile Sidebar Trigger (Hidden on desktop) */}
          <div className="md:hidden">
            <MobileSidebar />
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex w-full max-w-md items-center gap-2 ml-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-10 border-2 border-muted" />
            </div>
          </div>

          {/* User Actions */}
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
                    <AvatarImage src="/placeholder-avatar.jpg" alt="@user" />
                    <AvatarFallback className="bg-yellow-300 text-black font-bold">JD</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer"><User className="mr-2 h-4 w-4" /> Profile</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer"><Settings className="mr-2 h-4 w-4" /> Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600"><LogOut className="mr-2 h-4 w-4" /> Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-6 md:p-10">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
        
      </div>
    </div>
  );
}