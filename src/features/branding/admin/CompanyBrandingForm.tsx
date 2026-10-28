"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { contrastTextColor } from "@/lib/branding";
import type { components } from "@/types/api.generated";

import { BrandLogo } from "../components/BrandLogo";
import { BrandProvider } from "../components/BrandProvider";
import { defaultBrand, type ResolvedBrand } from "../types";
import {
    removeBrandAssetAction,
    resetBrandingAction,
    saveCompanyBrandingAction,
    uploadBrandAssetAction,
    verifyDomainAction,
} from "./actions";
import {
    companyBrandingFormSchema,
    type CompanyBrandingFormInput,
} from "./schema";

type Branding = components["schemas"]["CompanyBrandingResponseDto"];
type AssetKind = "logo" | "logo-dark" | "icon";

const ASSETS: { kind: AssetKind; label: string; field: keyof Branding }[] = [
    { kind: "logo", label: "Logo (fundo claro)", field: "logoUrl" },
    { kind: "logo-dark", label: "Logo (fundo escuro)", field: "logoDarkUrl" },
    { kind: "icon", label: "Ícone / favicon", field: "iconUrl" },
];

function previewBrand(values: CompanyBrandingFormInput, branding: Branding): ResolvedBrand {
    return {
        source: "session",
        isDefault: false,
        companyId: branding.companyId,
        appName: values.appName.trim() || defaultBrand.appName,
        primaryColor: values.primaryColor || defaultBrand.primaryColor,
        accentColor: values.accentColor || defaultBrand.accentColor,
        logoUrl: branding.logoUrl || defaultBrand.logoUrl,
        logoDarkUrl: branding.logoDarkUrl || branding.logoUrl || defaultBrand.logoDarkUrl,
        iconUrl: branding.iconUrl || defaultBrand.iconUrl,
    };
}

export function CompanyBrandingForm({ initial }: { initial: Branding }) {
    const [branding, setBranding] = useState(initial);
    const [pending, startTransition] = useTransition();
    const form = useForm<CompanyBrandingFormInput>({
        resolver: zodResolver(companyBrandingFormSchema),
        defaultValues: {
            enabled: initial.enabled,
            appName: initial.appName ?? "",
            primaryColor: initial.primaryColor ?? "",
            accentColor: initial.accentColor ?? "",
            customDomain: initial.customDomain ?? "",
        },
    });
    const values = form.watch();
    const preview = previewBrand(values, branding);
    const lowContrast =
        Boolean(values.primaryColor) &&
        contrastTextColor(values.primaryColor) === "#101010";

    function applyAssets(next: Branding) {
        setBranding(next);
        if (next.domainMessage) toast.message(next.domainMessage);
    }

    function applySaved(next: Branding) {
        setBranding(next);
        form.reset({
            enabled: next.enabled,
            appName: next.appName ?? "",
            primaryColor: next.primaryColor ?? "",
            accentColor: next.accentColor ?? "",
            customDomain: next.customDomain ?? "",
        });
        if (next.domainMessage) toast.message(next.domainMessage);
    }

    return (
        <form
            className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
            onSubmit={form.handleSubmit((input) => {
                startTransition(async () => {
                    const result = await saveCompanyBrandingAction(
                        branding.companyId,
                        input,
                    );
                    if (!result.ok) {
                        toast.error(result.error);
                        return;
                    }
                    applySaved(result.branding);
                    toast.success("Marca salva.");
                });
            })}
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Identidade</CardTitle>
                        <CardDescription>
                            Sem marca ativa, o web continua com a identidade Face2Go.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between gap-4">
                            <Label htmlFor="enabled">Marca ativa</Label>
                            <Switch
                                id="enabled"
                                checked={values.enabled}
                                onCheckedChange={(checked) =>
                                    form.setValue("enabled", checked, { shouldDirty: true })
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="appName">Nome do produto</Label>
                            <Input id="appName" {...form.register("appName")} />
                        </div>
                        <ColorField
                            id="primaryColor"
                            label="Cor primária"
                            value={values.primaryColor}
                            onChange={(value) =>
                                form.setValue("primaryColor", value, { shouldDirty: true })
                            }
                        />
                        <ColorField
                            id="accentColor"
                            label="Cor de destaque"
                            value={values.accentColor}
                            onChange={(value) =>
                                form.setValue("accentColor", value, { shouldDirty: true })
                            }
                        />
                        {lowContrast ? (
                            <p className="text-sm text-amber-700">
                                A cor primária é clara. O texto sobre botões fica escuro e pode perder contraste no restante da interface.
                            </p>
                        ) : null}
                        {form.formState.errors.primaryColor ? (
                            <p className="text-sm text-destructive">
                                {form.formState.errors.primaryColor.message}
                            </p>
                        ) : null}
                        {form.formState.errors.accentColor ? (
                            <p className="text-sm text-destructive">
                                {form.formState.errors.accentColor.message}
                            </p>
                        ) : null}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Arquivos</CardTitle>
                        <CardDescription>
                            PNG, WebP ou JPEG até 1 MB. Logos também aceitam SVG. O ícone precisa ser quadrado, com pelo menos 256 px.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {ASSETS.map((asset) => {
                            const url = branding[asset.field];
                            return (
                                <div key={asset.kind} className="flex flex-wrap items-center gap-3">
                                    <div className="w-40 text-sm font-medium">{asset.label}</div>
                                    {typeof url === "string" && url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={url} alt="" className="h-10 max-w-40 object-contain" />
                                    ) : (
                                        <span className="text-sm text-muted-foreground">Nenhum</span>
                                    )}
                                    <Input
                                        type="file"
                                        accept="image/png,image/webp,image/jpeg,image/svg+xml"
                                        className="max-w-xs"
                                        disabled={pending}
                                        onChange={(event) => {
                                            const file = event.target.files?.[0];
                                            event.target.value = "";
                                            if (!file) return;
                                            const body = new FormData();
                                            body.set("file", file);
                                            startTransition(async () => {
                                                const result = await uploadBrandAssetAction(
                                                    branding.companyId,
                                                    asset.kind,
                                                    body,
                                                );
                                                if (!result.ok) {
                                                    toast.error(result.error);
                                                    return;
                                                }
                                                applyAssets(result.branding);
                                                toast.success("Arquivo enviado.");
                                            });
                                        }}
                                    />
                                    {typeof url === "string" && url ? (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={pending}
                                            onClick={() => {
                                                startTransition(async () => {
                                                    const result = await removeBrandAssetAction(
                                                        branding.companyId,
                                                        asset.kind,
                                                    );
                                                    if (!result.ok) {
                                                        toast.error(result.error);
                                                        return;
                                                    }
                                                    applyAssets(result.branding);
                                                });
                                            }}
                                        >
                                            Remover
                                        </Button>
                                    ) : null}
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Domínio próprio</CardTitle>
                        <CardDescription>
                            Use um subdomínio, por exemplo app.nex.seg.br. O DNS é um CNAME desse host para{" "}
                            {branding.dns?.value ?? "cname.vercel-dns.com"}. O domínio só passa a valer depois de verificado.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid gap-2">
                            <Label htmlFor="customDomain">Domínio</Label>
                            <Input
                                id="customDomain"
                                placeholder="app.nex.seg.br"
                                {...form.register("customDomain")}
                            />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Status: {branding.domainStatus ?? "não configurado"}
                            {branding.vercelConfigured
                                ? " · provisionamento Vercel ativo"
                                : " · sem token Vercel (adicione o domínio no painel e clique em Verificar)"}
                        </p>
                        {branding.dns ? (
                            <p className="text-sm">
                                DNS: {branding.dns.type} {branding.dns.host} → {branding.dns.value}
                            </p>
                        ) : null}
                        <Button
                            type="button"
                            variant="outline"
                            disabled={pending || !branding.customDomain}
                            onClick={() => {
                                startTransition(async () => {
                                    const result = await verifyDomainAction(branding.companyId);
                                    if (!result.ok) {
                                        toast.error(result.error);
                                        return;
                                    }
                                    applyAssets(result.branding);
                                    toast.success(
                                        result.branding.domainStatus === "verified"
                                            ? "Domínio verificado."
                                            : "Verificação registrada.",
                                    );
                                });
                            }}
                        >
                            Verificar
                        </Button>
                    </CardContent>
                </Card>

                <div className="flex flex-wrap gap-2">
                    <Button type="submit" disabled={pending}>
                        Salvar
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={pending}
                        onClick={() => {
                            startTransition(async () => {
                                const result = await resetBrandingAction(branding.companyId);
                                if (!result.ok) {
                                    toast.error(result.error);
                                    return;
                                }
                                applySaved(result.branding);
                                toast.success("Marca restaurada para o padrão Face2Go.");
                            });
                        }}
                    >
                        Restaurar padrão
                    </Button>
                </div>
            </div>

            <Card className="h-fit">
                <CardHeader>
                    <CardTitle>Prévia</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {values.enabled ? null : (
                        <p className="text-sm text-muted-foreground">
                            A prévia mostra esta configuração. Com a marca desligada, o site continua Face2Go.
                        </p>
                    )}
                    <BrandProvider brand={preview}>
                        <div
                            className="space-y-3 rounded-xl border p-4"
                            style={{ ["--preview" as string]: preview.primaryColor }}
                        >
                            <BrandLogo />
                            <p className="text-sm text-muted-foreground">Entrar em {preview.appName}</p>
                            <div
                                className="rounded-lg px-3 py-2 text-sm font-medium"
                                style={{
                                    background: preview.primaryColor,
                                    color: contrastTextColor(preview.primaryColor),
                                }}
                            >
                                Continuar
                            </div>
                        </div>
                        <div className="flex items-center gap-2 rounded-xl border p-3">
                            <BrandLogo className="h-8 max-w-[140px]" />
                            <span className="truncate text-sm">{preview.appName}</span>
                        </div>
                    </BrandProvider>
                </CardContent>
            </Card>
        </form>
    );
}

function ColorField({
    id,
    label,
    value,
    onChange,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    const picker = /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#001b3d";
    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>{label}</Label>
            <div className="flex gap-2">
                <Input
                    id={`${id}-picker`}
                    type="color"
                    value={picker}
                    className="h-9 w-14 p-1"
                    onChange={(event) => onChange(event.target.value)}
                    aria-label={`${label} (seletor)`}
                />
                <Input
                    id={id}
                    value={value}
                    placeholder="#001b3d"
                    onChange={(event) => onChange(event.target.value)}
                />
            </div>
        </div>
    );
}
