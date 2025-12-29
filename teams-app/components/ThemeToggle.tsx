"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/8bit/button"; // Using your 8-bit button

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Prevent hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="fixed top-4 left-4 z-50">
      <Button
        variant="default" // or "outline" if you prefer
        size="icon"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="h-10 w-10 p-0 flex items-center justify-center bg-white dark:bg-black border-2 border-black dark:border-white"
        title="Toggle Theme"
      >
        {mounted ? (
          theme === "dark" ? (
            <Sun className="h-5 w-5 text-white" />
          ) : (
            <Moon className="h-5 w-5 text-black" />
          )
        ) : (
          <span className="h-5 w-5" /> // Placeholder to prevent layout shift
        )}
        <span className="sr-only">Toggle theme</span>
      </Button>
    </div>
  );
}