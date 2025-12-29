"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// This is a simple wrapper to make it easy to use in layout.tsx
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}