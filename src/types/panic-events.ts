export type PanicEventStatus = "open" | "claimed" | "closed";

export type PanicEventItem = {
    id: string;
    companyId: string;
    clientId: string;
    clientName: string;
    eventType: string;
    status: PanicEventStatus;
    requesterUserId: string;
    requesterMemberId: string | null;
    requesterName: string;
    requesterRole: string;
    location: {
        latitude: number;
        longitude: number;
        accuracy: number | null;
        capturedAt: string;
        source: string;
    };
    receivedAt: string;
    claimedAt: string | null;
    releasedAt: string | null;
    closedAt: string | null;
    claimedBy: {
        userId: string;
        name: string;
        role: string;
    } | null;
    closedBy: {
        userId: string;
        name: string;
        role: string;
    } | null;
    closingNotes: string | null;
    closingReason: string | null;
};

export type PanicUpdatedSocketPayload = {
    event: PanicEventItem;
    action: "claim" | "release" | "close";
};

export type PanicPresencePayload = {
    companyId: string;
    onlineCount: number;
};
