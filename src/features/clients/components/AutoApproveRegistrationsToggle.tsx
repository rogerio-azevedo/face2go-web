"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type AutoApproveRegistrationsToggleProps = {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
};

export function AutoApproveRegistrationsToggle({
    checked,
    onCheckedChange,
}: AutoApproveRegistrationsToggleProps) {
    return (
        <div className="bg-card rounded-xl border px-4 py-4 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 space-y-0.5">
                    <Label
                        htmlFor="client-auto-approve-registrations"
                        className="text-sm font-medium"
                    >
                        Aprovar cadastros automaticamente
                    </Label>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                        Novos cadastros recebidos por link serão aprovados sem
                        análise manual e seguirão o fluxo normal de
                        sincronização.
                    </p>
                </div>
                <Switch
                    id="client-auto-approve-registrations"
                    className="shrink-0"
                    checked={checked}
                    onCheckedChange={onCheckedChange}
                />
            </div>
        </div>
    );
}
