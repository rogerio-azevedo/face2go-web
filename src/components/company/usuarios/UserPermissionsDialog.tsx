"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import {
    updateCompanyMemberPermissionsAction,
} from "@/app/company/usuarios/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
    Sheet,
    SheetContent,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    ALL_ACTIONS,
    ALL_FEATURES,
    type FeatureSlug,
    type PermissionAction,
} from "@/lib/features";

type RowPerm = { featureSlug: string; actions: string[] };

function buildStateFromRows(rows: RowPerm[]) {
    const m: Record<string, PermissionAction[]> = {};
    for (const f of ALL_FEATURES) {
        m[f.slug] = [];
    }
    for (const r of rows) {
        if (ALL_FEATURES.some((f) => f.slug === r.featureSlug)) {
            m[r.featureSlug] = (r.actions ?? []) as PermissionAction[];
        }
    }
    return m;
}

export function UserPermissionsDialog({
    open,
    onOpenChange,
    companyUserId,
    initialRows,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    companyUserId: string;
    initialRows: RowPerm[];
}) {
    const router = useRouter();
    const [state, setState] = useState<Record<string, PermissionAction[]>>(
        () => buildStateFromRows(initialRows),
    );
    const [pending, startTransition] = useTransition();

    useEffect(() => {
        if (open) {
            setState(buildStateFromRows(initialRows));
        }
    }, [open, initialRows]);

    function toggleAction(
        featureSlug: FeatureSlug,
        action: PermissionAction,
        checked: boolean,
    ) {
        setState((prev) => {
            const cur = new Set(prev[featureSlug] ?? []);
            if (checked) cur.add(action);
            else cur.delete(action);
            return { ...prev, [featureSlug]: [...cur] };
        });
    }

    function saveAll() {
        startTransition(async () => {
            try {
                for (const f of ALL_FEATURES) {
                    const actions = state[f.slug] ?? [];
                        const result = await updateCompanyMemberPermissionsAction({
                        companyUserId,
                        featureSlug: f.slug,
                        actions,
                    });
                    if ("error" in result) {
                        toast.error(result.error);
                        return;
                    }
                }
                toast.success("Permissões atualizadas.");
                onOpenChange(false);
                router.refresh();
            } catch {
                toast.error("Falha ao salvar permissões.");
            }
        });
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle>Permissões por módulo</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-6 py-4">
                    {ALL_FEATURES.map((feature) => (
                        <div
                            key={feature.slug}
                            className="space-y-2 rounded-lg border p-3"
                        >
                            <div>
                                <p className="font-medium">{feature.name}</p>
                                <p className="text-muted-foreground text-xs">
                                    {feature.description}
                                </p>
                            </div>
                            <div className="grid gap-2">
                                {ALL_ACTIONS.map(({ action, label }) => (
                                    <label
                                        key={action}
                                        className="flex cursor-pointer items-center gap-2"
                                    >
                                        <Checkbox
                                            checked={(
                                                state[feature.slug] ?? []
                                            ).includes(action)}
                                            onCheckedChange={(v) =>
                                                toggleAction(
                                                    feature.slug,
                                                    action,
                                                    v === true,
                                                )
                                            }
                                        />
                                        <span className="text-sm">{label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <SheetFooter className="flex-row justify-end gap-2">
                    <Button
                        variant="outline"
                        type="button"
                        onClick={() => onOpenChange(false)}
                        disabled={pending}
                    >
                        Cancelar
                    </Button>
                    <Button type="button" onClick={saveAll} disabled={pending}>
                        {pending ? "Salvando..." : "Salvar"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
