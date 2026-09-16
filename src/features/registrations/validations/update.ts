import { z } from "zod";

import { isValidCpfOrCnpj } from "@/lib/utils/document";

export const updateRegistrationFormSchema = z.object({
    name: z.string().trim().min(2, "Informe o nome.").max(255),
    document: z
        .string()
        .trim()
        .max(32)
        .optional()
        .refine((value) => !value || isValidCpfOrCnpj(value), {
            message: "CPF ou CNPJ inválido.",
        }),
    phone: z.string().trim().max(32).optional(),
    email: z.string().trim().max(255).optional(),
    birthDate: z
        .string()
        .trim()
        .optional()
        .refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), {
            message: "Data inválida.",
        }),
    block: z.string().optional(),
    unit: z.string().optional(),
    room: z.string().optional(),
});

export type UpdateRegistrationFormValues = z.infer<
    typeof updateRegistrationFormSchema
>;
