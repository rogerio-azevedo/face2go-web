"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ZodError } from "zod";

import {
    apiFetchAuthed,
    nestErrorMessage,
    parseResponseJson,
} from "@/lib/api-fetch";
import {
    createParentSchema,
    createSchoolClassSchema,
    createStudentSchema,
    linkParentStudentSchema,
    updateParentSchema,
    updateSchoolClassSchema,
    updateStudentSchema,
} from "@/lib/validations/school";
import type { ParentStudentLinkWithStudent } from "@/types/domain";

function zodFirstMessage(error: unknown): string {
    if (error instanceof ZodError && error.issues[0]?.message) {
        return error.issues[0].message;
    }
    return "Dados inválidos.";
}

function revalidateSchoolRoutes(clientId: string) {
    revalidatePath("/company/clientes");
    revalidatePath(`/company/clientes/${clientId}/usuarios`);
}

const ids = z.object({
    clientId: z.string().uuid(),
});

export async function listParentStudentLinksAction(
    clientId: string,
    parentId: string,
): Promise<
    | { success: true; items: ParentStudentLinkWithStudent[] }
    | { error: string }
> {
    try {
        const c = ids.safeParse({ clientId });
        const p = z.string().uuid().safeParse(parentId);
        if (!c.success || !p.success) {
            return { error: "Dados inválidos." };
        }
        const res = await apiFetchAuthed(
            `/api/clients/${c.data.clientId}/parents/${p.data}/students`,
        );
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }
        const items =
            (await parseResponseJson(res)) as ParentStudentLinkWithStudent[];
        return { success: true, items: Array.isArray(items) ? items : [] };
    } catch {
        return { error: "Sem permissão." };
    }
}

export async function createSchoolClassAction(
    clientId: string,
    input: unknown,
): Promise<{ success: true } | { error: string }> {
    try {
        const c = ids.safeParse({ clientId });
        if (!c.success) return { error: "Cliente inválido." };

        const parsed = createSchoolClassSchema.safeParse(input);
        if (!parsed.success)
            return { error: zodFirstMessage(parsed.error) };

        const res = await apiFetchAuthed(
            `/api/clients/${clientId}/school-classes`,
            { method: "POST", body: JSON.stringify(parsed.data) },
        );
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }

        revalidateSchoolRoutes(clientId);
        return { success: true };
    } catch {
        return { error: "Sem permissão." };
    }
}

export async function updateSchoolClassAction(
    clientId: string,
    classId: string,
    input: unknown,
): Promise<{ success: true } | { error: string }> {
    try {
        const cid = ids.safeParse({ clientId });
        const cid2 = z.string().uuid().safeParse(classId);
        if (!cid.success || !cid2.success)
            return { error: "Dados inválidos." };

        const parsed = updateSchoolClassSchema.safeParse(input);
        if (!parsed.success)
            return { error: zodFirstMessage(parsed.error) };

        const d = parsed.data;
        if (
            d.name === undefined &&
            d.shiftId === undefined &&
            d.year === undefined &&
            d.isActive === undefined
        ) {
            return { error: "Nada para atualizar." };
        }

        const res = await apiFetchAuthed(
            `/api/clients/${clientId}/school-classes/${classId}`,
            { method: "PATCH", body: JSON.stringify(parsed.data) },
        );
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }

        revalidateSchoolRoutes(clientId);
        return { success: true };
    } catch {
        return { error: "Sem permissão." };
    }
}

export async function createStudentAction(
    clientId: string,
    input: unknown,
): Promise<{ success: true } | { error: string }> {
    try {
        const c = ids.safeParse({ clientId });
        if (!c.success) return { error: "Cliente inválido." };

        const parsed = createStudentSchema.safeParse(input);
        if (!parsed.success)
            return { error: zodFirstMessage(parsed.error) };

        const body = stripUndefined(parsed.data);
        const res = await apiFetchAuthed(`/api/clients/${clientId}/students`, {
            method: "POST",
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }

        revalidateSchoolRoutes(clientId);
        return { success: true };
    } catch {
        return { error: "Sem permissão." };
    }
}

export async function updateStudentAction(
    clientId: string,
    studentId: string,
    input: unknown,
): Promise<{ success: true } | { error: string }> {
    try {
        const cid = ids.safeParse({ clientId });
        const sid = z.string().uuid().safeParse(studentId);
        if (!cid.success || !sid.success)
            return { error: "Dados inválidos." };

        const parsed = updateStudentSchema.safeParse(input);
        if (!parsed.success)
            return { error: zodFirstMessage(parsed.error) };

        if (Object.keys(parsed.data).length === 0)
            return { error: "Nada para atualizar." };

        const body = stripUndefined(parsed.data);

        const res = await apiFetchAuthed(
            `/api/clients/${clientId}/students/${studentId}`,
            { method: "PATCH", body: JSON.stringify(body) },
        );
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }

        revalidateSchoolRoutes(clientId);
        return { success: true };
    } catch {
        return { error: "Sem permissão." };
    }
}

export async function createParentAction(
    clientId: string,
    input: unknown,
): Promise<{ success: true } | { error: string }> {
    try {
        const c = ids.safeParse({ clientId });
        if (!c.success) return { error: "Cliente inválido." };

        const parsed = createParentSchema.safeParse(input);
        if (!parsed.success)
            return { error: zodFirstMessage(parsed.error) };

        const body = stripUndefined(parsed.data);
        const res = await apiFetchAuthed(`/api/clients/${clientId}/parents`, {
            method: "POST",
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }

        revalidateSchoolRoutes(clientId);
        return { success: true };
    } catch {
        return { error: "Sem permissão." };
    }
}

export async function updateParentAction(
    clientId: string,
    parentId: string,
    input: unknown,
): Promise<{ success: true } | { error: string }> {
    try {
        const cid = ids.safeParse({ clientId });
        const pid = z.string().uuid().safeParse(parentId);
        if (!cid.success || !pid.success)
            return { error: "Dados inválidos." };

        const parsed = updateParentSchema.safeParse(input);
        if (!parsed.success)
            return { error: zodFirstMessage(parsed.error) };

        const d = { ...parsed.data };
        if (d.password === "") {
            delete d.password;
        }

        if (
            d.name === undefined &&
            d.phone === undefined &&
            d.document === undefined &&
            d.password === undefined &&
            d.isActive === undefined
        ) {
            return { error: "Nada para atualizar." };
        }

        const body = stripUndefined(d);

        const res = await apiFetchAuthed(
            `/api/clients/${clientId}/parents/${parentId}`,
            { method: "PATCH", body: JSON.stringify(body) },
        );
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }

        revalidateSchoolRoutes(clientId);
        return { success: true };
    } catch {
        return { error: "Sem permissão." };
    }
}

export async function linkParentStudentAction(
    clientId: string,
    parentId: string,
    input: unknown,
): Promise<{ success: true } | { error: string }> {
    try {
        const cid = ids.safeParse({ clientId });
        const pid = z.string().uuid().safeParse(parentId);
        if (!cid.success || !pid.success)
            return { error: "Dados inválidos." };

        const parsed = linkParentStudentSchema.safeParse(input);
        if (!parsed.success)
            return { error: zodFirstMessage(parsed.error) };

        const res = await apiFetchAuthed(
            `/api/clients/${clientId}/parents/${parentId}/students`,
            { method: "POST", body: JSON.stringify(parsed.data) },
        );
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }

        revalidateSchoolRoutes(clientId);
        return { success: true };
    } catch {
        return { error: "Sem permissão." };
    }
}

export async function unlinkParentStudentAction(
    clientId: string,
    parentId: string,
    studentId: string,
): Promise<{ success: true } | { error: string }> {
    try {
        const cid = ids.safeParse({ clientId });
        const pid = z.string().uuid().safeParse(parentId);
        const sid = z.string().uuid().safeParse(studentId);
        if (!cid.success || !pid.success || !sid.success)
            return { error: "Dados inválidos." };

        const res = await apiFetchAuthed(
            `/api/clients/${clientId}/parents/${parentId}/students/${studentId}`,
            { method: "DELETE" },
        );
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }

        revalidateSchoolRoutes(clientId);
        return { success: true };
    } catch {
        return { error: "Sem permissão." };
    }
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
    const out = { ...obj };
    for (const k of Object.keys(out)) {
        if (out[k] === undefined) {
            delete out[k];
        }
    }
    return out;
}
