"use client";

import { Building2, Check, ChevronsUpDown } from "lucide-react";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthContexts } from "@/hooks/use-auth-contexts";
import {
    contextStorageKey,
    establishSessionFromContext,
    selectContextWithToken,
} from "@/lib/auth-contexts";
import { cn } from "@/lib/utils";
import type { UserContext } from "@/types/auth-context";

function isCompanyContext(
    context: UserContext,
): context is Extract<UserContext, { type: "company" }> {
    return context.type === "company";
}

function companyDisplayName(
    context: UserContext | null,
    fallback: string,
): string {
    if (context?.type === "company") return context.companyName;
    return fallback;
}

function ContextBadge({
    name,
    canSwitch,
    isSwitching,
}: {
    name: string;
    canSwitch: boolean;
    isSwitching: boolean;
}) {
    return (
        <div className="flex min-w-0 items-center gap-2.5">
            <div className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-md">
                <Building2 className="size-4" />
            </div>
            <div className="min-w-0 text-left">
                <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
                    Empresa monitorada
                </p>
                <p className="max-w-[220px] truncate text-sm font-semibold sm:max-w-[280px]">
                    {name}
                </p>
            </div>
            {canSwitch ? (
                <ChevronsUpDown
                    className={cn(
                        "text-muted-foreground ml-0.5 size-4 shrink-0",
                        isSwitching && "opacity-40",
                    )}
                />
            ) : null}
        </div>
    );
}

export function MonitoringContextSwitcher() {
    const { update } = useSession();
    const [isSwitching, setIsSwitching] = useState(false);
    const {
        contexts,
        activeContext,
        activeKey,
        displayLabel,
        accessToken,
        isVisible,
    } = useAuthContexts();

    const companyContexts = useMemo(
        () => contexts.filter(isCompanyContext),
        [contexts],
    );

    const activeCompanyContext = useMemo(() => {
        if (activeContext?.type === "company") return activeContext;
        return companyContexts[0] ?? null;
    }, [activeContext, companyContexts]);

    const companyName = companyDisplayName(
        activeCompanyContext ?? activeContext,
        displayLabel,
    );

    const canSwitch =
        companyContexts.length > 1 && !!accessToken && !!activeKey;

    if (!isVisible || !accessToken) {
        return null;
    }

    const handleChange = async (nextKey: string) => {
        if (!canSwitch || !activeKey || nextKey === activeKey || isSwitching) {
            return;
        }

        const nextContext = companyContexts.find(
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
                throw new Error("Não foi possível trocar a empresa.");
            }

            await update();
            window.location.assign("/monitoring");
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Não foi possível trocar a empresa.",
            );
        } finally {
            setIsSwitching(false);
        }
    };

    if (!canSwitch) {
        return (
            <div className="border-border bg-muted/30 shrink-0 rounded-lg border px-3 py-2">
                <ContextBadge
                    name={companyName}
                    canSwitch={false}
                    isSwitching={false}
                />
            </div>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                disabled={isSwitching}
                render={
                    <Button
                        variant="outline"
                        className="border-border bg-muted/30 h-auto max-w-[320px] shrink-0 px-3 py-2"
                        disabled={isSwitching}
                    />
                }
            >
                <ContextBadge
                    name={companyName}
                    canSwitch
                    isSwitching={isSwitching}
                />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-56 rounded-lg">
                <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-muted-foreground text-xs font-medium">
                        Trocar empresa
                    </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                {companyContexts.map((context) => {
                    const key = contextStorageKey(context);
                    const isActive = key === activeKey;

                    return (
                        <DropdownMenuItem
                            key={key}
                            disabled={isSwitching}
                            onClick={() => void handleChange(key)}
                        >
                            <Check
                                className={cn(
                                    "size-4 shrink-0",
                                    isActive ? "opacity-100" : "opacity-0",
                                )}
                            />
                            <span className="truncate">{context.companyName}</span>
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
