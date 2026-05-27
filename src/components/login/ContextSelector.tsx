"use client";

import { Building2, GraduationCap, ScanFace, Shield, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import type { UserContext } from "@/types/auth-context";
import { contextStorageKey } from "@/lib/auth-contexts";

function contextIcon(type: UserContext["type"]) {
    switch (type) {
        case "super_admin":
            return Shield;
        case "company":
            return Building2;
        case "client":
            return Users;
        case "responsible":
            return GraduationCap;
        case "face_user":
            return ScanFace;
    }
}

type ContextSelectorProps = {
    contexts: UserContext[];
    isSubmitting?: boolean;
    onSelect: (context: UserContext) => void;
};

export function ContextSelector({
    contexts,
    isSubmitting = false,
    onSelect,
}: ContextSelectorProps) {
    return (
        <Card className="w-full max-w-md rounded-2xl border border-border/70 bg-brand-white shadow-lg shadow-black/7 ring-1 ring-black/4">
            <CardHeader className="space-y-1.5">
                <CardTitle className="text-2xl font-semibold tracking-tight text-brand-midnight-navy">
                    Escolha o contexto
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                    Você tem acesso a mais de um perfil. Selecione como deseja
                    continuar.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
                {contexts.map((context) => {
                    const Icon = contextIcon(context.type);
                    return (
                        <Button
                            key={contextStorageKey(context)}
                            type="button"
                            variant="outline"
                            className="h-auto justify-start gap-3 px-4 py-3 text-left"
                            disabled={isSubmitting}
                            onClick={() => onSelect(context)}
                        >
                            <Icon className="size-4 shrink-0" aria-hidden />
                            <span className="min-w-0 flex-1 truncate">
                                {context.label}
                            </span>
                        </Button>
                    );
                })}
            </CardContent>
        </Card>
    );
}
