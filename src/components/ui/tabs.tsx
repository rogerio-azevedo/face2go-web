"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type TabsContextValue = {
    value: string;
    setValue: (v: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext(name: string) {
    const ctx = React.useContext(TabsContext);
    if (!ctx) {
        throw new Error(`${name} must be used within <Tabs />`);
    }
    return ctx;
}

export type TabsProps = {
    /** Valor da aba ativa (controlado). */
    value?: string;
    /** Valor inicial (não controlado). */
    defaultValue?: string;
    onValueChange?: (next: string) => void;
    className?: string;
    children: React.ReactNode;
};

export function Tabs({
    value: valueProp,
    defaultValue = "",
    onValueChange,
    className,
    children,
}: TabsProps) {
    const [uncontrolled, setUncontrolled] = React.useState(defaultValue);
    const isControlled = valueProp !== undefined;
    const value = isControlled ? valueProp : uncontrolled;

    const setValue = React.useCallback(
        (next: string) => {
            if (!isControlled) {
                setUncontrolled(next);
            }
            onValueChange?.(next);
        },
        [isControlled, onValueChange],
    );

    return (
        <TabsContext.Provider value={{ value, setValue }}>
            <div className={cn("flex flex-col gap-4", className)}>{children}</div>
        </TabsContext.Provider>
    );
}

export function TabsList({
    className,
    ...props
}: React.ComponentProps<"div">) {
    return (
        <div
            role="tablist"
            className={cn(
                "bg-muted text-muted-foreground inline-flex h-9 w-fit flex-wrap items-center justify-center rounded-lg p-1",
                className,
            )}
            {...props}
        />
    );
}

export type TabsTriggerProps = {
    value: string;
    className?: string;
    children: React.ReactNode;
    disabled?: boolean;
};

export function TabsTrigger({
    value,
    className,
    children,
    disabled,
}: TabsTriggerProps) {
    const { value: active, setValue } = useTabsContext("TabsTrigger");
    const isActive = active === value;

    return (
        <button
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={disabled}
            className={cn(
                "ring-offset-background focus-visible:ring-ring inline-flex h-[calc(100%-2px)] flex-1 items-center justify-center rounded-md px-3 py-1 text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
                isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "hover:text-foreground",
                className,
            )}
            onClick={() => setValue(value)}
        >
            {children}
        </button>
    );
}

export type TabsContentProps = {
    value: string;
    className?: string;
    children: React.ReactNode;
    forceMount?: boolean;
};

export function TabsContent({
    value,
    className,
    children,
    forceMount,
}: TabsContentProps) {
    const { value: active } = useTabsContext("TabsContent");
    const show = active === value;

    if (!show && !forceMount) {
        return null;
    }

    return (
        <div
            role="tabpanel"
            hidden={!show}
            className={cn("focus-visible:outline-none", className)}
        >
            {children}
        </div>
    );
}
