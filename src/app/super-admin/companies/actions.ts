"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";

import { auth } from "@/auth";
import {
    createCompany,
    softDeleteCompany,
    updateCompany,
} from "@/db/queries/companies";
import {
    createCompanySchema,
    updateCompanySchema,
    type CompanyFormPayload,
    type CompanyUpdatePayload,
} from "@/lib/validations/companies";

function unauthorized(): { error: string } {
    return { error: "Sem permissão." };
}

function zodFirstMessage(error: unknown): string {
    if (error instanceof ZodError && error.issues[0]?.message) {
        return error.issues[0].message;
    }
    return "Dados inválidos.";
}

function revalidateCompaniesPages() {
    revalidatePath("/super-admin/companies");
    revalidatePath("/super-admin/dashboard");
}

export async function createCompanyAction(
    input: CompanyFormPayload,
): Promise<{ success: true } | { error: string }> {
    const session = await auth();
    if (session?.user?.role !== "super_admin") {
        return unauthorized();
    }

    const parsed = createCompanySchema.safeParse(input);
    if (!parsed.success) {
        return { error: zodFirstMessage(parsed.error) };
    }

    try {
        await createCompany({
            name: parsed.data.name,
            cnpj: parsed.data.cnpj ?? null,
            phone: parsed.data.phone ?? null,
            email: parsed.data.email ?? null,
            logoUrl: parsed.data.logoUrl ?? null,
            isActive: parsed.data.isActive,
        });
        revalidateCompaniesPages();
        return { success: true };
    } catch (e) {
        const message =
            e instanceof Error && e.message.includes("slug")
                ? e.message
                : "Não foi possível criar a empresa.";
        return { error: message };
    }
}

export async function updateCompanyAction(
    companyId: string,
    input: CompanyUpdatePayload,
): Promise<{ success: true } | { error: string }> {
    const session = await auth();
    if (session?.user?.role !== "super_admin") {
        return unauthorized();
    }

    const parsed = updateCompanySchema.safeParse(input);
    if (!parsed.success) {
        return { error: zodFirstMessage(parsed.error) };
    }

    try {
        const row = await updateCompany(companyId, {
            ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
            ...(parsed.data.cnpj !== undefined
                ? { cnpj: parsed.data.cnpj ?? null }
                : {}),
            ...(parsed.data.phone !== undefined
                ? { phone: parsed.data.phone ?? null }
                : {}),
            ...(parsed.data.email !== undefined
                ? { email: parsed.data.email ?? null }
                : {}),
            ...(parsed.data.logoUrl !== undefined
                ? { logoUrl: parsed.data.logoUrl ?? null }
                : {}),
            ...(parsed.data.isActive !== undefined
                ? { isActive: parsed.data.isActive }
                : {}),
        });

        if (!row) {
            return { error: "Empresa não encontrada." };
        }

        revalidateCompaniesPages();
        return { success: true };
    } catch (e) {
        const message =
            e instanceof Error && e.message.includes("slug")
                ? e.message
                : "Não foi possível atualizar a empresa.";
        return { error: message };
    }
}

export async function softDeleteCompanyAction(
    companyId: string,
): Promise<{ success: true } | { error: string }> {
    const session = await auth();
    if (session?.user?.role !== "super_admin") {
        return unauthorized();
    }

    const row = await softDeleteCompany(companyId);

    if (!row) {
        return { error: "Empresa não encontrada." };
    }

    revalidateCompaniesPages();
    return { success: true };
}
