"use client";

import React from "react";
import { usePathname } from "next/navigation"; // <--- 1. Import usePathname
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  BrainCircuit,
  Menu,
  ChevronLeft,
  ChevronRight,
  Plus
} from "lucide-react";

import { Button } from "@/components/ui/8bit/button";
import { Progress } from "@/components/ui/8bit/progress";
import { ScrollArea } from "@/components/ui/8bit/scroll-area";
import {
  Card,
  CardContent,
} from "@/components/ui/8bit/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/8bit/sheet";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext"; 

// --- 1. Helper Component for Active Links ---
// This handles the "Active State" logic so you don't repeat it 4 times
interface NavButtonProps {
  href: string;
  label: string;
  icon: React.ElementType; // Type for Lucide icons
  isCollapsed?: boolean;
}

function NavButton({ href, label, icon: Icon, isCollapsed }: NavButtonProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  const btnClass = `w-full gap-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all ${
    isCollapsed ? "justify-center px-0" : "justify-start px-4"
  } ${
    isActive
      ? "bg-yellow-400 text-black hover:bg-yellow-500" // <--- ACTIVE STYLE
      : "bg-black text-white hover:bg-green-100 hover:text-black"       // <--- INACTIVE STYLE
  }`;

  return (
    <Link href={href} className="w-full">
      <Button variant="default" className={btnClass} title={label}>
        <Icon size={18} className="shrink-0" />
        {!isCollapsed && (
          <span className="whitespace-nowrap overflow-hidden text-ellipsis">
            {label}
          </span>
        )}
      </Button>
    </Link>
  );
}

// --- 2. The Menu Items ---
export function SidebarNav({ isCollapsed }: { isCollapsed?: boolean }) {
  return (
    <nav className="grid gap-2 p-4">
      <NavButton 
        href="/dashboard" 
        label="Dashboard" 
        icon={LayoutDashboard} 
        isCollapsed={isCollapsed} 
      />
      
      <NavButton 
        href="/my-summaries" 
        label="My Summaries" 
        icon={FileText} 
        isCollapsed={isCollapsed} 
      />
      
      <NavButton 
        href="/summarize" 
        label="Summarize" 
        icon={Plus} 
        isCollapsed={isCollapsed} 
      />

      <NavButton 
        href="/pricing" 
        label="Plans" 
        icon={CreditCard} 
        isCollapsed={isCollapsed} 
      />

      <NavButton 
        href="/orders" 
        label="Order History" 
        icon={CreditCard} 
        isCollapsed={isCollapsed} 
      />
    </nav>
  );
}

// --- 3. The Usage Card ---
export function SidebarUsage({ isCollapsed }: { isCollapsed?: boolean }) {
  const { user, isLoading } = useAuth();

  if (isCollapsed) return null; 
  if (isLoading || !user) return null; 

  return (
    <div className="p-4 border-t-4 border-muted bg-background mt-auto">
      <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-yellow-50/50">
        <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
          
          {/* Plan Badge */}
          <div className="bg-black text-white text-[10px] px-3 py-1 font-bold uppercase tracking-widest">
            {user.planName} Plan
          </div>

          {/* Big Credit Count */}
          <div className="py-2">
             <div className="text-5xl font-black text-black tracking-tighter">
                {user.credits}
             </div>
             <p className="text-xs font-bold text-muted-foreground uppercase mt-1">
                Credits Remaining
             </p>
          </div>
          
          {/* Action Button */}
          <Button 
            size="sm" 
            className="w-full h-9 border-2 border-black bg-white hover:bg-green-100 text-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            Add Credits
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}

// --- 4. Desktop Sidebar Component ---
interface DesktopSidebarProps {
  className?: string;
  isCollapsed: boolean;      
  toggleSidebar: () => void; 
}

export function DesktopSidebar({ className, isCollapsed, toggleSidebar }: DesktopSidebarProps) {
  return (
    <aside 
      className={`hidden md:flex flex-col border-r-4 border-muted bg-muted/20 transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-72"
      } ${className}`}
    >
      {/* Header with Toggle Button */}
      <div className={`flex h-20 items-center border-b-4 border-muted bg-background px-4 ${isCollapsed ? "justify-center" : "justify-between"}`}>
        
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-sm border-2 border-black shrink-0">
            <BrainCircuit size={20} />
          </div>
          {!isCollapsed && (
            <span className="text-xl font-bold tracking-tight whitespace-nowrap">Summ.AI</span>
          )}
        </div>

        {/* The Toggle Button */}
        {!isCollapsed && (
           <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-8 w-8">
             <ChevronLeft size={16} />
           </Button>
        )}
      </div>
      
      {/* If collapsed, show the expand button at the top */}
      {isCollapsed && (
         <div className="flex justify-center py-2 border-b-2 border-muted">
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-8 w-8">
               <ChevronRight size={16} />
            </Button>
         </div>
      )}

      <ScrollArea className="flex-1">
        <SidebarNav isCollapsed={isCollapsed} />
      </ScrollArea>

      <SidebarUsage isCollapsed={isCollapsed} />
    </aside>
  );
}

// --- 5. Mobile Sidebar ---
export function MobileSidebar() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden border-2 border-black fixed top-4 left-4 z-50 bg-white">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 flex flex-col border-r-4 border-black">
        <SheetHeader className="h-20 flex items-center justify-center border-b-4 border-muted bg-background">
          <SheetTitle className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-sm border-2 border-black">
               <BrainCircuit size={20} />
            </div>
            <span>Summ.AI</span>
          </SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="flex-1">
          <SidebarNav isCollapsed={false} />
        </ScrollArea>

        <SidebarUsage isCollapsed={false} />
      </SheetContent>
    </Sheet>
  );
}