import { z } from "zod";

export const updateRegistrationFormSchema = z.object({
    name: z.string().trim().min(2, "Informe o nome.").max(255),
    document: z.string().trim().min(5, "Informe o documento.").max(32),
    phone: z.string().trim().min(8, "Informe o telefone.").max(32),
    email: z.email("E-mail inválido."),
    block: z.string().optional(),
    unit: z.string().optional(),
    room: z.string().optional(),
});

export type UpdateRegistrationFormValues = z.infer<
    typeof updateRegistrationFormSchema
>;
