"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import {
    createClientAction,
    updateClientAction,
} from "@/app/company/clientes/actions";
import { ClientBrandingPreview } from "@/components/company/clientes/ClientBrandingPreview";
import type { ClientListRow } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import {
    CLIENT_TYPES,
    CLIENT_TYPE_LABELS,
    clientSchema,
    type ClientFormPayload,
} from "@/lib/validations/clients";
import { cn } from "@/lib/utils";

function maskCnpjInput(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 14);
    const p1 = digits.slice(0, 2);
    const p2 = digits.slice(2, 5);
    const p3 = digits.slice(5, 8);
    const p4 = digits.slice(8, 12);
    const p5 = digits.slice(12, 14);

    let out = p1;
    if (p2) out += `.${p2}`;
    if (p3) out += `.${p3}`;
    if (p4) out += `/${p4}`;
    if (p5) out += `-${p5}`;
    return out;
}

/** Máscara BR: fixo (XX) XXXX-XXXX ou celular (XX) XXXXX-XXXX — apenas dígitos. */
function maskPhoneInput(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 11);
    if (digits.length === 0) return "";

    const ddd = digits.slice(0, 2);
    const rest = digits.slice(2);

    if (digits.length <= 2) return `(${ddd}`;

    const isMobile = digits.length > 10;

    if (isMobile) {
        if (rest.length <= 5) return `(${ddd}) ${rest}`;
        return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5, 9)}`;
    }

    if (rest.length <= 4) return `(${ddd}) ${rest}`;
    return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4, 8)}`;
}

type ClientFormInput = ClientFormPayload;

const emptyDefaults: ClientFormInput = {
    name: "",
    type: "other",
    cnpj: undefined,
    phone: undefined,
    email: undefined,
    logoUrl: undefined,
    primaryColor: undefined,
    privacyPolicyUrl: undefined,
    privacyAlias: undefined,
    supportEmail: undefined,
    supportPhone: undefined,
    supportWhatsapp: undefined,
    timezoneOffsetMinutes: 0,
    isActive: true,
};

function SectionStep({
    step,
    title,
}: {
    step: number;
    title: string;
}) {
    return (
        <div className="flex items-center gap-2 border-b pb-2">
            <div className="bg-primary/10 text-primary flex size-6 items-center justify-center rounded-full text-xs font-bold">
                {step}
            </div>
            <h3 className="text-foreground text-sm font-semibold">{title}</h3>
        </div>
    );
}

const fieldLabel = "text-muted-foreground text-xs font-semibold uppercase tracking-wider";
const controlClass =
    "shadow-sm aria-invalid:border-destructive aria-invalid:ring-destructive/25 sm:h-10";
const hintClass = "font-normal lowercase normal-case tracking-normal text-muted-foreground";

export type ClientFormProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: "create" | "edit";
    client?: ClientListRow | null;
};

export function ClientForm({
    open,
    onOpenChange,
    mode,
    client,
}: ClientFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const defaultValues = useMemo((): ClientFormInput => {
        if (mode === "edit" && client) {
            return {
                name: client.name,
                type: client.type as ClientFormInput["type"],
                cnpj: client.cnpj ?? undefined,
                phone: client.phone ?? undefined,
                email: client.email ?? undefined,
                logoUrl: client.logoUrl ?? undefined,
                primaryColor: client.primaryColor ?? undefined,
                privacyPolicyUrl: client.privacyPolicyUrl ?? undefined,
                privacyAlias: client.privacyAlias ?? undefined,
                supportEmail: client.supportEmail ?? undefined,
                supportPhone: client.supportPhone ?? undefined,
                supportWhatsapp: client.supportWhatsapp ?? undefined,
                timezoneOffsetMinutes:
                    typeof client.timezoneOffsetMinutes === "number"
                        ? client.timezoneOffsetMinutes
                        : 0,
                isActive: client.isActive,
            };
        }
        return emptyDefaults;
    }, [mode, client]);

    const form = useForm<ClientFormInput>({
        resolver: zodResolver(clientSchema),
        defaultValues,
    });

    const { register, handleSubmit, control, reset, watch, formState: { errors } } =
        form;

    const watchedLogoUrl = watch("logoUrl");
    const watchedPrimaryColor = watch("primaryColor");

    useEffect(() => {
        if (open) {
            reset(defaultValues);
        }
    }, [open, defaultValues, reset]);

    async function submit(data: ClientFormInput) {
        setIsSubmitting(true);
        try {
            if (mode === "create") {
                const result = await createClientAction(data);
                if ("error" in result) {
                    toast.error(result.error);
                    return;
                }
                toast.success("Cliente cadastrado.");
            } else {
                if (!client) {
                    toast.error("Cliente não informado.");
                    return;
                }
                const result = await updateClientAction(client.id, data);
                if ("error" in result) {
                    toast.error(result.error);
                    return;
                }
                toast.success("Cliente atualizado.");
            }
            onOpenChange(false);
            router.refresh();
        } finally {
            setIsSubmitting(false);
        }
    }

    const title =
        mode === "create" ? "Novo cliente" : "Editar cliente";
    const description =
        mode === "create"
            ? "Preencha os dados da unidade atendida pela sua empresa. Campos marcados com * são obrigatórios."
            : "Atualize as informações cadastrais deste cliente.";

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="flex w-full flex-col gap-0 overflow-hidden bg-background p-0 data-[side=right]:sm:max-w-2xl"
            >
                <SheetHeader className="bg-card shrink-0 space-y-2 border-b px-6 py-5">
                    <SheetTitle className="text-xl">{title}</SheetTitle>
                    <SheetDescription>{description}</SheetDescription>
                </SheetHeader>

                <form
                    onSubmit={handleSubmit(submit)}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <div className="bg-muted/30 flex-1 space-y-8 overflow-y-auto px-6 py-6">
                        <div className="space-y-4">
                            <SectionStep step={1} title="Identificação" />
                            <div className="space-y-4">
                                <div className="min-w-0 space-y-2">
                                    <Label htmlFor="client-name" className={fieldLabel}>
                                        Nome *
                                    </Label>
                                    <Input
                                        id="client-name"
                                        autoComplete="organization"
                                        className={cn("bg-card h-10 px-3", controlClass)}
                                        aria-invalid={!!errors.name}
                                        {...register("name")}
                                        placeholder="Ex.: Filial Centro"
                                    />
                                    {errors.name ? (
                                        <p className="text-destructive text-xs">
                                            {errors.name.message}
                                        </p>
                                    ) : null}
                                </div>

                                <div className="min-w-0 space-y-2">
                                    <Label htmlFor="client-type" className={fieldLabel}>
                                        Tipo *
                                    </Label>
                                    <select
                                        id="client-type"
                                        className={cn(
                                            "border-input bg-card text-foreground flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-sm",
                                            "focus-visible:border-ring outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50",
                                            errors.type &&
                                                "border-destructive ring-2 ring-destructive/20",
                                        )}
                                        aria-invalid={!!errors.type}
                                        {...register("type")}
                                    >
                                        {CLIENT_TYPES.map((t) => (
                                            <option key={t} value={t}>
                                                {CLIENT_TYPE_LABELS[t]}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.type ? (
                                        <p className="text-destructive text-xs">
                                            {errors.type.message}
                                        </p>
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <SectionStep step={2} title="Contato" />
                            <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="min-w-0 space-y-2 sm:col-span-2">
                                    <Label htmlFor="client-cnpj" className={fieldLabel}>
                                        CNPJ{" "}
                                        <span className={hintClass}>(opcional)</span>
                                    </Label>
                                    <Controller
                                        name="cnpj"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                id="client-cnpj"
                                                className={cn("bg-card h-10 px-3", controlClass)}
                                                aria-invalid={!!errors.cnpj}
                                                value={field.value ?? ""}
                                                onChange={(e) =>
                                                    field.onChange(
                                                        maskCnpjInput(e.target.value),
                                                    )
                                                }
                                                placeholder="00.000.000/0000-00"
                                            />
                                        )}
                                    />
                                    {errors.cnpj ? (
                                        <p className="text-destructive text-xs">
                                            {errors.cnpj.message}
                                        </p>
                                    ) : null}
                                </div>

                                <div className="min-w-0 space-y-2">
                                    <Label htmlFor="client-phone" className={fieldLabel}>
                                        Telefone{" "}
                                        <span className={hintClass}>(opcional)</span>
                                    </Label>
                                    <Controller
                                        name="phone"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                id="client-phone"
                                                type="tel"
                                                inputMode="numeric"
                                                className={cn("bg-card h-10 px-3", controlClass)}
                                                aria-invalid={!!errors.phone}
                                                value={field.value ? maskPhoneInput(field.value) : ""}
                                                onChange={(e) =>
                                                    field.onChange(maskPhoneInput(e.target.value))
                                                }
                                                placeholder="(11) 99999-9999"
                                            />
                                        )}
                                    />
                                    {errors.phone ? (
                                        <p className="text-destructive text-xs">
                                            {errors.phone.message}
                                        </p>
                                    ) : null}
                                </div>

                                <div className="min-w-0 space-y-2">
                                    <Label htmlFor="client-email" className={fieldLabel}>
                                        E-mail{" "}
                                        <span className={hintClass}>(opcional)</span>
                                    </Label>
                                    <Input
                                        id="client-email"
                                        type="email"
                                        className={cn("bg-card h-10 px-3", controlClass)}
                                        aria-invalid={!!errors.email}
                                        {...register("email")}
                                        placeholder="contato@empresa.com"
                                    />
                                    {errors.email ? (
                                        <p className="text-destructive text-xs">
                                            {errors.email.message}
                                        </p>
                                    ) : null}
                                </div>

                                <div className="min-w-0 space-y-2 sm:col-span-2">
                                    <Label
                                        htmlFor="client-tz-offset"
                                        className={fieldLabel}
                                    >
                                        Offset UTC (minutos){" "}
                                        <span className={hintClass}>(opcional)</span>
                                    </Label>
                                    <Input
                                        id="client-tz-offset"
                                        type="number"
                                        step={1}
                                        inputMode="numeric"
                                        className={cn(
                                            "bg-card h-10 px-3 tabular-nums",
                                            controlClass,
                                        )}
                                        aria-invalid={!!errors.timezoneOffsetMinutes}
                                        {...register("timezoneOffsetMinutes", {
                                            setValueAs: (v) => {
                                                if (
                                                    v === "" ||
                                                    v === null ||
                                                    v === undefined
                                                ) {
                                                    return 0;
                                                }
                                                const n =
                                                    typeof v === "number"
                                                        ? v
                                                        : Number(v);
                                                if (!Number.isFinite(n))
                                                    return NaN;
                                                return Math.trunc(n);
                                            },
                                        })}
                                        placeholder="-180"
                                    />
                                    <p className="text-muted-foreground text-xs">
                                        UTC−4 = −240 min; UTC−3 = −180. Também vale
                                        atalho de horas inteiras no backend (JSON):
                                        −4 ⇒ −240; +3 ⇒ +180. Deixar 0 = UTC.
                                    </p>
                                    {errors.timezoneOffsetMinutes ? (
                                        <p className="text-destructive text-xs">
                                            {
                                                errors.timezoneOffsetMinutes
                                                    .message
                                            }
                                        </p>
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <SectionStep step={3} title="Suporte" />
                            <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="min-w-0 space-y-2 sm:col-span-2">
                                    <Label htmlFor="client-supportEmail" className={fieldLabel}>
                                        E-mail do Suporte{" "}
                                        <span className={hintClass}>(opcional)</span>
                                    </Label>
                                    <Input
                                        id="client-supportEmail"
                                        type="email"
                                        className={cn("bg-card h-10 px-3", controlClass)}
                                        aria-invalid={!!errors.supportEmail}
                                        {...register("supportEmail")}
                                        placeholder="suporte@escola.com"
                                    />
                                    {errors.supportEmail ? (
                                        <p className="text-destructive text-xs">
                                            {errors.supportEmail.message}
                                        </p>
                                    ) : (
                                        <p className="text-muted-foreground text-xs">
                                            Exibido no app mobile para contato com o suporte da escola.
                                        </p>
                                    )}
                                </div>

                                <div className="min-w-0 space-y-2">
                                    <Label htmlFor="client-supportPhone" className={fieldLabel}>
                                        Telefone do Suporte{" "}
                                        <span className={hintClass}>(opcional)</span>
                                    </Label>
                                    <Controller
                                        name="supportPhone"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                id="client-supportPhone"
                                                type="tel"
                                                inputMode="numeric"
                                                className={cn("bg-card h-10 px-3", controlClass)}
                                                aria-invalid={!!errors.supportPhone}
                                                value={
                                                    field.value
                                                        ? maskPhoneInput(field.value)
                                                        : ""
                                                }
                                                onChange={(e) =>
                                                    field.onChange(
                                                        maskPhoneInput(e.target.value),
                                                    )
                                                }
                                                placeholder="(11) 3333-4444"
                                            />
                                        )}
                                    />
                                    {errors.supportPhone ? (
                                        <p className="text-destructive text-xs">
                                            {errors.supportPhone.message}
                                        </p>
                                    ) : null}
                                </div>

                                <div className="min-w-0 space-y-2">
                                    <Label htmlFor="client-supportWhatsapp" className={fieldLabel}>
                                        WhatsApp{" "}
                                        <span className={hintClass}>(opcional)</span>
                                    </Label>
                                    <Controller
                                        name="supportWhatsapp"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                id="client-supportWhatsapp"
                                                type="tel"
                                                inputMode="numeric"
                                                className={cn("bg-card h-10 px-3", controlClass)}
                                                aria-invalid={!!errors.supportWhatsapp}
                                                value={
                                                    field.value
                                                        ? maskPhoneInput(field.value)
                                                        : ""
                                                }
                                                onChange={(e) =>
                                                    field.onChange(
                                                        maskPhoneInput(e.target.value),
                                                    )
                                                }
                                                placeholder="(11) 99999-9999"
                                            />
                                        )}
                                    />
                                    {errors.supportWhatsapp ? (
                                        <p className="text-destructive text-xs">
                                            {errors.supportWhatsapp.message}
                                        </p>
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <SectionStep step={4} title="Identidade visual" />
                            <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="min-w-0 space-y-2 sm:col-span-2">
                                    <Label htmlFor="client-logoUrl" className={fieldLabel}>
                                        URL da logo{" "}
                                        <span className={hintClass}>(opcional)</span>
                                    </Label>
                                    <Input
                                        id="client-logoUrl"
                                        type="url"
                                        className={cn("bg-card h-10 px-3", controlClass)}
                                        aria-invalid={!!errors.logoUrl}
                                        {...register("logoUrl")}
                                        placeholder="https://exemplo.com/logo.png"
                                    />
                                    {errors.logoUrl ? (
                                        <p className="text-destructive text-xs">
                                            {errors.logoUrl.message}
                                        </p>
                                    ) : (
                                        <p className="text-muted-foreground text-xs">
                                            Exibida no app mobile após login.
                                        </p>
                                    )}
                                </div>

                                <div className="min-w-0 space-y-2 sm:col-span-2">
                                    <Label htmlFor="client-privacyPolicyUrl" className={fieldLabel}>
                                        URL da Política de Privacidade{" "}
                                        <span className={hintClass}>(opcional)</span>
                                    </Label>
                                    <Input
                                        id="client-privacyPolicyUrl"
                                        type="url"
                                        className={cn("bg-card h-10 px-3", controlClass)}
                                        aria-invalid={!!errors.privacyPolicyUrl}
                                        {...register("privacyPolicyUrl")}
                                        placeholder="https://exemplo.com/politica-de-privacidade"
                                    />
                                    {errors.privacyPolicyUrl ? (
                                        <p className="text-destructive text-xs">
                                            {errors.privacyPolicyUrl.message}
                                        </p>
                                    ) : (
                                        <p className="text-muted-foreground text-xs">
                                            Exibida no app mobile junto à política da Face2Go.
                                        </p>
                                    )}
                                </div>

                                <div className="min-w-0 space-y-2 sm:col-span-2">
                                    <Label htmlFor="client-privacyAlias" className={fieldLabel}>
                                        Alias da política de privacidade{" "}
                                        <span className={hintClass}>(opcional)</span>
                                    </Label>
                                    <Input
                                        id="client-privacyAlias"
                                        type="text"
                                        className={cn("bg-card h-10 px-3", controlClass)}
                                        aria-invalid={!!errors.privacyAlias}
                                        {...register("privacyAlias")}
                                        placeholder="IENH"
                                    />
                                    {errors.privacyAlias ? (
                                        <p className="text-destructive text-xs">
                                            {errors.privacyAlias.message}
                                        </p>
                                    ) : (
                                        <p className="text-muted-foreground text-xs">
                                            Nome curto exibido no link da política no app mobile. Se
                                            vazio, usa o nome do cliente. Útil quando várias unidades
                                            compartilham a mesma política.
                                        </p>
                                    )}
                                </div>

                                <div className="min-w-0 space-y-2">
                                    <Label htmlFor="client-primaryColor" className={fieldLabel}>
                                        Cor primária{" "}
                                        <span className={hintClass}>(opcional)</span>
                                    </Label>
                                    <div className="flex items-center gap-3">
                                        <Controller
                                            name="primaryColor"
                                            control={control}
                                            render={({ field }) => (
                                                <>
                                                    <Input
                                                        id="client-primaryColor"
                                                        type="color"
                                                        className="h-10 w-14 shrink-0 cursor-pointer p-1"
                                                        value={
                                                            field.value &&
                                                            /^#[0-9A-Fa-f]{6}$/.test(field.value)
                                                                ? field.value
                                                                : "#00c7b7"
                                                        }
                                                        onChange={(e) =>
                                                            field.onChange(e.target.value)
                                                        }
                                                        aria-label="Selecionar cor primária"
                                                    />
                                                    <Input
                                                        type="text"
                                                        className={cn(
                                                            "bg-card h-10 px-3 font-mono",
                                                            controlClass,
                                                        )}
                                                        aria-invalid={!!errors.primaryColor}
                                                        value={field.value ?? ""}
                                                        onChange={field.onChange}
                                                        placeholder="#00c7b7"
                                                    />
                                                </>
                                            )}
                                        />
                                    </div>
                                    {errors.primaryColor ? (
                                        <p className="text-destructive text-xs">
                                            {errors.primaryColor.message}
                                        </p>
                                    ) : (
                                        <p className="text-muted-foreground text-xs">
                                            Botões e destaques no app mobile.
                                        </p>
                                    )}
                                </div>

                                <div className="min-w-0 sm:col-span-2">
                                    <ClientBrandingPreview
                                        logoUrl={watchedLogoUrl}
                                        primaryColor={watchedPrimaryColor}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <SectionStep step={5} title="Situação" />
                            <Controller
                                name="isActive"
                                control={control}
                                render={({ field }) => (
                                    <div className="bg-card rounded-xl border px-4 py-4 shadow-sm ring-1 ring-black/5">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="min-w-0 space-y-0.5">
                                                <Label htmlFor="client-active" className="text-sm font-medium">
                                                    Cliente ativo
                                                </Label>
                                                <p className="text-muted-foreground text-xs leading-relaxed">
                                                    Clientes inativos ficam ocultos de fluxos operacionais, mas mantêm histórico.
                                                </p>
                                            </div>
                                            <Switch
                                                id="client-active"
                                                className="shrink-0"
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </div>
                                    </div>
                                )}
                            />
                        </div>
                    </div>

                    <SheetFooter className="bg-card shrink-0 flex-col gap-3 border-t px-6 py-5 sm:flex-row sm:justify-end">
                        <Button
                            type="button"
                            variant="ghost"
                            className="hover:bg-muted w-full sm:w-auto"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="w-full shadow-md sm:w-auto"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    Salvando...
                                </>
                            ) : mode === "create" ? (
                                "Cadastrar cliente"
                            ) : (
                                "Salvar alterações"
                            )}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
