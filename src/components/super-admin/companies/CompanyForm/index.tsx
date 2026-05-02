"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import {
    createCompanyAction,
    updateCompanyAction,
} from "@/app/super-admin/companies/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    companySchema,
    type CompanyFormPayload,
} from "@/lib/validations/companies";

import { cn } from "@/lib/utils";

/** Payload do form (opcionais podem estar omitidas após Serialização das Server Actions). */
type CompanyFormInput = CompanyFormPayload;

const emptyDefaults: CompanyFormInput = {
    name: "",
    cnpj: undefined,
    phone: undefined,
    email: undefined,
    logoUrl: undefined,
    isActive: true,
};

/** Máscara simples XX.XXX.XXX/XXXX-XX enquanto o usuário digita. */
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

export type CompanyFormProps = {
    mode: "create" | "edit";
    companyId?: string;
    initialValues?: Partial<CompanyFormInput>;
};

export function CompanyForm({ mode, companyId, initialValues }: CompanyFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const defaultValues = useMemo(() => {
        return {
            ...emptyDefaults,
            ...initialValues,
        } satisfies CompanyFormInput;
    }, [initialValues]);

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<CompanyFormInput>({
        resolver: zodResolver(companySchema),
        defaultValues,
    });

    const onSubmit = handleSubmit(async (data) => {
        setIsSubmitting(true);
        try {
            if (mode === "create") {
                const result = await createCompanyAction(data);
                if ("error" in result) {
                    toast.error(result.error);
                    return;
                }
                toast.success("Empresa criada.");
            } else {
                if (!companyId) {
                    toast.error("ID da empresa não informado.");
                    return;
                }
                const result = await updateCompanyAction(companyId, data);
                if ("error" in result) {
                    toast.error(result.error);
                    return;
                }
                toast.success("Empresa atualizada.");
            }
            router.push("/super-admin/companies");
            router.refresh();
        } finally {
            setIsSubmitting(false);
        }
    });

    return (
        <Card className="max-w-xl shadow-md">
            <CardHeader>
                <CardTitle>
                    {mode === "create" ? "Nova empresa" : "Editar empresa"}
                </CardTitle>
            </CardHeader>
            <form onSubmit={onSubmit}>
                <CardContent className="flex flex-col gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nome</Label>
                        <Input
                            id="name"
                            autoComplete="organization"
                            aria-invalid={!!errors.name}
                            {...register("name")}
                        />
                        {errors.name ? (
                            <p className="text-xs text-destructive">
                                {errors.name.message}
                            </p>
                        ) : null}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="cnpj">CNPJ</Label>
                        <Controller
                            name="cnpj"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    id="cnpj"
                                    aria-invalid={!!errors.cnpj}
                                    value={field.value ?? ""}
                                    onChange={(e) =>
                                        field.onChange(maskCnpjInput(e.target.value))
                                    }
                                    placeholder="00.000.000/0000-00"
                                />
                            )}
                        />
                        {errors.cnpj ? (
                            <p className="text-xs text-destructive">
                                {errors.cnpj.message}
                            </p>
                        ) : null}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input
                            id="phone"
                            type="tel"
                            aria-invalid={!!errors.phone}
                            {...register("phone")}
                        />
                        {errors.phone ? (
                            <p className="text-xs text-destructive">
                                {errors.phone.message}
                            </p>
                        ) : null}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input
                            id="email"
                            type="email"
                            autoComplete="email"
                            aria-invalid={!!errors.email}
                            {...register("email")}
                        />
                        {errors.email ? (
                            <p className="text-xs text-destructive">
                                {errors.email.message}
                            </p>
                        ) : null}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="logoUrl">
                            URL da logo{" "}
                            <span className="font-normal text-muted-foreground">
                                (opcional)
                            </span>
                        </Label>
                        <Input
                            id="logoUrl"
                            type="url"
                            placeholder="https://..."
                            aria-invalid={!!errors.logoUrl}
                            {...register("logoUrl")}
                        />
                        {errors.logoUrl ? (
                            <p className="text-xs text-destructive">
                                {errors.logoUrl.message}
                            </p>
                        ) : null}
                    </div>

                    <Controller
                        name="isActive"
                        control={control}
                        render={({ field }) => (
                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <Label htmlFor="isActive">Empresa ativa</Label>
                                <Switch
                                    id="isActive"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </div>
                        )}
                    />
                </CardContent>
                <CardFooter className="flex flex-wrap gap-3">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting
                            ? "Salvando..."
                            : mode === "create"
                              ? "Criar empresa"
                              : "Salvar alterações"}
                    </Button>
                    <Link
                        href="/super-admin/companies"
                        aria-disabled={isSubmitting}
                        className={cn(
                            buttonVariants({ variant: "outline" }),
                            isSubmitting && "pointer-events-none opacity-50",
                        )}
                    >
                        Cancelar
                    </Link>
                </CardFooter>
            </form>
        </Card>
    );
}
