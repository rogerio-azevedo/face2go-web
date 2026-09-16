"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { zodFirstMessage } from "@/lib/actions/zod-utils";
import {
    apiFetchAuthed,
    nestErrorMessage,
    parseResponseJson,
} from "@/lib/api-fetch";
import {
    updateRegistrationFieldsConfigSchema,
    type RegistrationConfigResponse,
    type UpdateRegistrationFieldsConfig,
} from "@/features/registrations/validations/registration-config";

function asConfigResponse(
    value: unknown,
): RegistrationConfigResponse | null {
    if (!value || typeof value !== "object") return null;
    const v = value as RegistrationConfigResponse;
    if (!v.fields || typeof v.clientType !== "string") return null;
    return v;
}

export async function getCompanyRegistrationConfigAction(
    clientId: string,
): Promise<
    | { ok: true; result: RegistrationConfigResponse }
    | { ok: false; error: string }
> {
    const cid = z.string().uuid().safeParse(clientId);
    if (!cid.success) return { ok: false, error: "Cliente inválido." };
    try {
        const res = await apiFetchAuthed(
            `/api/clients/${cid.data}/registration-config`,
        );
        const data = await parseResponseJson(res);
        if (!res.ok) return { ok: false, error: nestErrorMessage(data) };
        const result = asConfigResponse(data);
        if (!result) {
            return { ok: false, error: "Resposta inválida da configuração." };
        }
        return { ok: true, result };
    } catch {
        return { ok: false, error: "Sem permissão." };
    }
}

export async function updateCompanyRegistrationConfigAction(
    clientId: string,
    input: unknown,
): Promise<
    | { ok: true; result: RegistrationConfigResponse }
    | { ok: false; error: string }
> {
    const cid = z.string().uuid().safeParse(clientId);
    if (!cid.success) return { ok: false, error: "Cliente inválido." };
    const parsed = updateRegistrationFieldsConfigSchema.safeParse(input);
    if (!parsed.success) {
        return { ok: false, error: zodFirstMessage(parsed.error) };
    }
    const body: UpdateRegistrationFieldsConfig = parsed.data;
    try {
        const res = await apiFetchAuthed(
            `/api/clients/${cid.data}/registration-config`,
            { method: "PUT", body: JSON.stringify(body) },
        );
        const data = await parseResponseJson(res);
        if (!res.ok) return { ok: false, error: nestErrorMessage(data) };
        const result = asConfigResponse(data);
        if (!result) {
            return { ok: false, error: "Resposta inválida da configuração." };
        }
        revalidatePath(`/company/clientes/${cid.data}/usuarios`);
        return { ok: true, result };
    } catch {
        return { ok: false, error: "Sem permissão." };
    }
}
