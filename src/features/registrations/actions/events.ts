"use server";

import { z } from "zod";

import type { RegistrationEvent } from "@/features/registrations/types/events";
import {
    apiFetchAuthed,
    nestErrorMessage,
    parseResponseJson,
} from "@/lib/api-fetch";

const eventTypes = [
    "note",
    "approved",
    "rejected",
    "blocked",
    "unblocked",
    "deleted",
    "restored",
] as const;

function parseEvent(data: unknown): RegistrationEvent | null {
    if (!data || typeof data !== "object") return null;
    const row = data as {
        id?: unknown;
        type?: unknown;
        body?: unknown;
        authorName?: unknown;
        createdAt?: unknown;
    };
    if (typeof row.id !== "string" || typeof row.createdAt !== "string") {
        return null;
    }
    if (
        typeof row.type !== "string" ||
        !eventTypes.includes(row.type as (typeof eventTypes)[number])
    ) {
        return null;
    }
    return {
        id: row.id,
        type: row.type as RegistrationEvent["type"],
        body: typeof row.body === "string" ? row.body : null,
        authorName: typeof row.authorName === "string" ? row.authorName : null,
        createdAt: row.createdAt,
    };
}

function eventsPath(
    variant: "company" | "client",
    registrationId: string,
    companyClientId?: string,
): { path: string } | { error: string } {
    const registration = z.string().uuid().safeParse(registrationId);
    if (!registration.success) return { error: "Cadastro inválido." };
    if (variant === "client") {
        return { path: `/api/client/registrations/${registration.data}/events` };
    }
    const client = z.string().uuid().safeParse(companyClientId);
    if (!client.success) return { error: "Cliente inválido." };
    return {
        path: `/api/clients/${client.data}/registrations/${registration.data}/events`,
    };
}

export async function listRegistrationEventsAction(
    variant: "company" | "client",
    registrationId: string,
    companyClientId?: string,
): Promise<
    { ok: true; events: RegistrationEvent[] } | { ok: false; error: string }
> {
    const target = eventsPath(variant, registrationId, companyClientId);
    if ("error" in target) return { ok: false, error: target.error };
    try {
        const res = await apiFetchAuthed(target.path);
        const data = await parseResponseJson(res);
        if (!res.ok) return { ok: false, error: nestErrorMessage(data) };
        if (!Array.isArray(data)) {
            return { ok: false, error: "Resposta inválida do histórico." };
        }
        return { ok: true, events: data.map(parseEvent).filter((row) => row != null) };
    } catch {
        return { ok: false, error: "Sem permissão." };
    }
}

export async function addRegistrationNoteAction(
    variant: "company" | "client",
    registrationId: string,
    body: string,
    companyClientId?: string,
): Promise<{ ok: true; event: RegistrationEvent } | { ok: false; error: string }> {
    const target = eventsPath(variant, registrationId, companyClientId);
    if ("error" in target) return { ok: false, error: target.error };
    const note = z.string().trim().min(3).max(2000).safeParse(body);
    if (!note.success) {
        return { ok: false, error: "Escreva a anotação (mínimo 3 caracteres)." };
    }
    try {
        const res = await apiFetchAuthed(target.path, {
            method: "POST",
            body: JSON.stringify({ body: note.data }),
        });
        const data = await parseResponseJson(res);
        if (!res.ok) return { ok: false, error: nestErrorMessage(data) };
        const event = parseEvent(data);
        if (!event) return { ok: false, error: "Resposta inválida ao registrar." };
        return { ok: true, event };
    } catch {
        return { ok: false, error: "Sem permissão." };
    }
}
