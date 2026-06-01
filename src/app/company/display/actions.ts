'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import {
    apiFetchAuthed,
    nestErrorMessage,
    parseResponseJson,
} from '@/lib/api-fetch';

const displayDeviceItemSchema = z.object({
    deviceType: z.enum(['lpr_camera', 'facial_reader']),
    deviceId: z.string().uuid(),
});

const displayDevicesResponseSchema = z.object({
    hasConfiguredDevices: z.boolean(),
    lprCameras: z.array(
        z.object({
            id: z.string().uuid(),
            name: z.string(),
            direction: z.enum(['in', 'out']).nullable(),
            isActive: z.boolean(),
            isEnabled: z.boolean(),
        }),
    ),
    facialReaders: z.array(
        z.object({
            id: z.string().uuid(),
            name: z.string(),
            direction: z.enum(['in', 'out']).nullable(),
            isActive: z.boolean(),
            isEnabled: z.boolean(),
        }),
    ),
});

export type DisplayDeviceListItem = {
    id: string;
    name: string;
    direction: 'in' | 'out' | null;
    isActive: boolean;
    isEnabled: boolean;
};

export type DisplayDevicesConfig = {
    hasConfiguredDevices: boolean;
    lprCameras: DisplayDeviceListItem[];
    facialReaders: DisplayDeviceListItem[];
};

export async function getDisplayDevicesAction(
    clientId: string,
): Promise<DisplayDevicesConfig | { error: string }> {
    try {
        const pid = z.string().uuid().safeParse(clientId);
        if (!pid.success) {
            return { error: 'Cliente inválido.' };
        }

        const res = await apiFetchAuthed(
            `/api/clients/${pid.data}/display-devices`,
        );

        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }

        const json = await parseResponseJson(res);
        const parsed = displayDevicesResponseSchema.safeParse(json);
        if (!parsed.success) {
            return { error: 'Resposta inválida da API.' };
        }

        return parsed.data;
    } catch {
        return { error: 'Sem permissão.' };
    }
}

export async function saveDisplayDevicesAction(
    clientId: string,
    devices: Array<{ deviceType: 'lpr_camera' | 'facial_reader'; deviceId: string }>,
): Promise<DisplayDevicesConfig | { error: string }> {
    try {
        const pid = z.string().uuid().safeParse(clientId);
        if (!pid.success) {
            return { error: 'Cliente inválido.' };
        }

        const devicesParsed = z.array(displayDeviceItemSchema).safeParse(devices);
        if (!devicesParsed.success) {
            return { error: 'Dispositivos inválidos.' };
        }

        const res = await apiFetchAuthed(
            `/api/clients/${pid.data}/display-devices`,
            {
                method: 'PUT',
                body: JSON.stringify({ devices: devicesParsed.data }),
            },
        );

        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }

        const json = await parseResponseJson(res);
        const parsed = displayDevicesResponseSchema.safeParse(json);
        if (!parsed.success) {
            return { error: 'Resposta inválida da API.' };
        }

        revalidatePath('/company/display');
        revalidatePath('/company/clientes');
        return parsed.data;
    } catch {
        return { error: 'Sem permissão.' };
    }
}
