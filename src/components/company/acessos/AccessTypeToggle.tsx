"use client";

import { Car, UserRound } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AccessTypeToggle() {
    const router = useRouter();
    const params = useSearchParams();
    const [pending, startTransition] = useTransition();

    const isLpr = params.get("type") === "lpr";

    const navigate = (next: "facial" | "lpr") => {
        const nextQs = new URLSearchParams(params?.toString() ?? "");
        if (next === "lpr") {
            nextQs.set("type", "lpr");
        } else {
            nextQs.delete("type");
        }
        nextQs.delete("page");
        const q = nextQs.toString();
        startTransition(() => {
            router.push(q ? `/company/acessos?${q}` : "/company/acessos");
        });
    };

    return (
        <div
            className={cn(
                "inline-flex rounded-xl border bg-card p-1 shadow-sm gap-1",
                pending && "opacity-70 pointer-events-none",
            )}
            role="tablist"
            aria-label="Tipo de acesso"
        >
            <Button
                type="button"
                role="tab"
                variant="ghost"
                size="sm"
                aria-selected={!isLpr}
                className={cn(
                    "gap-2 rounded-lg",
                    !isLpr && "bg-primary/10 text-primary hover:bg-primary/15",
                )}
                disabled={pending}
                onClick={() => navigate("facial")}
            >
                <UserRound className="size-4 shrink-0" aria-hidden />
                Faciais
            </Button>
            <Button
                type="button"
                role="tab"
                variant="ghost"
                size="sm"
                aria-selected={isLpr}
                className={cn(
                    "gap-2 rounded-lg",
                    isLpr && "bg-primary/10 text-primary hover:bg-primary/15",
                )}
                disabled={pending}
                onClick={() => navigate("lpr")}
            >
                <Car className="size-4 shrink-0" aria-hidden />
                Veículos
            </Button>
        </div>
    );
}
