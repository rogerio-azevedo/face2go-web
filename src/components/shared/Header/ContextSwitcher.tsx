"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";

import { Label } from "@/components/ui/label";
import {
    contextStorageKey,
    establishSessionFromContext,
    selectContextWithToken,
} from "@/lib/auth-contexts";
import { getDashboardPathForRole } from "@/lib/dashboard-path";
import { useAuthContexts } from "@/hooks/use-auth-contexts";
import type { UserContext } from "@/types/auth-context";
import { cn } from "@/lib/utils";

type ContextSwitcherProps = {
    className?: string;
    compact?: boolean;
};

export function ContextSwitcher({
    className,
    compact = false,
}: ContextSwitcherProps) {
    const router = useRouter();
    const { update } = useSession();
    const [isSwitching, setIsSwitching] = useState(false);
    const {
        contexts,
        activeKey,
        displayLabel,
        accessToken,
        canSwitch,
        isVisible,
    } = useAuthContexts();

    if (!isVisible || !accessToken) {
        return null;
    }

    const handleChange = async (nextKey: string) => {
        if (!canSwitch || !activeKey || nextKey === activeKey || isSwitching) {
            return;
        }

        const nextContext = contexts.find(
            (context) => contextStorageKey(context) === nextKey,
        );
        if (!nextContext) return;

        setIsSwitching(true);
        try {
            const selected = await selectContextWithToken(
                accessToken,
                nextContext,
            );

            const result = await establishSessionFromContext({
                accessToken: selected.accessToken,
                user: selected.user,
                contexts,
                activeContext: selected.context,
            });

            if (result?.error) {
                throw new Error("Não foi possível trocar o contexto.");
            }

            await update();
            router.push(getDashboardPathForRole(selected.user.role));
            router.refresh();
            toast.success("Contexto alterado.");
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Não foi possível trocar o contexto.",
            );
        } finally {
            setIsSwitching(false);
        }
    };

    if (!canSwitch) {
        return (
            <div
                className={cn(
                    "rounded-md border border-sidebar-border bg-sidebar-accent/40 px-3 py-2 group-data-[collapsible=icon]:hidden",
                    className,
                )}
            >
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Contexto
                </p>
                <p className="mt-0.5 truncate text-sm font-medium text-sidebar-foreground">
                    {displayLabel}
                </p>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "flex flex-col gap-1 group-data-[collapsible=icon]:hidden",
                compact ? "min-w-0" : "min-w-[220px]",
                className,
            )}
        >
            <Label
                htmlFor="context-switcher"
                className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
            >
                Contexto
            </Label>
            <select
                id="context-switcher"
                className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border px-3 text-sm outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50"
                value={activeKey ?? undefined}
                disabled={isSwitching}
                onChange={(event) => void handleChange(event.target.value)}
            >
                {contexts.map((context: UserContext) => (
                    <option
                        key={contextStorageKey(context)}
                        value={contextStorageKey(context)}
                    >
                        {context.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
