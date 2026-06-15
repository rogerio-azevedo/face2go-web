"use client";

import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

import { deferInEffect } from "@/lib/defer-in-effect";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchInputProps = {
    id?: string;
    value: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    debounceMs?: number;
    className?: string;
    disabled?: boolean;
};

export function SearchInput({
    id,
    value,
    onValueChange,
    placeholder = "Buscar…",
    debounceMs = 400,
    className,
    disabled,
}: SearchInputProps) {
    const [draft, setDraft] = useState(value);

    useEffect(() => {
        deferInEffect(() => setDraft(value));
    }, [value]);

    useEffect(() => {
        const t = window.setTimeout(() => {
            if (draft !== value) onValueChange(draft);
        }, debounceMs);
        return () => window.clearTimeout(t);
    }, [draft, debounceMs, onValueChange, value]);

    return (
        <div className={cn("relative w-full min-w-[200px] sm:max-w-sm", className)}>
            <Search
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                aria-hidden
            />
            <Input
                id={id}
                type="text"
                role="searchbox"
                inputMode="search"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className="pr-9 pl-9"
                autoComplete="off"
            />
            {draft ? (
                <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded-sm p-1"
                    aria-label="Limpar busca"
                    onClick={() => {
                        setDraft("");
                        onValueChange("");
                    }}
                >
                    <X className="size-4" />
                </button>
            ) : null}
        </div>
    );
}
