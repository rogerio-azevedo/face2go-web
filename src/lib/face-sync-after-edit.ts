export type FaceSyncSaveHint = {
    requiresFaceSync: boolean;
    id: string;
    name: string;
};

export type FaceEnrolledPerson = {
    id: string;
    name: string;
    photoKey: string | null;
    faceId: number | null;
};

export function personHasFaceEnrolled(
    row: Pick<FaceEnrolledPerson, "photoKey" | "faceId">,
): boolean {
    return row.faceId != null && row.photoKey != null && row.photoKey.length > 0;
}

export function buildFaceSyncSaveHint(
    person: FaceEnrolledPerson,
    requiresFaceSync: boolean,
): FaceSyncSaveHint | undefined {
    if (!requiresFaceSync || !personHasFaceEnrolled(person)) return undefined;
    return {
        requiresFaceSync: true,
        id: person.id,
        name: person.name,
    };
}

export function studentCadastralEditRequiresFaceSync(
    before: {
        name: string;
        isActive: boolean;
        accessSchedule?: unknown;
    },
    after: {
        name?: string;
        isActive?: boolean;
        accessSchedule?: unknown;
    },
): boolean {
    if (after.name !== undefined && after.name.trim() !== before.name.trim()) {
        return true;
    }
    if (after.isActive !== undefined && after.isActive !== before.isActive) {
        return true;
    }
    if (
        after.accessSchedule !== undefined &&
        JSON.stringify(after.accessSchedule ?? null) !==
            JSON.stringify(before.accessSchedule ?? null)
    ) {
        return true;
    }
    return false;
}

export function responsibleCadastralEditRequiresFaceSync(
    before: { name: string; isActive: boolean },
    after: { name?: string; isActive?: boolean },
): boolean {
    if (after.name !== undefined && after.name.trim() !== before.name.trim()) {
        return true;
    }
    if (after.isActive !== undefined && after.isActive !== before.isActive) {
        return true;
    }
    return false;
}
