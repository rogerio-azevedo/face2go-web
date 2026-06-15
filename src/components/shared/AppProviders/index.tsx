"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { useState } from "react";
import { Toaster } from "sonner";

import { TooltipProvider } from "@/components/ui/tooltip";

export function AppProviders({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 30_000,
                        retry: 1,
                    },
                },
            }),
    );

    return (
        <SessionProvider>
            <QueryClientProvider client={queryClient}>
                <TooltipProvider delay={0}>{children}</TooltipProvider>
                <Toaster richColors position="top-center" />
            </QueryClientProvider>
        </SessionProvider>
    );
}
