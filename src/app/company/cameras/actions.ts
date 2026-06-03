'use server';

import { revalidatePath } from 'next/cache';

import {
    apiFetchAuthed,
    nestErrorMessage,
    parseResponseJson,
} from '@/lib/api-fetch';
import type {
    CamerasMonitorStatusResponse,
    DevicePlatesListResult,
} from '@/types/domain';
import {
    createCameraSchema,
    updateCameraSchema,
} from '@/lib/validations/cameras';
import { ZodError } from 'zod';
import { z } from 'zod';

/** Flight/RSC pode serializar `undefined` como a string `"$undefined"` ao chamar Server Actions. */
const FLIGHT_UNDEFINED_MARKER = '$undefined';

/** Normaliza o payload recebido da Server Action antes do Zod/API. */
function normalizeCameraActionInput(input: unknown): unknown {
    if (input === null || typeof input !== 'object' || Array.isArray(input)) {
        return input;
    }
    const raw = input as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(raw)) {
        if (v === FLIGHT_UNDEFINED_MARKER || v === undefined) continue;
        out[k] = v;
    }
    if (typeof out.username !== 'string') {
        out.username = '';
    }
    if (typeof out.password !== 'string') {
        out.password = '';
    }
    return out;
}

/** Monta o JSON aceito pelo Nest (`z.string().optional()` não aceita `null`). */
function buildNestCreateCameraBody(
    d: z.infer<typeof createCameraSchema>,
): Record<string, unknown> {
    const body: Record<string, unknown> = {
        clientId: d.clientId,
        type: d.type,
        brand: d.brand,
        name: d.name,
        ip: d.ip,
        port: d.port,
        isActive: d.isActive,
    };
    if (d.description) body.description = d.description;
    if (d.serialNumber) body.serialNumber = d.serialNumber;
    if (d.model) body.model = d.model;
    if (d.location) body.location = d.location;
    if (d.deviceId !== undefined && d.deviceId !== null && d.deviceId !== '')
        body.deviceId = d.deviceId;
    if (d.direction) body.direction = d.direction;

    const u = d.username.trim();
    if (u) body.username = u;
    const pw = d.password ?? '';
    if (pw.length > 0) body.password = pw;
    return body;
}

function zodFirstMessage(error: unknown): string {
    if (error instanceof ZodError && error.issues[0]?.message) {
        return error.issues[0].message;
    }
    return 'Dados inválidos.';
}

export async function createCameraAction(
    input: unknown,
): Promise<{ success: true } | { error: string }> {
    try {
        const parsed = createCameraSchema.safeParse(
            normalizeCameraActionInput(input),
        );
        if (!parsed.success) {
            return { error: zodFirstMessage(parsed.error) };
        }

        const d = parsed.data;
        const body = buildNestCreateCameraBody(d);

        const res = await apiFetchAuthed('/api/cameras', {
            method: 'POST',
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }

        revalidatePath('/company/cameras');
        return { success: true };
    } catch {
        return { error: 'Sem permissão.' };
    }
}

export async function updateCameraAction(
    cameraId: string,
    input: unknown,
): Promise<{ success: true } | { error: string }> {
    try {
        const pid = z.string().uuid().safeParse(cameraId);
        if (!pid.success) {
            return { error: 'Câmera inválida.' };
        }

        const parsed = updateCameraSchema.safeParse(
            normalizeCameraActionInput(input),
        );
        if (!parsed.success) {
            return { error: zodFirstMessage(parsed.error) };
        }

        const d = parsed.data;
        if (
            d.clientId === undefined &&
            d.type === undefined &&
            d.brand === undefined &&
            d.name === undefined &&
            d.description === undefined &&
            d.ip === undefined &&
            d.port === undefined &&
            d.serialNumber === undefined &&
            d.model === undefined &&
            d.location === undefined &&
            d.deviceId === undefined &&
            d.direction === undefined &&
            d.isActive === undefined &&
            d.username === undefined &&
            d.password === undefined
        ) {
            return { error: 'Nada para atualizar.' };
        }

        const body: Record<string, unknown> = {};
        if (d.clientId !== undefined) body.clientId = d.clientId;
        if (d.type !== undefined) body.type = d.type;
        if (d.brand !== undefined) body.brand = d.brand;
        if (d.name !== undefined) body.name = d.name;
        if (d.description !== undefined) body.description = d.description;
        if (d.ip !== undefined) body.ip = d.ip;
        if (d.port !== undefined) body.port = d.port;
        if (d.serialNumber !== undefined) body.serialNumber = d.serialNumber;
        if (d.model !== undefined) body.model = d.model;
        if (d.location !== undefined) body.location = d.location;
        if (d.deviceId !== undefined) body.deviceId = d.deviceId;
        if (d.direction !== undefined) body.direction = d.direction;
        if (d.isActive !== undefined) body.isActive = d.isActive;
        if (d.username !== undefined) {
            body.username =
                typeof d.username === 'string' && d.username.trim()
                    ? d.username.trim()
                    : null;
        }
        if (d.password !== undefined && d.password.length > 0) {
            body.password = d.password;
        }

        const res = await apiFetchAuthed(`/api/cameras/${pid.data}`, {
            method: 'PATCH',
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }

        revalidatePath('/company/cameras');
        return { success: true };
    } catch {
        return { error: 'Sem permissão.' };
    }
}

export async function fetchCamerasMonitorStatusAction(
    clientId?: string | null,
): Promise<
    | { ok: true; data: CamerasMonitorStatusResponse }
    | { ok: false; error: string }
> {
    try {
        const q =
            clientId && clientId.length > 0
                ? `?clientId=${encodeURIComponent(clientId)}`
                : '';
        const res = await apiFetchAuthed(`/api/cameras/monitor/status${q}`);
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { ok: false, error: nestErrorMessage(data) };
        }
        const data = (await res.json()) as CamerasMonitorStatusResponse;
        return { ok: true, data };
    } catch {
        return { ok: false, error: 'Sem permissão.' };
    }
}

const toggleActiveSchema = z.object({
    cameraId: z.string().uuid(),
    isActive: z.boolean(),
});

export async function toggleCameraActiveAction(
    input: unknown,
): Promise<{ success: true } | { error: string }> {
    try {
        const parsed = toggleActiveSchema.safeParse(input);
        if (!parsed.success) {
            return { error: zodFirstMessage(parsed.error) };
        }

        const { cameraId, isActive } = parsed.data;

        const res = await apiFetchAuthed(`/api/cameras/${cameraId}/active`, {
            method: 'PATCH',
            body: JSON.stringify({ isActive }),
        });

        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }

        revalidatePath('/company/cameras');
        return { success: true };
    } catch {
        return { error: 'Sem permissão.' };
    }
}

export async function getDevicePlatesAction(
    cameraId: string,
    limit: number,
    offset: number,
    search?: string,
): Promise<
    | { ok: true; data: DevicePlatesListResult }
    | { ok: false; error: string }
> {
    try {
        const cid = z.string().uuid().safeParse(cameraId);
        if (!cid.success) {
            return { ok: false, error: 'Câmera inválida.' };
        }
        const params = new URLSearchParams({
            limit: String(limit),
            offset: String(offset),
        });
        const term = search?.trim();
        if (term) params.set('search', term);
        const res = await apiFetchAuthed(
            `/api/cameras/${cid.data}/device-plates?${params.toString()}`,
        );
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { ok: false, error: nestErrorMessage(data) };
        }
        const data = (await res.json()) as DevicePlatesListResult;
        return { ok: true, data };
    } catch {
        return { ok: false, error: 'Erro de comunicação.' };
    }
}

export async function removeDevicePlateAction(
    cameraId: string,
    recNo: number | null,
    plate: string,
): Promise<{ success: true } | { error: string }> {
    try {
        const cid = z.string().uuid().safeParse(cameraId);
        if (!cid.success) {
            return { error: 'Câmera inválida.' };
        }
        const plateTrim = plate.trim();
        const rec =
            recNo != null && Number.isFinite(recNo) && recNo > 0
                ? String(recNo)
                : '0';
        const params = new URLSearchParams();
        if (!recNo || recNo < 1) {
            if (!plateTrim) {
                return {
                    error: 'RecNo ou placa é obrigatório para remover da câmera.',
                };
            }
            params.set('plate', plateTrim);
        } else if (plateTrim) {
            params.set('plate', plateTrim);
        }
        const qs = params.toString();
        const res = await apiFetchAuthed(
            `/api/cameras/${cid.data}/device-plates/${rec}${qs ? `?${qs}` : ''}`,
            { method: 'DELETE' },
        );
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }
        return { success: true };
    } catch {
        return { error: 'Erro de comunicação.' };
    }
}
