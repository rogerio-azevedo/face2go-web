"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";
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

function ContextDisplay({
    displayLabel,
    showChevron = false,
    disabled = false,
}: {
    displayLabel: string;
    showChevron?: boolean;
    disabled?: boolean;
}) {
    return (
        <>
            <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Contexto
                </span>
                <span className="truncate font-medium text-sidebar-foreground">
                    {displayLabel}
                </span>
            </div>
            {showChevron ? (
                <ChevronsUpDown
                    className={cn(
                        "ml-auto size-4 shrink-0 opacity-50",
                        disabled && "opacity-30",
                    )}
                />
            ) : null}
        </>
    );
}

export function ContextSwitcher({
    className,
    compact = false,
}: ContextSwitcherProps) {
    const { update } = useSession();
    const { isMobile } = useSidebar();
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
            window.location.assign(getDashboardPathForRole(selected.user.role));
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
                    "group-data-[collapsible=icon]:hidden",
                    compact ? "min-w-0" : "min-w-[220px]",
                    className,
                )}
            >
                <div className="flex w-full items-center gap-2 rounded-md border border-sidebar-border bg-sidebar-accent/40 px-3 py-2">
                    <ContextDisplay displayLabel={displayLabel} />
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "group-data-[collapsible=icon]:hidden",
                compact ? "min-w-0" : "min-w-[220px]",
                className,
            )}
        >
            <SidebarMenu>
                <SidebarMenuItem>
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            disabled={isSwitching}
                            render={
                                <SidebarMenuButton
                                    size="default"
                                    className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground w-full border border-sidebar-border bg-sidebar-accent/40 disabled:opacity-50"
                                    disabled={isSwitching}
                                >
                                    <ContextDisplay
                                        displayLabel={displayLabel}
                                        showChevron
                                        disabled={isSwitching}
                                    />
                                </SidebarMenuButton>
                            }
                        />
                        <DropdownMenuContent
                            className="min-w-56 rounded-lg"
                            side={isMobile ? "bottom" : "right"}
                            align="end"
                            sideOffset={4}
                        >
                            <DropdownMenuGroup>
                                <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                                    Trocar contexto
                                </DropdownMenuLabel>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            {contexts.map((context: UserContext) => {
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
                                                isActive
                                                    ? "opacity-100"
                                                    : "opacity-0",
                                            )}
                                        />
                                        <span className="truncate">
                                            {context.label}
                                        </span>
                                    </DropdownMenuItem>
                                );
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarMenuItem>
            </SidebarMenu>
        </div>
    );
}
