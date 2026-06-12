'use server';

import { ZodError, z } from 'zod';

import {
    apiFetchAuthed,
    nestErrorMessage,
    parseResponseJson,
} from '@/lib/api-fetch';
import type { ReaderDirection, ReaderListRow } from '@/types/domain';

function zodFirstMessage(error: unknown): string {
    if (error instanceof ZodError && error.issues[0]?.message) {
        return error.issues[0].message;
    }
    return 'Dados inválidos.';
}

const clientIdSchema = z.string().uuid();

const simulateSchema = z.object({
    clientId: z.string().uuid(),
    personId: z.string().uuid(),
    personType: z.enum(['student', 'responsible', 'member']),
    readerId: z.string().uuid().optional(),
});

export type SimulatablePerson = {
    id: string;
    name: string;
    photoUrl: string | null;
    hasFace: boolean;
};

export type DevSimReaderOption = {
    id: string;
    name: string;
    direction: ReaderDirection | null;
};

export async function listReadersForClientAction(
    clientId: unknown,
): Promise<
    | { success: true; readers: DevSimReaderOption[] }
    | { error: string }
> {
    try {
        const parsed = clientIdSchema.safeParse(clientId);
        if (!parsed.success) {
            return { error: 'Cliente inválido.' };
        }

        const id = encodeURIComponent(parsed.data);
        const res = await apiFetchAuthed(`/api/readers?clientId=${id}`);

        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }

        const rows = (await res.json()) as ReaderListRow[];
        const readers: DevSimReaderOption[] = (rows ?? [])
            .filter((r) => r.isActive)
            .map((r) => ({
                id: r.id,
                name: r.name,
                direction: r.direction ?? null,
            }));

        return { success: true, readers };
    } catch {
        return { error: 'Não foi possível carregar os leitores.' };
    }
}

export async function listSimulatablePeopleAction(
    clientId: unknown,
): Promise<
    | {
          success: true;
          students: SimulatablePerson[];
          responsibles: SimulatablePerson[];
          members: SimulatablePerson[];
      }
    | { error: string }
> {
    try {
        const parsed = clientIdSchema.safeParse(clientId);
        if (!parsed.success) {
            return { error: 'Cliente inválido.' };
        }

        const id = encodeURIComponent(parsed.data);
        const res = await apiFetchAuthed(`/api/simulate/people?clientId=${id}`);

        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }

        const data = (await res.json()) as {
            students: SimulatablePerson[];
            responsibles: SimulatablePerson[];
            members?: SimulatablePerson[];
        };
        return {
            success: true,
            students: data.students ?? [],
            responsibles: data.responsibles ?? [],
            members: data.members ?? [],
        };
    } catch {
        return { error: 'Não foi possível carregar a lista.' };
    }
}

export async function simulateFaceAccessAction(
    input: unknown,
): Promise<{ success: true; accessId: string } | { error: string }> {
    try {
        const parsed = simulateSchema.safeParse(input);
        if (!parsed.success) {
            return { error: zodFirstMessage(parsed.error) };
        }

        const res = await apiFetchAuthed('/api/simulate/face-access', {
            method: 'POST',
            body: JSON.stringify(parsed.data),
        });

        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }

        const data = (await res.json()) as { accessId: string };
        if (typeof data.accessId !== 'string') {
            return { error: 'Resposta inválida da API.' };
        }

        return { success: true, accessId: data.accessId };
    } catch {
        return { error: 'Não foi possível simular o acesso.' };
    }
}
