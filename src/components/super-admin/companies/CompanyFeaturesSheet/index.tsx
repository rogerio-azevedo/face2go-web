"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import {
    getCompanyFeaturesAction,
    toggleCompanyFeatureAction,
    type CompanyFeatureRow,
} from "@/app/super-admin/companies/[id]/features/actions";
import { deferInEffect } from "@/lib/defer-in-effect";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";

type CompanyFeaturesSheetProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    companyId: string;
    companyName: string;
};

export function CompanyFeaturesSheet({
    open,
    onOpenChange,
    companyId,
    companyName,
}: CompanyFeaturesSheetProps) {
    const [features, setFeatures] = useState<CompanyFeatureRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [pending, startTransition] = useTransition();

    useEffect(() => {
        deferInEffect(() => {
            if (!open) return;

            setLoading(true);
            void getCompanyFeaturesAction(companyId).then((result) => {
                if ("error" in result) {
                    toast.error(result.error);
                    setFeatures([]);
                } else {
                    setFeatures(result.features);
                }
                setLoading(false);
            });
        });
    }, [open, companyId]);

    function handleToggle(feature: CompanyFeatureRow, enabled: boolean) {
        startTransition(async () => {
            const result = await toggleCompanyFeatureAction(
                companyId,
                feature.slug,
                enabled,
            );

            if ("error" in result) {
                toast.error(result.error);
                return;
            }

            setFeatures((current) =>
                current.map((item) =>
                    item.slug === result.feature.slug ? result.feature : item,
                ),
            );
            toast.success(
                enabled
                    ? `${result.feature.name} habilitado.`
                    : `${result.feature.name} desabilitado.`,
            );
        });
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-full overflow-y-auto data-[side=right]:sm:max-w-xl"
            >
                <SheetHeader className="px-6 pt-6">
                    <SheetTitle>Recursos premium</SheetTitle>
                    <SheetDescription>{companyName}</SheetDescription>
                </SheetHeader>

                <div className="flex flex-col gap-4 px-6 py-2">
                    {loading ? (
                        <p className="text-muted-foreground text-sm">
                            Carregando recursos...
                        </p>
                    ) : features.length === 0 ? (
                        <p className="text-muted-foreground text-sm">
                            Nenhum recurso premium disponível.
                        </p>
                    ) : (
                        features.map((feature) => (
                            <div
                                key={feature.slug}
                                className="flex items-start justify-between gap-4 rounded-lg border p-4"
                            >
                                <div className="space-y-1">
                                    <p className="font-medium">{feature.name}</p>
                                    <p className="text-muted-foreground text-xs">
                                        {feature.description}
                                    </p>
                                </div>
                                <Switch
                                    checked={feature.enabled}
                                    disabled={pending}
                                    onCheckedChange={(checked) =>
                                        handleToggle(feature, checked)
                                    }
                                    aria-label={`Habilitar ${feature.name}`}
                                />
                            </div>
                        ))
                    )}
                </div>

                <SheetFooter className="px-6 pb-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Fechar
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

export function CompanyFeaturesSheetTrigger({
    companyId,
    companyName,
}: {
    companyId: string;
    companyName: string;
}) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs"
                onClick={() => setOpen(true)}
            >
                Recursos
            </Button>
            <CompanyFeaturesSheet
                open={open}
                onOpenChange={setOpen}
                companyId={companyId}
                companyName={companyName}
            />
        </>
    );
}
