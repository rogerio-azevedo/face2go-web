"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { applyCpfMaskInput, CPF_FORMATTED_MAX_LENGTH, normalizeCpf } from "@/lib/utils/document";

import type { ResponsibleRegisterFormData } from "./ResponsibleRegisterFaceStep";

type ResponsibleRegisterDataStepProps = {
    initial: ResponsibleRegisterFormData;
    onNext: (data: ResponsibleRegisterFormData) => void;
};

export function ResponsibleRegisterDataStep({
    initial,
    onNext,
}: ResponsibleRegisterDataStepProps) {
    const [form, setForm] = useState(initial);
    const [error, setError] = useState<string | null>(null);

    const update = (key: keyof ResponsibleRegisterFormData, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!form.name.trim()) {
            setError("Informe o nome.");
            return;
        }
        const cpf = normalizeCpf(form.document);
        if (!cpf) {
            setError("Informe o CPF.");
            return;
        }
        if (cpf.length !== 11) {
            setError("CPF inválido.");
            return;
        }
        const hasPartialVehicle =
            form.plate.trim() ||
            form.brand.trim() ||
            form.model.trim() ||
            form.color.trim();
        if (hasPartialVehicle) {
            if (
                !form.plate.trim() ||
                !form.brand.trim() ||
                !form.model.trim() ||
                !form.color.trim()
            ) {
                setError("Preencha todos os campos do veículo ou deixe todos vazios.");
                return;
            }
        }
        onNext({
            ...form,
            document: cpf,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    autoComplete="name"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="phone">Telefone (opcional)</Label>
                <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    autoComplete="tel"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="document">CPF</Label>
                <Input
                    id="document"
                    value={form.document}
                    onChange={(e) =>
                        update("document", applyCpfMaskInput(e.target.value))
                    }
                    placeholder="000.000.000-00"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={CPF_FORMATTED_MAX_LENGTH}
                    required
                />
            </div>

            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <p className="text-sm font-medium">Veículo (opcional)</p>
                <div className="space-y-2">
                    <Label htmlFor="plate">Placa</Label>
                    <Input
                        id="plate"
                        value={form.plate}
                        onChange={(e) => update("plate", e.target.value.toUpperCase())}
                    />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-2">
                        <Label htmlFor="brand">Marca</Label>
                        <Input
                            id="brand"
                            value={form.brand}
                            onChange={(e) => update("brand", e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="model">Modelo</Label>
                        <Input
                            id="model"
                            value={form.model}
                            onChange={(e) => update("model", e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="color">Cor</Label>
                        <Input
                            id="color"
                            value={form.color}
                            onChange={(e) => update("color", e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button type="submit" size="lg" className="h-11 w-full">
                Continuar para foto
            </Button>
        </form>
    );
}
