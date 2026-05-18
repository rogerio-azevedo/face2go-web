/** Alinha com SSE do Nest (`clients/:clientId/arrivals/stream`). */
export type ArrivalSseArrivalPayload = {
    type: 'arrival';
    kind: 'responsible' | 'student';
    accessId: string;
    personName: string | null;
    personPhotoUrl: string | null;
    readerName: string;
    eventDate: string | null;
    students: { name: string; photoUrl: string | null }[];
};

export type ArrivalSseConnectedPayload = {
    type: 'connected';
    clientId: string;
};

export type ArrivalSseHeartbeatPayload = {
    type: 'ping';
    at: string;
};

export type ArrivalSseEnvelope =
    | ArrivalSseArrivalPayload
    | ArrivalSseConnectedPayload
    | ArrivalSseHeartbeatPayload;
