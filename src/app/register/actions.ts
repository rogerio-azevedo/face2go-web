"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { ZodError } from "zod";

import { db } from "@/db";
import { users, companyUsers } from "@/db/schema";
import { getInviteByCode, incrementInviteUsedCount } from "@/db/queries/invites";
import { registerSchema } from "@/lib/validations/register";

function zodFirstMessage(error: unknown): string {
    if (error instanceof ZodError && error.issues[0]?.message) {
        return error.issues[0].message;
    }
    return "Dados inválidos.";
}

export type InvitePreview = {
    role: "company_admin" | "company_operator";
    companyName: string;
} | null;

export async function getInvitePreviewAction(code: string): Promise<InvitePreview> {
    const trimmed = code?.trim() ?? "";
    if (trimmed.length < 4) return null;

    const bundle = await getInviteByCode(trimmed);
    if (!bundle?.invite?.isActive) return null;

    const { invite, company } = bundle;
    if (invite.expiresAt && invite.expiresAt < new Date()) return null;
    if (!company?.isActive) return null;

    return {
        role: invite.role,
        companyName: company.name,
    };
}

export async function registerWithInviteAction(
    input: unknown,
): Promise<{ success: true } | { success: false; error: string }> {
    const parsed = registerSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: zodFirstMessage(parsed.error) };
    }

    const { email, password, name, phone, jobTitle, invite: code } =
        parsed.data;

    const bundle = await getInviteByCode(code.trim());
    if (!bundle?.invite?.isActive) {
        return { success: false, error: "Convite inválido ou inativo." };
    }

    const { invite, company } = bundle;
    if (invite.expiresAt && invite.expiresAt < new Date()) {
        return { success: false, error: "Convite expirado." };
    }
    if (!company?.isActive) {
        return { success: false, error: "Empresa inativa." };
    }

    const existing = await db.query.users.findFirst({
        where: eq(users.email, email),
    });
    if (existing) {
        return { success: false, error: "E-mail já cadastrado." };
    }

    const hashed = await bcrypt.hash(password, 10);

    try {
        const userId = crypto.randomUUID();
        await db.insert(users).values({
            id: userId,
            email,
            password: hashed,
            name,
            role: "member",
            isActive: true,
        });

        await db.insert(companyUsers).values({
            companyId: company.id,
            userId,
            role: invite.role,
            jobTitle,
            phone: phone.replace(/\D/g, "") || phone.trim(),
            isActive: true,
        });

        await incrementInviteUsedCount(invite.id);
        return { success: true };
    } catch {
        return { success: false, error: "Não foi possível concluir o cadastro." };
    }
}
