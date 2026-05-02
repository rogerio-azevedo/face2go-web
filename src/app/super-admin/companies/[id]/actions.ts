"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";

import { auth } from "@/auth";
import { getCompanyById } from "@/db/queries/companies";
import { generateInviteCode } from "@/db/queries/invites";
import { generateInviteSchema } from "@/lib/validations/invites";

function zodFirstMessage(error: unknown): string {
    if (error instanceof ZodError && error.issues[0]?.message) {
        return error.issues[0].message;
    }
    return "Dados inválidos.";
}

export async function generateInviteAction(formData: FormData): Promise<
    | { success: true; code: string }
    | { success: false; error: string }
> {
    const session = await auth();
    if (session?.user?.role !== "super_admin") {
        return { success: false, error: "Sem permissão." };
    }

    const companyId = formData.get("companyId")?.toString() ?? "";
    const role = formData.get("role")?.toString() ?? "";
    const parsed = generateInviteSchema.safeParse({
        companyId,
        role,
    });
    if (!parsed.success) {
        return { success: false, error: zodFirstMessage(parsed.error) };
    }

    const company = await getCompanyById(parsed.data.companyId);
    if (!company) {
        return { success: false, error: "Empresa não encontrada." };
    }
    if (!company.isActive) {
        return { success: false, error: "Empresa inativa." };
    }

    const result = await generateInviteCode(parsed.data);
    if (!result.success) {
        return { success: false, error: result.error };
    }

    revalidatePath(`/super-admin/companies/${parsed.data.companyId}`);
    revalidatePath("/super-admin/companies");

    return { success: true, code: result.code };
}
