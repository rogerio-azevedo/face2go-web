"use server";

import { revalidatePath } from "next/cache";

import { ZodError } from "zod";
import { z } from "zod";

import { auth } from "@/auth";
import {
    createReader,
    getReaderById,
    setReaderActive,
    updateReader,
} from "@/db/queries/readers";
import {
    createReaderSchema,
    updateReaderSchema,
} from "@/lib/validations/readers";

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

export async function createReaderAction(
    input: unknown,
): Promise<{ success: true } | { error: string }> {
    const session = await requireCompanyAdmin();
    if (!session?.user.companyId) {
        return { error: "Sem permissão." };
    }

    const parsed = createReaderSchema.safeParse(input);
    if (!parsed.success) {
        return { error: zodFirstMessage(parsed.error) };
    }

    const d = parsed.data;
    const row = await createReader({
        companyId: session.user.companyId,
        clientId: d.clientId,
        brand: d.brand,
        name: d.name,
        description: d.description,
        ip: d.ip,
        port: d.port,
        serialNumber: d.serialNumber,
        model: d.model,
        location: d.location,
        isActive: d.isActive,
    });

    if (!row) {
        return { error: "Cliente não encontrado ou sem vínculo com a empresa." };
    }

    revalidatePath("/company/leitores");
    return { success: true };
}

export async function updateReaderAction(
    readerId: string,
    input: unknown,
): Promise<{ success: true } | { error: string }> {
    const session = await requireCompanyAdmin();
    if (!session?.user.companyId) {
        return { error: "Sem permissão." };
    }

    const pid = z.string().uuid().safeParse(readerId);
    if (!pid.success) {
        return { error: "Leitor inválido." };
    }

    const parsed = updateReaderSchema.safeParse(input);
    if (!parsed.success) {
        return { error: zodFirstMessage(parsed.error) };
    }

    const d = parsed.data;
    if (
        d.clientId === undefined &&
        d.brand === undefined &&
        d.name === undefined &&
        d.description === undefined &&
        d.ip === undefined &&
        d.port === undefined &&
        d.serialNumber === undefined &&
        d.model === undefined &&
        d.location === undefined &&
        d.isActive === undefined
    ) {
        return { error: "Nada para atualizar." };
    }

    const updated = await updateReader(pid.data, session.user.companyId, {
        ...(d.clientId !== undefined ? { clientId: d.clientId } : {}),
        ...(d.brand !== undefined ? { brand: d.brand } : {}),
        ...(d.name !== undefined ? { name: d.name } : {}),
        ...(d.description !== undefined
            ? { description: d.description ?? null }
            : {}),
        ...(d.ip !== undefined ? { ip: d.ip } : {}),
        ...(d.port !== undefined ? { port: d.port } : {}),
        ...(d.serialNumber !== undefined
            ? { serialNumber: d.serialNumber ?? null }
            : {}),
        ...(d.model !== undefined ? { model: d.model ?? null } : {}),
        ...(d.location !== undefined ? { location: d.location ?? null } : {}),
        ...(d.isActive !== undefined ? { isActive: d.isActive } : {}),
    });

    if (!updated) {
        return { error: "Leitor não encontrado." };
    }

    revalidatePath("/company/leitores");
    return { success: true };
}

const toggleActiveSchema = z.object({
    readerId: z.string().uuid(),
    isActive: z.boolean(),
});

export async function toggleReaderActiveAction(
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

    const { readerId, isActive } = parsed.data;
    const existing = await getReaderById(readerId, session.user.companyId);
    if (!existing) {
        return { error: "Leitor não encontrado." };
    }

    await setReaderActive(readerId, session.user.companyId, isActive);
    revalidatePath("/company/leitores");
    return { success: true };
}
