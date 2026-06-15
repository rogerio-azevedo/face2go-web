"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";

import {
    createCameraAction,
    updateCameraAction,
} from "@/app/company/cameras/actions";
import type { CameraListRow, ClientListRow } from "@/types/domain";
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
    CAMERA_BRANDS,
    CAMERA_BRAND_LABELS,
    CAMERA_TYPES,
    CAMERA_TYPE_LABELS,
    CAMERA_DIRECTIONS,
    CAMERA_DIRECTION_LABELS,
    cameraFormSchema,
    type CameraFormPayload,
} from "@/lib/validations/cameras";
import {
    cameraControlClass as controlClass,
    cameraFieldLabel as fieldLabel,
    cameraHintClass as hintClass,
    toCreateCameraApiBody as toCreateApiBody,
    toUpdateCameraApiBody as toUpdateCameraPayload,
} from "@/features/cameras/components/camera-form-utils";
import { cn } from "@/lib/utils";

export type CameraFormProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: "create" | "edit";
    camera?: CameraListRow | null;
    clients: ClientListRow[];
};

export function CameraForm({
    open,
    onOpenChange,
    mode,
    camera,
    clients,
}: CameraFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const defaultClientId = clients[0]?.id ?? "";

    const emptyDefaults: CameraFormPayload = useMemo(
        () => ({
            clientId: defaultClientId,
            type: "lpr",
            direction: "",
            brand: "intelbras",
            name: "",
            description: undefined,
            ip: "",
            port: 80,
            serialNumber: undefined,
            model: undefined,
            location: undefined,
            deviceId: undefined,
            username: "",
            password: "",
            isActive: true,
        }),
        [defaultClientId],
    );

    const defaultValues = useMemo((): CameraFormPayload => {
        if (mode === "edit" && camera) {
            const brand: CameraFormPayload["brand"] = CAMERA_BRANDS.includes(
                camera.brand as (typeof CAMERA_BRANDS)[number],
            )
                ? (camera.brand as CameraFormPayload["brand"])
                : "intelbras";
            return {
                clientId: camera.clientId,
                type: camera.type,
                direction: camera.direction ?? "",
                brand,
                name: camera.name,
                description: camera.description ?? undefined,
                ip: camera.ip,
                port: camera.port,
                serialNumber: camera.serialNumber ?? undefined,
                model: camera.model ?? undefined,
                location: camera.location ?? undefined,
                deviceId: camera.deviceId ?? undefined,
                username: camera.username ?? "",
                password: "",
                isActive: camera.isActive,
            };
        }
        return emptyDefaults;
    }, [mode, camera, emptyDefaults]);

    const form = useForm<CameraFormPayload>({
        resolver: zodResolver(cameraFormSchema) as Resolver<CameraFormPayload>,
        defaultValues,
    });

    const {
        register,
        handleSubmit,
        control,
        reset,
        watch,
        formState: { errors },
    } = form;

    const cameraType = watch("type");

    useEffect(() => {
        if (open) {
            reset(defaultValues);
            setShowPassword(false);
        }
    }, [open, defaultValues, reset]);

    async function submit(data: CameraFormPayload) {
        setIsSubmitting(true);
        try {
            if (mode === "create") {
                const result = await createCameraAction(toCreateApiBody(data));
                if ("error" in result) {
                    toast.error(result.error);
                    return;
                }
                toast.success("Câmera cadastrada.");
            } else {
                if (!camera) {
                    toast.error("Câmera não informada.");
                    return;
                }
                const result = await updateCameraAction(
                    camera.id,
                    toUpdateCameraPayload(data),
                );
                if ("error" in result) {
                    toast.error(result.error);
                    return;
                }
                toast.success("Câmera atualizada.");
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
                        <SheetTitle>Câmera</SheetTitle>
                        <SheetDescription>
                            Cadastre ao menos um cliente antes de adicionar
                            câmeras.
                        </SheetDescription>
                    </SheetHeader>
                </SheetContent>
            </Sheet>
        );
    }

    const title = mode === "create" ? "Nova câmera" : "Editar câmera";
    const description =
        mode === "create"
            ? "Informe tipo, marca, rede e o cliente ao qual o equipamento pertence."
            : "Atualize os dados desta câmera.";

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
                                <Label
                                    htmlFor="camera-client"
                                    className={fieldLabel}
                                >
                                    Cliente *
                                </Label>
                                <select
                                    id="camera-client"
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

                            <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="min-w-0 space-y-2">
                                    <Label
                                        htmlFor="camera-type"
                                        className={fieldLabel}
                                    >
                                        Tipo *
                                    </Label>
                                    <select
                                        id="camera-type"
                                        className={cn(
                                            "border-input bg-card text-foreground flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-sm",
                                            errors.type &&
                                                "border-destructive ring-2 ring-destructive/20",
                                        )}
                                        aria-invalid={!!errors.type}
                                        {...register("type")}
                                    >
                                        {CAMERA_TYPES.map((t) => (
                                            <option key={t} value={t}>
                                                {CAMERA_TYPE_LABELS[t]}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.type ? (
                                        <p className="text-destructive text-xs">
                                            {errors.type.message}
                                        </p>
                                    ) : null}
                                </div>

                                <div className="min-w-0 space-y-2">
                                    <Label
                                        htmlFor="camera-brand"
                                        className={fieldLabel}
                                    >
                                        Marca *
                                    </Label>
                                    <select
                                        id="camera-brand"
                                        className={cn(
                                            "border-input bg-card text-foreground flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-sm",
                                            errors.brand &&
                                                "border-destructive ring-2 ring-destructive/20",
                                        )}
                                        aria-invalid={!!errors.brand}
                                        {...register("brand")}
                                    >
                                        {CAMERA_BRANDS.map((b) => (
                                            <option key={b} value={b}>
                                                {CAMERA_BRAND_LABELS[b]}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.brand ? (
                                        <p className="text-destructive text-xs">
                                            {errors.brand.message}
                                        </p>
                                    ) : null}
                                </div>
                            </div>

                            {cameraType === "lpr" ? (
                                <div className="min-w-0 space-y-2">
                                    <Label
                                        htmlFor="camera-direction"
                                        className={fieldLabel}
                                    >
                                        Sentido{" "}
                                        <span className={hintClass}>
                                            (opcional)
                                        </span>
                                    </Label>
                                    <select
                                        id="camera-direction"
                                        className={cn(
                                            "border-input bg-card text-foreground flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-sm",
                                            "focus-visible:border-ring outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50",
                                            errors.direction &&
                                                "border-destructive ring-2 ring-destructive/20",
                                        )}
                                        aria-invalid={!!errors.direction}
                                        {...register("direction")}
                                    >
                                        <option value="">Não definido</option>
                                        {CAMERA_DIRECTIONS.map((dir) => (
                                            <option key={dir} value={dir}>
                                                {CAMERA_DIRECTION_LABELS[dir]}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.direction ? (
                                        <p className="text-destructive text-xs">
                                            {errors.direction.message}
                                        </p>
                                    ) : null}
                                </div>
                            ) : null}

                            <div className="min-w-0 space-y-2">
                                <Label
                                    htmlFor="camera-name"
                                    className={fieldLabel}
                                >
                                    Nome *
                                </Label>
                                <Input
                                    id="camera-name"
                                    className={cn(
                                        "bg-card h-10 px-3",
                                        controlClass,
                                    )}
                                    aria-invalid={!!errors.name}
                                    {...register("name")}
                                    placeholder="Ex.: Garagem entrada"
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
                                <Label
                                    htmlFor="camera-description"
                                    className={fieldLabel}
                                >
                                    Descrição{" "}
                                    <span className={hintClass}>
                                        (opcional)
                                    </span>
                                </Label>
                                <Input
                                    id="camera-description"
                                    className={cn(
                                        "bg-card h-10 px-3",
                                        controlClass,
                                    )}
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
                                <Label
                                    htmlFor="camera-ip"
                                    className={fieldLabel}
                                >
                                    IP ou hostname (DNS) *
                                </Label>
                                <Input
                                    id="camera-ip"
                                    className={cn(
                                        "bg-card h-10 px-3",
                                        controlClass,
                                    )}
                                    aria-invalid={!!errors.ip}
                                    {...register("ip")}
                                    placeholder="192.168.0.150 ou ddns..."
                                />
                                {errors.ip ? (
                                    <p className="text-destructive text-xs">
                                        {errors.ip.message}
                                    </p>
                                ) : null}
                            </div>

                            <div className="min-w-0 space-y-2">
                                <Label
                                    htmlFor="camera-port"
                                    className={fieldLabel}
                                >
                                    Porta (HTTP) *
                                </Label>
                                <Input
                                    id="camera-port"
                                    type="number"
                                    min={1}
                                    max={65535}
                                    className={cn(
                                        "bg-card h-10 px-3",
                                        controlClass,
                                    )}
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
                                    htmlFor="camera-device-id"
                                    className={fieldLabel}
                                >
                                    Device ID{" "}
                                    <span className={hintClass}>
                                        (opcional)
                                    </span>
                                </Label>
                                <Input
                                    id="camera-device-id"
                                    className={cn(
                                        "bg-card h-10 px-3",
                                        controlClass,
                                    )}
                                    aria-invalid={!!errors.deviceId}
                                    {...register("deviceId")}
                                />
                                {errors.deviceId ? (
                                    <p className="text-destructive text-xs">
                                        {errors.deviceId.message}
                                    </p>
                                ) : null}
                            </div>

                            <div className="min-w-0 space-y-2">
                                <Label
                                    htmlFor="camera-serial"
                                    className={fieldLabel}
                                >
                                    Número de série{" "}
                                    <span className={hintClass}>
                                        (opcional)
                                    </span>
                                </Label>
                                <Input
                                    id="camera-serial"
                                    className={cn(
                                        "bg-card h-10 px-3",
                                        controlClass,
                                    )}
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
                                <Label
                                    htmlFor="camera-model"
                                    className={fieldLabel}
                                >
                                    Modelo{" "}
                                    <span className={hintClass}>
                                        (opcional)
                                    </span>
                                </Label>
                                <Input
                                    id="camera-model"
                                    className={cn(
                                        "bg-card h-10 px-3",
                                        controlClass,
                                    )}
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
                                <Label
                                    htmlFor="camera-location"
                                    className={fieldLabel}
                                >
                                    Localização física{" "}
                                    <span className={hintClass}>
                                        (opcional)
                                    </span>
                                </Label>
                                <Input
                                    id="camera-location"
                                    className={cn(
                                        "bg-card h-10 px-3",
                                        controlClass,
                                    )}
                                    aria-invalid={!!errors.location}
                                    {...register("location")}
                                    placeholder="Ex.: Portaria"
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
                                    Credenciais da câmera
                                </p>
                                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                                    Usuário e senha do painel HTTP (Digest —
                                    Intelbras necessário para streams LPR e
                                    snapshots). A senha é armazenada criptografada.
                                </p>
                            </div>
                            <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="min-w-0 space-y-2 sm:col-span-2">
                                    <Label
                                        htmlFor="camera-username"
                                        className={fieldLabel}
                                    >
                                        Usuário{" "}
                                        <span className={hintClass}>
                                            (opcional)
                                        </span>
                                    </Label>
                                    <Input
                                        id="camera-username"
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
                                        htmlFor="camera-password"
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
                                            id="camera-password"
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
                                            className="text-muted-foreground absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2"
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
                                                    htmlFor="camera-active"
                                                    className="text-sm font-medium"
                                                >
                                                    Câmera ativa
                                                </Label>
                                                <p className="text-muted-foreground text-xs leading-relaxed">
                                                    Câmeras inativas não recebem
                                                    monitoramento nem sync de placas LPR.
                                                </p>
                                            </div>
                                            <Switch
                                                id="camera-active"
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
                                "Cadastrar câmera"
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
