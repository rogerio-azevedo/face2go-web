/** Layout do display `/display` — horizontal (TV deitada) ou vertical (TV em pé). */
export type ArrivalLayout = 'horizontal' | 'vertical';

/** Alinha com SSE do Nest (`clients/:clientId/arrivals/stream`). */
export type ArrivalSseArrivalPayload = {
    type: 'arrival';
    kind: 'responsible' | 'student';
    accessId: string;
    responsibleId: string | null;
    personName: string | null;
    personPhotoUrl: string | null;
    readerName: string;
    eventDate: string | null;
    vehiclePlate: string | null;
    students: {
        name: string;
        photoUrl: string | null;
        className: string | null;
    }[];
};

export type ArrivalSseDequeuePayload = {
    type: 'dequeue';
    responsibleId: string;
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
    | ArrivalSseDequeuePayload
    | ArrivalSseConnectedPayload
    | ArrivalSseHeartbeatPayload;
