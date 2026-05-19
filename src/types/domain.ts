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

/** Turno de turma (enum `class_shift` no Postgres). */
export type ClassShift =
    | "morning"
    | "afternoon"
    | "evening"
    | "fulltime";

export type SchoolClassRow = {
    id: string;
    clientId: string;
    name: string;
    /** FK para cadastro em Turnos; quando definido, a lista usa `linkedShiftName`. */
    shiftId: string | null;
    linkedShiftName: string | null;
    /** Enum legado (turmas antigas ou sem vínculo). */
    shift: ClassShift | null;
    year: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

/** Dias da semana em `shifts.schedule` (JSON no Postgres). */
export type ShiftWeekday =
    | "sunday"
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday";

export type ShiftTimeWindow = {
    start: string;
    end: string;
};

/** Até 4 janelas por dia (limite Intelbras). */
export type ShiftSchedule = Partial<
    Record<ShiftWeekday, ShiftTimeWindow[]>
>;

export type ShiftRow = {
    id: string;
    clientId: string;
    name: string;
    schedule: ShiftSchedule;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

export type ResponsibleRelationshipType =
    | "father"
    | "mother"
    | "grandfather"
    | "grandmother"
    | "guardian"
    | "other";

export type StudentAccessScheduleJson = {
    shifts?: ClassShift[];
    entryTime?: string;
    exitTime?: string;
    notes?: string;
} | null;

export type StudentRow = {
    id: string;
    clientId: string;
    classId: string | null;
    name: string;
    enrollment: string;
    document: string | null;
    birthDate: string | null;
    photoKey: string | null;
    faceId: number | null;
    deviceSyncStatus: DeviceSyncStatus | null;
    deviceSyncedAt: string | null;
    deviceSyncError: string | null;
    accessSchedule: StudentAccessScheduleJson;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

export type ResponsibleRow = {
    id: string;
    clientId: string;
    userId: string | null;
    name: string;
    phone: string | null;
    document: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

/** Item de `GET /api/clients/:clientId/vehicles` (datas ISO). */
export type VehicleRow = {
    id: string;
    clientId: string;
    responsibleId: string;
    plate: string;
    brand: string;
    model: string;
    color: string;
    driverName: string;
    createdAt: string;
    updatedAt: string;
};

/** Item de `GET /api/clients/:clientId/vehicles/driver-options`. */
export type VehicleDriverOptionRow = {
    id: string;
    name: string;
    /** Valor enum do vínculo (ex.: father) quando houver primeiro vínculo. */
    relationshipType: string;
};

/** Item de `GET /api/clients/:clientId/responsibles/:responsibleId/students`. */
export type ResponsibleStudentLinkWithStudent = {
    link: {
        id: string;
        responsibleId: string;
        studentId: string;
        relationshipType: ResponsibleRelationshipType;
        isAuthorizedPickup: boolean;
        createdAt: string;
    };
    student: StudentRow;
};

export type PickupAuthorizationStatus =
    | "active"
    | "used"
    | "expired"
    | "cancelled";

/** Resposta da API de autorizações temporárias (inclui `effectiveStatus`). */
export type PickupAuthorizationRow = {
    id: string;
    clientId: string;
    studentId: string;
    requestedByResponsibleId: string;
    authorizedResponsibleId: string | null;
    guestName: string | null;
    guestDocument: string | null;
    guestPhone: string | null;
    status: PickupAuthorizationStatus;
    effectiveStatus: PickupAuthorizationStatus;
    validFrom: string;
    validUntil: string;
    notes: string | null;
    usedAt: string | null;
    createdAt: string;
    updatedAt: string;
};
