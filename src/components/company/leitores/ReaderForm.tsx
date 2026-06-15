"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";

import {
    createReaderAction,
    updateReaderAction,
} from "@/app/company/leitores/actions";
import { deferInEffect } from "@/lib/defer-in-effect";
import type { ClientListRow, ReaderListRow } from "@/types/domain";
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
    READER_BRANDS,
    READER_BRAND_LABELS,
    READER_DIRECTIONS,
    READER_DIRECTION_LABELS,
    readerFormSchema,
    type ReaderFormPayload,
} from "@/lib/validations/readers";
import { cn } from "@/lib/utils";

const fieldLabel =
    "text-muted-foreground text-xs font-semibold uppercase tracking-wider";
const controlClass =
    "shadow-sm aria-invalid:border-destructive aria-invalid:ring-destructive/25 sm:h-10";
const hintClass =
    "font-normal lowercase normal-case tracking-normal text-muted-foreground";

function toCreateApiBody(data: ReaderFormPayload) {
    const body: Record<string, unknown> = {
        clientId: data.clientId,
        brand: data.brand,
        name: data.name,
        description: data.description,
        ip: data.ip,
        port: data.port,
        serialNumber: data.serialNumber,
        model: data.model,
        location: data.location,
        isActive: data.isActive,
    };
    if (data.direction !== "") {
        body.direction = data.direction;
    }
    const u = data.username.trim();
    if (u) body.username = u;
    if (data.password.length > 0) body.password = data.password;
    return body;
}

function toUpdateApiBody(data: ReaderFormPayload) {
    const body: Record<string, unknown> = {
        clientId: data.clientId,
        brand: data.brand,
        name: data.name,
        description: data.description,
        ip: data.ip,
        port: data.port,
        serialNumber: data.serialNumber,
        model: data.model,
        location: data.location,
        isActive: data.isActive,
        direction: data.direction === "" ? null : data.direction,
        username: data.username.trim() ? data.username.trim() : null,
    };
    if (data.password.length > 0) body.password = data.password;
    return body;
}

export type ReaderFormProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: "create" | "edit";
    reader?: ReaderListRow | null;
    clients: ClientListRow[];
};

export function ReaderForm({
    open,
    onOpenChange,
    mode,
    reader,
    clients,
}: ReaderFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const defaultClientId = clients[0]?.id ?? "";

    const emptyDefaults: ReaderFormPayload = useMemo(
        () => ({
            clientId: defaultClientId,
            brand: "intelbras",
            direction: "",
            name: "",
            description: undefined,
            ip: "",
            port: 80,
            serialNumber: undefined,
            model: undefined,
            location: undefined,
            username: "",
            password: "",
            isActive: true,
        }),
        [defaultClientId],
    );

    const defaultValues = useMemo((): ReaderFormPayload => {
        if (mode === "edit" && reader) {
            return {
                clientId: reader.clientId,
                brand: reader.brand,
                direction: reader.direction ?? "",
                name: reader.name,
                description: reader.description ?? undefined,
                ip: reader.ip,
                port: reader.port,
                serialNumber: reader.serialNumber ?? undefined,
                model: reader.model ?? undefined,
                location: reader.location ?? undefined,
                username: reader.username ?? "",
                password: "",
                isActive: reader.isActive,
            };
        }
        return emptyDefaults;
    }, [mode, reader, emptyDefaults]);

    const form = useForm<ReaderFormPayload>({
        resolver: zodResolver(readerFormSchema) as Resolver<ReaderFormPayload>,
        defaultValues,
    });

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = form;

    useEffect(() => {
        deferInEffect(() => {
            if (open) {
                reset(defaultValues);
                setShowPassword(false);
            }
        });
    }, [open, defaultValues, reset]);

    async function submit(data: ReaderFormPayload) {
        setIsSubmitting(true);
        try {
            if (mode === "create") {
                const result = await createReaderAction(toCreateApiBody(data));
                if ("error" in result) {
                    toast.error(result.error);
                    return;
                }
                toast.success("Leitor cadastrado.");
            } else {
                if (!reader) {
                    toast.error("Leitor não informado.");
                    return;
                }
                const result = await updateReaderAction(
                    reader.id,
                    toUpdateApiBody(data),
                );
                if ("error" in result) {
                    toast.error(result.error);
                    return;
                }
                toast.success("Leitor atualizado.");
            }
            onOpenChange(false);
            router.refresh();
        } finally {
            setIsSubmitting(false);
        }
    }

    if (clients.length === 0) {
        return (
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent side="right" className="sm:max-w-md">
                    <SheetHeader>
                        <SheetTitle>Leitor facial</SheetTitle>
                        <SheetDescription>
                            Cadastre ao menos um cliente antes de adicionar
                            leitores.
                        </SheetDescription>
                    </SheetHeader>
                </SheetContent>
            </Sheet>
        );
    }

    const title = mode === "create" ? "Novo leitor" : "Editar leitor";
    const description =
        mode === "create"
            ? "Informe marca, rede e o cliente ao qual o equipamento pertence."
            : "Atualize os dados deste leitor.";

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
                            <div className="min-w-0 space-y-2">
                                <Label htmlFor="reader-client" className={fieldLabel}>
                                    Cliente *
                                </Label>
                                <select
                                    id="reader-client"
                                    className={cn(
                                        "border-input bg-card text-foreground flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-sm",
                                        "focus-visible:border-ring outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50",
                                        errors.clientId &&
                                            "border-destructive ring-2 ring-destructive/20",
                                    )}
                                    aria-invalid={!!errors.clientId}
                                    {...register("clientId")}
                                >
                                    {clients.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.clientId ? (
                                    <p className="text-destructive text-xs">
                                        {errors.clientId.message}
                                    </p>
                                ) : null}
                            </div>

                            <div className="min-w-0 space-y-2">
                                <Label htmlFor="reader-brand" className={fieldLabel}>
                                    Marca *
                                </Label>
                                <select
                                    id="reader-brand"
                                    className={cn(
                                        "border-input bg-card text-foreground flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-sm",
                                        errors.brand &&
                                            "border-destructive ring-2 ring-destructive/20",
                                    )}
                                    aria-invalid={!!errors.brand}
                                    {...register("brand")}
                                >
                                    {READER_BRANDS.map((b) => (
                                        <option key={b} value={b}>
                                            {READER_BRAND_LABELS[b]}
                                        </option>
                                    ))}
                                </select>
                                {errors.brand ? (
                                    <p className="text-destructive text-xs">
                                        {errors.brand.message}
                                    </p>
                                ) : null}
                            </div>

                            <div className="min-w-0 space-y-2">
                                <Label htmlFor="reader-direction" className={fieldLabel}>
                                    Sentido{" "}
                                    <span className={hintClass}>(opcional)</span>
                                </Label>
                                <select
                                    id="reader-direction"
                                    className={cn(
                                        "border-input bg-card text-foreground flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-sm",
                                        errors.direction &&
                                            "border-destructive ring-2 ring-destructive/20",
                                    )}
                                    aria-invalid={!!errors.direction}
                                    {...register("direction")}
                                >
                                    <option value="">Não definido</option>
                                    {READER_DIRECTIONS.map((dir) => (
                                        <option key={dir} value={dir}>
                                            {READER_DIRECTION_LABELS[dir]}
                                        </option>
                                    ))}
                                </select>
                                {errors.direction ? (
                                    <p className="text-destructive text-xs">
                                        {errors.direction.message}
                                    </p>
                                ) : null}
                            </div>

                            <div className="min-w-0 space-y-2">
                                <Label htmlFor="reader-name" className={fieldLabel}>
                                    Nome *
                                </Label>
                                <Input
                                    id="reader-name"
                                    className={cn("bg-card h-10 px-3", controlClass)}
                                    aria-invalid={!!errors.name}
                                    {...register("name")}
                                    placeholder="Ex.: Portaria principal"
                                />
                                {errors.name ? (
                                    <p className="text-destructive text-xs">
                                        {errors.name.message}
                                    </p>
                                ) : null}
                            </div>
                        </div>

                        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="min-w-0 space-y-2 sm:col-span-2">
                                <Label htmlFor="reader-description" className={fieldLabel}>
                                    Descrição{" "}
                                    <span className={hintClass}>(opcional)</span>
                                </Label>
                                <Input
                                    id="reader-description"
                                    className={cn("bg-card h-10 px-3", controlClass)}
                                    aria-invalid={!!errors.description}
                                    {...register("description")}
                                    placeholder="Observações sobre o equipamento"
                                />
                                {errors.description ? (
                                    <p className="text-destructive text-xs">
                                        {errors.description.message}
                                    </p>
                                ) : null}
                            </div>

                            <div className="min-w-0 space-y-2">
                                <Label htmlFor="reader-ip" className={fieldLabel}>
                                    IP ou hostname (DNS) *
                                </Label>
                                <Input
                                    id="reader-ip"
                                    className={cn("bg-card h-10 px-3", controlClass)}
                                    aria-invalid={!!errors.ip}
                                    {...register("ip")}
                                    placeholder="192.168.0.10 ou camera.ddns.net"
                                />
                                {errors.ip ? (
                                    <p className="text-destructive text-xs">
                                        {errors.ip.message}
                                    </p>
                                ) : null}
                            </div>

                            <div className="min-w-0 space-y-2">
                                <Label htmlFor="reader-port" className={fieldLabel}>
                                    Porta (port) *
                                </Label>
                                <Input
                                    id="reader-port"
                                    type="number"
                                    min={1}
                                    max={65535}
                                    className={cn("bg-card h-10 px-3", controlClass)}
                                    aria-invalid={!!errors.port}
                                    {...register("port")}
                                />
                                {errors.port ? (
                                    <p className="text-destructive text-xs">
                                        {errors.port.message}
                                    </p>
                                ) : null}
                            </div>

                            <div className="min-w-0 space-y-2">
                                <Label
                                    htmlFor="reader-serial"
                                    className={fieldLabel}
                                >
                                    Número de série{" "}
                                    <span className={hintClass}>(opcional)</span>
                                </Label>
                                <Input
                                    id="reader-serial"
                                    className={cn("bg-card h-10 px-3", controlClass)}
                                    aria-invalid={!!errors.serialNumber}
                                    {...register("serialNumber")}
                                />
                                {errors.serialNumber ? (
                                    <p className="text-destructive text-xs">
                                        {errors.serialNumber.message}
                                    </p>
                                ) : null}
                            </div>

                            <div className="min-w-0 space-y-2">
                                <Label htmlFor="reader-model" className={fieldLabel}>
                                    Modelo{" "}
                                    <span className={hintClass}>(opcional)</span>
                                </Label>
                                <Input
                                    id="reader-model"
                                    className={cn("bg-card h-10 px-3", controlClass)}
                                    aria-invalid={!!errors.model}
                                    {...register("model")}
                                />
                                {errors.model ? (
                                    <p className="text-destructive text-xs">
                                        {errors.model.message}
                                    </p>
                                ) : null}
                            </div>

                            <div className="min-w-0 space-y-2 sm:col-span-2">
                                <Label htmlFor="reader-location" className={fieldLabel}>
                                    Localização física{" "}
                                    <span className={hintClass}>(opcional)</span>
                                </Label>
                                <Input
                                    id="reader-location"
                                    className={cn("bg-card h-10 px-3", controlClass)}
                                    aria-invalid={!!errors.location}
                                    {...register("location")}
                                    placeholder="Ex.: Térreo, próximo ao elevador"
                                />
                                {errors.location ? (
                                    <p className="text-destructive text-xs">
                                        {errors.location.message}
                                    </p>
                                ) : null}
                            </div>
                        </div>

                        <div className="space-y-4 rounded-xl border border-dashed border-border/80 bg-card/50 px-4 py-5 shadow-sm ring-1 ring-black/5">
                            <div>
                                <p className={fieldLabel}>
                                    Credenciais no leitor
                                </p>
                                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                                    Usuário e senha do painel HTTP (Digest) —
                                    necessários para monitoramento Intelbras.
                                    A senha é armazenada criptografada.
                                </p>
                            </div>
                            <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="min-w-0 space-y-2 sm:col-span-2">
                                    <Label
                                        htmlFor="reader-username"
                                        className={fieldLabel}
                                    >
                                        Usuário{" "}
                                        <span className={hintClass}>
                                            (opcional)
                                        </span>
                                    </Label>
                                    <Input
                                        id="reader-username"
                                        autoComplete="off"
                                        className={cn(
                                            "bg-card h-10 px-3",
                                            controlClass,
                                        )}
                                        aria-invalid={!!errors.username}
                                        {...register("username")}
                                        placeholder="Ex.: admin"
                                    />
                                    {errors.username ? (
                                        <p className="text-destructive text-xs">
                                            {errors.username.message}
                                        </p>
                                    ) : null}
                                </div>
                                <div className="min-w-0 space-y-2 sm:col-span-2">
                                    <Label
                                        htmlFor="reader-password"
                                        className={fieldLabel}
                                    >
                                        Senha{" "}
                                        <span className={hintClass}>
                                            {mode === "edit"
                                                ? "(deixe em branco para manter)"
                                                : "(opcional)"}
                                        </span>
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="reader-password"
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            autoComplete="new-password"
                                            className={cn(
                                                "bg-card h-10 pr-11 pl-3",
                                                controlClass,
                                            )}
                                            aria-invalid={!!errors.password}
                                            {...register("password")}
                                            placeholder={
                                                mode === "edit"
                                                    ? "••••••••"
                                                    : "Senha do equipamento"
                                            }
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2 text-muted-foreground"
                                            onClick={() =>
                                                setShowPassword((v) => !v)
                                            }
                                            aria-label={
                                                showPassword
                                                    ? "Ocultar senha"
                                                    : "Mostrar senha"
                                            }
                                        >
                                            {showPassword ? (
                                                <EyeOff className="size-4" />
                                            ) : (
                                                <Eye className="size-4" />
                                            )}
                                        </Button>
                                    </div>
                                    {errors.password ? (
                                        <p className="text-destructive text-xs">
                                            {errors.password.message}
                                        </p>
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className={fieldLabel}>Situação</Label>
                            <Controller
                                name="isActive"
                                control={control}
                                render={({ field }) => (
                                    <div className="bg-card rounded-xl border px-4 py-4 shadow-sm ring-1 ring-black/5">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="min-w-0 space-y-0.5">
                                                <Label
                                                    htmlFor="reader-active"
                                                    className="text-sm font-medium"
                                                >
                                                    Leitor ativo
                                                </Label>
                                                <p className="text-muted-foreground text-xs leading-relaxed">
                                                    Leitores inativos não devem ser
                                                    usados em fluxos operacionais.
                                                </p>
                                            </div>
                                            <Switch
                                                id="reader-active"
                                                className="shrink-0"
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </div>
                                    </div>
                                )}
                            />
                            {errors.isActive ? (
                                <p className="text-destructive text-xs">
                                    {errors.isActive.message}
                                </p>
                            ) : null}
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
                                "Cadastrar leitor"
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
