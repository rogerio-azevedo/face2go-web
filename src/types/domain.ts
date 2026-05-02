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
