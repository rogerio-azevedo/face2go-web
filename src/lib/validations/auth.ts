import { z } from "zod";

/** Login web — envia `identifier` (e-mail ou CPF) para o backend. */
export const loginSchema = z.object({
    identifier: z
        .string()
        .min(1, "Informe e-mail ou CPF")
        .refine(
            (value) => {
                const trimmed = value.trim();
                if (trimmed.includes("@")) {
                    return z.string().email().safeParse(trimmed).success;
                }
                const digits = trimmed.replace(/\D/g, "");
                return digits.length === 11;
            },
            { message: "Informe um e-mail ou CPF válido" },
        ),
    password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const joinCredentialsSchema = z.object({
    identifier: z
        .string()
        .min(1, "Informe e-mail ou CPF")
        .refine(
            (value) => {
                const trimmed = value.trim();
                if (trimmed.includes("@")) {
                    return z.string().email().safeParse(trimmed).success;
                }
                const digits = trimmed.replace(/\D/g, "");
                return digits.length === 11;
            },
            { message: "Informe um e-mail ou CPF válido" },
        ),
    password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export type JoinCredentialsInput = z.infer<typeof joinCredentialsSchema>;

export const requestPasswordSchema = z.object({
    identifier: z
        .string()
        .min(1, "Informe e-mail ou CPF")
        .refine(
            (value) => {
                const trimmed = value.trim();
                if (trimmed.includes("@")) {
                    return z.string().email().safeParse(trimmed).success;
                }
                const digits = trimmed.replace(/\D/g, "");
                return digits.length === 11;
            },
            { message: "Informe um e-mail ou CPF válido" },
        ),
});

export type RequestPasswordInput = z.infer<typeof requestPasswordSchema>;

export const resetPasswordSchema = z
    .object({
        password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
        confirmPassword: z.string().min(6, "Confirme sua senha"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "As senhas não coincidem",
        path: ["confirmPassword"],
    });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
