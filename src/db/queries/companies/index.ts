import { asc, eq, ne, and } from "drizzle-orm";

import { db } from "@/db";
import { companies } from "@/db/schema";
import { slugifyName } from "@/lib/slugify";

const SLUG_MAX = 100;

export type ListCompaniesOptions = {
    /** Quando false (padrão), retorna apenas empresas ativas. */
    includeInactive?: boolean;
};

export async function listCompanies(options?: ListCompaniesOptions) {
    const includeInactive = options?.includeInactive ?? false;

    const baseQuery = db.select().from(companies);

    if (includeInactive) {
        return baseQuery.orderBy(asc(companies.name));
    }

    return baseQuery.where(eq(companies.isActive, true)).orderBy(asc(companies.name));
}

async function isSlugTaken(slug: string, excludeCompanyId?: string): Promise<boolean> {
    if (!excludeCompanyId) {
        const rows = await db
            .select({ id: companies.id })
            .from(companies)
            .where(eq(companies.slug, slug))
            .limit(1);
        return rows.length > 0;
    }

    const rows = await db
        .select({ id: companies.id })
        .from(companies)
        .where(and(eq(companies.slug, slug), ne(companies.id, excludeCompanyId)))
        .limit(1);

    return rows.length > 0;
}

async function ensureUniqueSlug(baseName: string, excludeCompanyId?: string): Promise<string> {
    const baseSlug = slugifyName(baseName, SLUG_MAX);
    let candidate = baseSlug;

    if (!(await isSlugTaken(candidate, excludeCompanyId))) {
        return candidate;
    }

    for (let i = 2; i < 1000; i++) {
        const suffix = `-${i}`;
        const truncated = slugifyName(baseName, SLUG_MAX - suffix.length);
        candidate = `${truncated}${suffix}`;
        if (!(await isSlugTaken(candidate, excludeCompanyId))) {
            return candidate;
        }
    }

    throw new Error("Não foi possível gerar um slug único para a empresa.");
}

export async function getCompanyById(id: string) {
    const rows = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
    return rows[0];
}

export type CompanyCreateInput = {
    name: string;
    cnpj?: string | null;
    phone?: string | null;
    email?: string | null;
    logoUrl?: string | null;
    isActive?: boolean;
};

export async function createCompany(input: CompanyCreateInput) {
    const slug = await ensureUniqueSlug(input.name);
    const now = new Date();

    const [row] = await db
        .insert(companies)
        .values({
            name: input.name,
            slug,
            cnpj: input.cnpj ?? null,
            phone: input.phone ?? null,
            email: input.email ?? null,
            logoUrl: input.logoUrl ?? null,
            isActive: input.isActive ?? true,
            updatedAt: now,
        })
        .returning();

    return row;
}

export type CompanyUpdateInput = Partial<{
    name: string;
    cnpj: string | null;
    phone: string | null;
    email: string | null;
    logoUrl: string | null;
    isActive: boolean;
}>;

export async function updateCompany(id: string, input: CompanyUpdateInput) {
    const existing = await getCompanyById(id);
    if (!existing) {
        return undefined;
    }

    const setPayload: Partial<typeof companies.$inferInsert> = {};

    if (input.name !== undefined) {
        setPayload.name = input.name;
        if (input.name !== existing.name) {
            setPayload.slug = await ensureUniqueSlug(input.name, id);
        }
    }

    if (input.cnpj !== undefined) setPayload.cnpj = input.cnpj;
    if (input.phone !== undefined) setPayload.phone = input.phone;
    if (input.email !== undefined) setPayload.email = input.email;
    if (input.logoUrl !== undefined) setPayload.logoUrl = input.logoUrl;
    if (input.isActive !== undefined) setPayload.isActive = input.isActive;

    if (Object.keys(setPayload).length === 0) {
        return existing;
    }

    setPayload.updatedAt = new Date();

    const [row] = await db
        .update(companies)
        .set(setPayload)
        .where(eq(companies.id, id))
        .returning();

    return row;
}

export async function softDeleteCompany(id: string) {
    const now = new Date();
    const [row] = await db
        .update(companies)
        .set({ isActive: false, updatedAt: now })
        .where(eq(companies.id, id))
        .returning();
    return row;
}
