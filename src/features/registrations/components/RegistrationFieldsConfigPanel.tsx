"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
    getCompanyRegistrationConfigAction,
    updateCompanyRegistrationConfigAction,
} from "@/features/registrations/actions/registration-config";
import {
    FIELD_LABELS,
    FIELD_RULE_LABELS,
    FIELD_RULES,
    listedFieldsForClientType,
    type FieldRule,
    type ResolvedRegistrationFieldsConfig,
} from "@/features/registrations/validations/registration-config";
import { deferInEffect } from "@/lib/defer-in-effect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const LOCKED_FIELDS = [
    { id: "name", label: "Nome completo" },
    { id: "photo", label: "Foto do rosto" },
] as const;

const selectClassName =
    "border-input bg-card text-foreground flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:border-ring outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50";

export function RegistrationFieldsConfigPanel({
    clientId,
    clientType,
}: {
    clientId: string;
    clientType: string;
}) {
    const [fields, setFields] = useState<ResolvedRegistrationFieldsConfig | null>(
        null,
    );
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const listed = useMemo(
        () => listedFieldsForClientType(clientType),
        [clientType],
    );

    useEffect(() => {
        deferInEffect(() => {
            void (async () => {
                setLoading(true);
                const result = await getCompanyRegistrationConfigAction(clientId);
                if (!result.ok) {
                    toast.error(result.error);
                    setFields(null);
                } else {
                    setFields(result.result.fields);
                }
                setLoading(false);
            })();
        });
    }, [clientId]);

    async function onSave() {
        if (!fields) return;
        setSaving(true);
        try {
            const result = await updateCompanyRegistrationConfigAction(
                clientId,
                fields,
            );
            if (!result.ok) {
                toast.error(result.error);
                return;
            }
            setFields(result.result.fields);
            toast.success("Configuração do cadastro salva.");
        } finally {
            setSaving(false);
        }
    }

    function setRule(key: keyof ResolvedRegistrationFieldsConfig, rule: FieldRule) {
        setFields((current) =>
            current ? { ...current, [key]: rule } : current,
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Campos do cadastro</CardTitle>
                <CardDescription>
                    Defina o que o visitante precisa preencher no link público.
                    Nome e foto permanecem sempre obrigatórios.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {loading ? (
                    <p className="text-muted-foreground text-sm">Carregando…</p>
                ) : !fields ? (
                    <p className="text-muted-foreground text-sm">
                        Não foi possível carregar a configuração.
                    </p>
                ) : (
                    <>
                        <div className="space-y-2">
                            {LOCKED_FIELDS.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                                >
                                    <span className="text-sm font-medium">
                                        {item.label}
                                    </span>
                                    <Badge variant="secondary">
                                        sempre obrigatório
                                    </Badge>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-3">
                            {listed.map((field) => (
                                <div
                                    key={field}
                                    className="grid gap-2 sm:grid-cols-[1fr_12rem] sm:items-center"
                                >
                                    <Label htmlFor={`cfg-${field}`}>
                                        {FIELD_LABELS[field]}
                                    </Label>
                                    <select
                                        id={`cfg-${field}`}
                                        className={selectClassName}
                                        value={fields[field]}
                                        onChange={(e) =>
                                            setRule(
                                                field,
                                                e.target.value as FieldRule,
                                            )
                                        }
                                    >
                                        {FIELD_RULES.map((rule) => (
                                            <option key={rule} value={rule}>
                                                {FIELD_RULE_LABELS[rule]}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                        <Button
                            type="button"
                            onClick={() => void onSave()}
                            disabled={saving}
                        >
                            {saving ? "Salvando…" : "Salvar"}
                        </Button>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
