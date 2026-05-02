"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

import { TooltipProvider } from "@/components/ui/tooltip";

export function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <TooltipProvider delay={0}>{children}</TooltipProvider>
            <Toaster richColors position="top-center" />
        </SessionProvider>
    );
}
