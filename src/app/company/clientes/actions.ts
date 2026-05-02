"use server";

import { revalidatePath } from "next/cache";

import { ZodError } from "zod";
import { z } from "zod";

import { auth } from "@/auth";
import {
    createClient,
    getClientById,
    setClientActive,
    updateClient,
} from "@/db/queries/clients";
import {
    createClientSchema,
    updateClientSchema,
} from "@/lib/validations/clients";

function zodFirstMessage(error: unknown): string {
    if (error instanceof ZodError && error.issues[0]?.message) {
        return error.issues[0].message;
    }
    return "Dados inválidos.";
}

async function requireCompanyAdmin() {
    const session = await auth();
    if (
        !session?.user?.companyId ||
        session.user.role !== "company_admin"
    ) {
        return null;
    }
    return session;
}

export async function createClientAction(
    input: unknown,
): Promise<{ success: true } | { error: string }> {
    const session = await requireCompanyAdmin();
    if (!session?.user.companyId) {
        return { error: "Sem permissão." };
    }

    const parsed = createClientSchema.safeParse(input);
    if (!parsed.success) {
        return { error: zodFirstMessage(parsed.error) };
    }

    await createClient({
        companyId: session.user.companyId,
        name: parsed.data.name,
        type: parsed.data.type,
        cnpj: parsed.data.cnpj,
        phone: parsed.data.phone,
        email: parsed.data.email,
        logoUrl: parsed.data.logoUrl,
        isActive: parsed.data.isActive,
    });

    revalidatePath("/company/clientes");
    return { success: true };
}

export async function updateClientAction(
    clientId: string,
    input: unknown,
): Promise<{ success: true } | { error: string }> {
    const session = await requireCompanyAdmin();
    if (!session?.user.companyId) {
        return { error: "Sem permissão." };
    }

    const pid = z.string().uuid().safeParse(clientId);
    if (!pid.success) {
        return { error: "Cliente inválido." };
    }

    const parsed = updateClientSchema.safeParse(input);
    if (!parsed.success) {
        return { error: zodFirstMessage(parsed.error) };
    }

    const d = parsed.data;
    if (
        d.name === undefined &&
        d.type === undefined &&
        d.cnpj === undefined &&
        d.phone === undefined &&
        d.email === undefined &&
        d.logoUrl === undefined &&
        d.isActive === undefined
    ) {
        return { error: "Nada para atualizar." };
    }

    const updated = await updateClient(pid.data, session.user.companyId, {
        ...(d.name !== undefined ? { name: d.name } : {}),
        ...(d.type !== undefined ? { type: d.type } : {}),
        ...(d.cnpj !== undefined ? { cnpj: d.cnpj } : {}),
        ...(d.phone !== undefined ? { phone: d.phone } : {}),
        ...(d.email !== undefined ? { email: d.email } : {}),
        ...(d.logoUrl !== undefined ? { logoUrl: d.logoUrl } : {}),
        ...(d.isActive !== undefined ? { isActive: d.isActive } : {}),
    });

    if (!updated) {
        return { error: "Cliente não encontrado." };
    }

    revalidatePath("/company/clientes");
    return { success: true };
}

const toggleActiveSchema = z.object({
    clientId: z.string().uuid(),
    isActive: z.boolean(),
});

export async function toggleClientActiveAction(
    input: unknown,
): Promise<{ success: true } | { error: string }> {
    const session = await requireCompanyAdmin();
    if (!session?.user.companyId) {
        return { error: "Sem permissão." };
    }

    const parsed = toggleActiveSchema.safeParse(input);
    if (!parsed.success) {
        return { error: zodFirstMessage(parsed.error) };
    }

    const { clientId, isActive } = parsed.data;
    const existing = await getClientById(clientId, session.user.companyId);
    if (!existing) {
        return { error: "Cliente não encontrado." };
    }

    await setClientActive(clientId, session.user.companyId, isActive);
    revalidatePath("/company/clientes");
    return { success: true };
}
