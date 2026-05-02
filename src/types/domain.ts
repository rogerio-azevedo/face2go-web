/** Tipos alinhados às respostas JSON da API Nest (datas como ISO string). */

export type CompanyRow = {
    id: string;
    name: string;
    slug: string | null;
    cnpj: string | null;
    phone: string | null;
    email: string | null;
    logoUrl: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

export type ClientListRow = {
    id: string;
    companyId: string;
    name: string;
    slug: string | null;
    type: string;
    cnpj: string | null;
    phone: string | null;
    email: string | null;
    logoUrl: string | null;
    /** Minutos em relação ao UTC (ex.: −180 = UTC−3). Aceita também horas inteiras curtas na API quando |valor|≤14. */
    timezoneOffsetMinutes: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

export type ReaderBrand = 'intelbras' | 'hikvision';

export type ReaderListRow = {
    id: string;
    clientId: string;
    clientName: string;
    brand: ReaderBrand;
    name: string;
    description: string | null;
    ip: string;
    port: number;
    serialNumber: string | null;
    model: string | null;
    location: string | null;
    username: string | null;
    hasCredentials: boolean;
    isActive: boolean;
    lastSeenAt: string | null;
    createdAt: string;
};

/** Resposta de `GET /api/readers/monitor/status` (datas ISO). */
export type ReaderMonitorDeviceApiRow = {
    readerId: string;
    readerName: string;
    clientName: string;
    brand: ReaderBrand;
    host: string;
    isActive: boolean;
    hasCredentials: boolean;
    streamSupported: boolean;
    connected: boolean;
    eventsReceived: number;
    lastEventAt: string | null;
    connectedSince: string | null;
    lastConnectionError: string | null;
    lastSeenAt: string | null;
};

export type ReadersMonitorStatusResponse = {
    devices: ReaderMonitorDeviceApiRow[];
    summary: {
        total: number;
        connected: number;
        disconnected: number;
    };
};

export type CompanyUserListRow = {
    companyUserId: string;
    userId: string;
    email: string;
    name: string | null;
    role: 'company_admin' | 'company_operator';
    jobTitle: string | null;
    phone: string | null;
    isActive: boolean;
    createdAt: string;
};

/** Item de `GET /api/client/registration-links` (datas ISO). */
export type RegistrationLinkListRow = {
    id: string;
    code: string;
    isActive: boolean;
    validFrom: string | null;
    expiresAt: string | null;
    createdAt: string;
    registrationUrl: string;
};

/** Estado de sincronização com os leitores faciais Intelbras cadastrados. */
export type DeviceSyncStatus = "pending_sync" | "synced" | "sync_failed";

/** Item de `GET /api/client/registrations` (datas ISO). */
export type ClientRegistrationListRow = {
    id: string;
    clientId: string;
    registrationLinkId: string;
    name: string | null;
    document: string | null;
    phone: string | null;
    email: string | null;
    additionalData: Record<string, unknown> | null;
    status: "draft" | "approved" | "rejected";
    submittedAt: string | null;
    approvedAt: string | null;
    rejectionNotes: string | null;
    createdAt: string;
    hasFacePhoto: boolean;
    faceId: number | null;
    deviceSyncStatus: DeviceSyncStatus | null;
    deviceSyncedAt: string | null;
    deviceSyncError: string | null;
};

/** Item de `GET /api/accesses` (datas ISO). */
export type AccessRow = {
    id: string;
    companyId: string;
    readerId: string;
    readerName: string;
    clientId: string;
    clientName: string;
    userId: number;
    personName: string | null;
    eventCode: string;
    eventAction: string;
    similarity: number | null;
    eventDate: string | null;
    createdAt: string;
};

export type AccessesListResponse = {
    items: AccessRow[];
    page: number;
    pageSize: number;
    total: number;
};
