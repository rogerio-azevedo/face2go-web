"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ZodError } from "zod";

import { auth } from "@/auth";

import {
    apiFetchAuthed,
    getApiBaseUrl,
    nestErrorMessage,
    parseResponseJson,
} from "@/lib/api-fetch";
import {
    buildSchoolListQuery,
    normalizePaginated,
    type SchoolListParams,
} from "@/lib/pagination";
import {
    createResponsibleSchema,
    createSchoolClassSchema,
    createStudentSchema,
    linkResponsibleStudentSchema,
    linkStudentClassSchema,
    updateResponsibleSchema,
    updateResponsibleStudentLinkSchema,
    updateSchoolClassSchema,
    updateStudentSchema,
} from "@/lib/validations/school";
import type {
    PaginatedResponse,
    PickupAuthorizationRow,
    ResponsibleRow,
    ResponsibleStudentLinkWithStudent,
    SchoolClassRow,
    StudentResponsibleLinkWithResponsible,
    StudentRow,
} from "@/types/domain";

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

export async function listStudentsAction(
    clientId: string,
    params: SchoolListParams = {},
): Promise<
    | { success: true; result: PaginatedResponse<StudentRow> }
    | { error: string }
> {
    try {
        const c = ids.safeParse({ clientId });
        if (!c.success) return { error: "Cliente inválido." };
        const qs = buildSchoolListQuery(params);
        const res = await apiFetchAuthed(
            `/api/clients/${c.data.clientId}/students?${qs}`,
        );
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }
        const parsed = await parseResponseJson(res);
        return {
            success: true,
            result: normalizePaginated<StudentRow>(parsed),
        };
    } catch {
        return { error: "Sem permissão." };
    }
}

export async function listResponsiblesAction(
    clientId: string,
    params: SchoolListParams = {},
): Promise<
    | { success: true; result: PaginatedResponse<ResponsibleRow> }
    | { error: string }
> {
    try {
        const c = ids.safeParse({ clientId });
        if (!c.success) return { error: "Cliente inválido." };
        const qs = buildSchoolListQuery(params);
        const res = await apiFetchAuthed(
            `/api/clients/${c.data.clientId}/responsibles?${qs}`,
        );
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }
        const parsed = await parseResponseJson(res);
        return {
            success: true,
            result: normalizePaginated<ResponsibleRow>(parsed),
        };
    } catch {
        return { error: "Sem permissão." };
    }
}

export async function listResponsibleStudentLinksAction(
    clientId: string,
    responsibleId: string,
): Promise<
    | { success: true; items: ResponsibleStudentLinkWithStudent[] }
    | { error: string }
> {
    try {
        const c = ids.safeParse({ clientId });
        const p = z.string().uuid().safeParse(responsibleId);
        if (!c.success || !p.success) {
            return { error: "Dados inválidos." };
        }
        const res = await apiFetchAuthed(
            `/api/clients/${c.data.clientId}/responsibles/${p.data}/students`,
        );
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }
        const items =
            (await parseResponseJson(res)) as ResponsibleStudentLinkWithStudent[];
        return { success: true, items: Array.isArray(items) ? items : [] };
    } catch {
        return { error: "Sem permissão." };
    }
}

export async function getStudentByIdAction(
    clientId: string,
    studentId: string,
): Promise<{ success: true; student: StudentRow } | { error: string }> {
    try {
        const c = ids.safeParse({ clientId });
        const s = z.string().uuid().safeParse(studentId);
        if (!c.success || !s.success) return { error: "Dados inválidos." };
        const res = await apiFetchAuthed(
            `/api/clients/${c.data.clientId}/students/${s.data}`,
        );
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }
        const student = (await parseResponseJson(res)) as StudentRow;
        return { success: true, student };
    } catch {
        return { error: "Sem permissão." };
    }
}

export async function getResponsibleByIdAction(
    clientId: string,
    responsibleId: string,
): Promise<{ success: true; responsible: ResponsibleRow } | { error: string }> {
    try {
        const c = ids.safeParse({ clientId });
        const p = z.string().uuid().safeParse(responsibleId);
        if (!c.success || !p.success) return { error: "Dados inválidos." };
        const res = await apiFetchAuthed(
            `/api/clients/${c.data.clientId}/responsibles/${p.data}`,
        );
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }
        const responsible = (await parseResponseJson(res)) as ResponsibleRow;
        return { success: true, responsible };
    } catch {
        return { error: "Sem permissão." };
    }
}

export async function listSchoolClassesAction(
    clientId: string,
): Promise<
    | { success: true; items: SchoolClassRow[] }
    | { error: string }
> {
    try {
        const c = ids.safeParse({ clientId });
        if (!c.success) return { error: "Cliente inválido." };
        const res = await apiFetchAuthed(
            `/api/clients/${c.data.clientId}/school-classes`,
        );
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }
        const items = (await parseResponseJson(res)) as SchoolClassRow[];
        return { success: true, items: Array.isArray(items) ? items : [] };
    } catch {
        return { error: "Sem permissão." };
    }
}

export async function linkStudentClassAction(
    clientId: string,
    studentId: string,
    input: unknown,
): Promise<{ success: true } | { error: string }> {
    try {
        const cid = ids.safeParse({ clientId });
        const sid = z.string().uuid().safeParse(studentId);
        if (!cid.success || !sid.success) {
            return { error: "Dados inválidos." };
        }

        const parsed = linkStudentClassSchema.safeParse(input);
        if (!parsed.success) {
            return { error: zodFirstMessage(parsed.error) };
        }

        const res = await apiFetchAuthed(
            `/api/clients/${clientId}/students/${studentId}/classes`,
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

export async function unlinkStudentClassAction(
    clientId: string,
    studentId: string,
    classId: string,
): Promise<{ success: true } | { error: string }> {
    try {
        const cid = ids.safeParse({ clientId });
        const sid = z.string().uuid().safeParse(studentId);
        const cid2 = z.string().uuid().safeParse(classId);
        if (!cid.success || !sid.success || !cid2.success) {
            return { error: "Dados inválidos." };
        }

        const res = await apiFetchAuthed(
            `/api/clients/${clientId}/students/${studentId}/classes/${classId}`,
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

export async function createResponsibleAction(
    clientId: string,
    input: unknown,
): Promise<{ success: true } | { error: string }> {
    try {
        const c = ids.safeParse({ clientId });
        if (!c.success) return { error: "Cliente inválido." };

        const parsed = createResponsibleSchema.safeParse(input);
        if (!parsed.success)
            return { error: zodFirstMessage(parsed.error) };

        const body = stripUndefined(parsed.data);
        const res = await apiFetchAuthed(`/api/clients/${clientId}/responsibles`, {
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

export async function updateResponsibleAction(
    clientId: string,
    responsibleId: string,
    input: unknown,
): Promise<{ success: true } | { error: string }> {
    try {
        const cid = ids.safeParse({ clientId });
        const pid = z.string().uuid().safeParse(responsibleId);
        if (!cid.success || !pid.success)
            return { error: "Dados inválidos." };

        const parsed = updateResponsibleSchema.safeParse(input);
        if (!parsed.success)
            return { error: zodFirstMessage(parsed.error) };

        const d = { ...parsed.data };
        if (d.password === "") {
            delete d.password;
        }

        if (
            d.name === undefined &&
            d.email === undefined &&
            d.phone === undefined &&
            d.document === undefined &&
            d.password === undefined &&
            d.isActive === undefined
        ) {
            return { error: "Nada para atualizar." };
        }

        const body = stripUndefined(d);

        const res = await apiFetchAuthed(
            `/api/clients/${clientId}/responsibles/${responsibleId}`,
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

export async function linkResponsibleStudentAction(
    clientId: string,
    responsibleId: string,
    input: unknown,
): Promise<{ success: true } | { error: string }> {
    try {
        const cid = ids.safeParse({ clientId });
        const pid = z.string().uuid().safeParse(responsibleId);
        if (!cid.success || !pid.success)
            return { error: "Dados inválidos." };

        const parsed = linkResponsibleStudentSchema.safeParse(input);
        if (!parsed.success)
            return { error: zodFirstMessage(parsed.error) };

        const res = await apiFetchAuthed(
            `/api/clients/${clientId}/responsibles/${responsibleId}/students`,
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

export async function updateResponsibleStudentLinkAction(
    clientId: string,
    responsibleId: string,
    studentId: string,
    input: unknown,
): Promise<{ success: true } | { error: string }> {
    try {
        const cid = ids.safeParse({ clientId });
        const pid = z.string().uuid().safeParse(responsibleId);
        const sid = z.string().uuid().safeParse(studentId);
        if (!cid.success || !pid.success || !sid.success)
            return { error: "Dados inválidos." };

        const parsed = updateResponsibleStudentLinkSchema.safeParse(input);
        if (!parsed.success)
            return { error: zodFirstMessage(parsed.error) };

        const d = parsed.data;
        if (
            d.relationshipType === undefined &&
            d.isAuthorizedPickup === undefined
        ) {
            return { error: "Nada para atualizar." };
        }

        const body = stripUndefined(parsed.data);

        const res = await apiFetchAuthed(
            `/api/clients/${clientId}/responsibles/${responsibleId}/students/${studentId}`,
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

export async function listStudentResponsiblesAction(
    clientId: string,
    studentId: string,
): Promise<
    | { success: true; items: StudentResponsibleLinkWithResponsible[] }
    | { error: string }
> {
    try {
        const c = ids.safeParse({ clientId });
        const s = z.string().uuid().safeParse(studentId);
        if (!c.success || !s.success) {
            return { error: "Dados inválidos." };
        }
        const res = await apiFetchAuthed(
            `/api/clients/${c.data.clientId}/students/${s.data}/responsibles`,
        );
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }
        const items =
            (await parseResponseJson(res)) as StudentResponsibleLinkWithResponsible[];
        return { success: true, items: Array.isArray(items) ? items : [] };
    } catch {
        return { error: "Sem permissão." };
    }
}

export async function unlinkResponsibleStudentAction(
    clientId: string,
    responsibleId: string,
    studentId: string,
): Promise<{ success: true } | { error: string }> {
    try {
        const cid = ids.safeParse({ clientId });
        const pid = z.string().uuid().safeParse(responsibleId);
        const sid = z.string().uuid().safeParse(studentId);
        if (!cid.success || !pid.success || !sid.success)
            return { error: "Dados inválidos." };

        const res = await apiFetchAuthed(
            `/api/clients/${clientId}/responsibles/${responsibleId}/students/${studentId}`,
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

export async function listPickupAuthorizationsAction(
    clientId: string,
): Promise<
    | { success: true; items: PickupAuthorizationRow[] }
    | { error: string }
> {
    try {
        const c = ids.safeParse({ clientId });
        if (!c.success) {
            return { error: "Cliente inválido." };
        }
        const res = await apiFetchAuthed(
            `/api/clients/${c.data.clientId}/pickup-authorizations`,
        );
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }
        const items =
            (await parseResponseJson(res)) as PickupAuthorizationRow[];
        return { success: true, items: Array.isArray(items) ? items : [] };
    } catch {
        return { error: "Sem permissão." };
    }
}

export async function markUsedPickupAuthorizationAction(
    clientId: string,
    authorizationId: string,
): Promise<{ success: true } | { error: string }> {
    try {
        const c = ids.safeParse({ clientId });
        const a = z.string().uuid().safeParse(authorizationId);
        if (!c.success || !a.success) {
            return { error: "Dados inválidos." };
        }
        const res = await apiFetchAuthed(
            `/api/clients/${c.data.clientId}/pickup-authorizations/${a.data}/mark-used`,
            { method: "PATCH" },
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

export async function cancelPickupAuthorizationAction(
    clientId: string,
    authorizationId: string,
): Promise<{ success: true } | { error: string }> {
    try {
        const c = ids.safeParse({ clientId });
        const a = z.string().uuid().safeParse(authorizationId);
        if (!c.success || !a.success) {
            return { error: "Dados inválidos." };
        }
        const res = await apiFetchAuthed(
            `/api/clients/${c.data.clientId}/pickup-authorizations/${a.data}/cancel`,
            { method: "PATCH" },
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

export async function deletePickupAuthorizationAction(
    clientId: string,
    authorizationId: string,
): Promise<{ success: true } | { error: string }> {
    try {
        const c = ids.safeParse({ clientId });
        const a = z.string().uuid().safeParse(authorizationId);
        if (!c.success || !a.success) {
            return { error: "Dados inválidos." };
        }
        const res = await apiFetchAuthed(
            `/api/clients/${c.data.clientId}/pickup-authorizations/${a.data}`,
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

export async function syncStudentFaceAction(
    clientId: string,
    studentId: string,
): Promise<
    | {
          success: true;
          deviceSyncStatus: string;
          deviceSyncError: string | null;
      }
    | { error: string }
> {
    const cid = z.string().uuid().safeParse(clientId);
    const sid = z.string().uuid().safeParse(studentId);
    if (!cid.success || !sid.success) return { error: "ID inválido." };
    try {
        const res = await apiFetchAuthed(
            `/api/clients/${cid.data}/students/${sid.data}/face/sync`,
            { method: "POST" },
        );
        const data = (await parseResponseJson(res)) as {
            deviceSyncStatus?: string;
            deviceSyncError?: string | null;
        };
        if (!res.ok) return { error: nestErrorMessage(data) };
        revalidateSchoolRoutes(clientId);
        return {
            success: true,
            deviceSyncStatus: String(data.deviceSyncStatus ?? ""),
            deviceSyncError: data.deviceSyncError ?? null,
        };
    } catch {
        return { error: "Sem permissão." };
    }
}

export async function syncResponsibleFaceAction(
    clientId: string,
    responsibleId: string,
): Promise<
    | {
          success: true;
          deviceSyncStatus: string;
          deviceSyncError: string | null;
      }
    | { error: string }
> {
    const cid = z.string().uuid().safeParse(clientId);
    const rid = z.string().uuid().safeParse(responsibleId);
    if (!cid.success || !rid.success) return { error: "ID inválido." };
    try {
        const res = await apiFetchAuthed(
            `/api/clients/${cid.data}/responsibles/${rid.data}/face/sync`,
            { method: "POST" },
        );
        const data = (await parseResponseJson(res)) as {
            deviceSyncStatus?: string;
            deviceSyncError?: string | null;
        };
        if (!res.ok) return { error: nestErrorMessage(data) };
        revalidateSchoolRoutes(clientId);
        return {
            success: true,
            deviceSyncStatus: String(data.deviceSyncStatus ?? ""),
            deviceSyncError: data.deviceSyncError ?? null,
        };
    } catch {
        return { error: "Sem permissão." };
    }
}

export async function getStudentsGlobalFaceSyncSseUrlAction(
    clientId: string,
): Promise<{ url: string } | { error: string }> {
    const cid = z.string().uuid().safeParse(clientId);
    if (!cid.success) return { error: "Cliente inválido." };
    try {
        const session = await auth();
        const token = session?.accessToken;
        if (!token) return { error: "Não autenticado." };
        const base = getApiBaseUrl();
        const url = `${base}/api/clients/${cid.data}/students/face/global-sync/progress?token=${encodeURIComponent(token)}`;
        return { url };
    } catch {
        return { error: "Não autenticado." };
    }
}

export async function getResponsiblesGlobalFaceSyncSseUrlAction(
    clientId: string,
): Promise<{ url: string } | { error: string }> {
    const cid = z.string().uuid().safeParse(clientId);
    if (!cid.success) return { error: "Cliente inválido." };
    try {
        const session = await auth();
        const token = session?.accessToken;
        if (!token) return { error: "Não autenticado." };
        const base = getApiBaseUrl();
        const url = `${base}/api/clients/${cid.data}/responsibles/face/global-sync/progress?token=${encodeURIComponent(token)}`;
        return { url };
    } catch {
        return { error: "Não autenticado." };
    }
}
