/** Tipos alinhados às respostas JSON da API Nest (datas como ISO string). */

/** Resposta de `GET /api/dashboard/stats`. */
export type DashboardStats = {
    clients?: number;
    students: number;
    responsibles: number;
    schoolClasses: number;
    vehicles: number;
    facialReaders: number;
    cameras: number;
};

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
    primaryColor: string | null;
    privacyPolicyUrl: string | null;
    privacyAlias: string | null;
    supportEmail: string | null;
    supportPhone: string | null;
    supportWhatsapp: string | null;
    timezoneOffsetMinutes: number;
    ienhFilialCode?: number | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

export type IenhFilialMappingRow = {
    filialCode: number;
    filialName: string;
    clientId: string | null;
    clientName: string | null;
};

export type IenhSnapshotInfo = {
    file: string;
    recordCount: number;
    fetchedAt: string;
    perlet: string;
    perlets?: string[];
};

export type IenhSyncResult = {
    processedRecords: number;
    studentsCreated: number;
    studentsUpdated: number;
    studentsDeactivated: number;
    studentsDeactivatedByStatus?: number;
    studentsDeactivatedByAbsence?: number;
    deactivatedByAbsenceEnrollments?: string[];
    responsiblesCreated: number;
    responsiblesUpdated: number;
    classesCreated: number;
    classesMerged?: number;
    classLinksCreated: number;
    classLinksUpdated: number;
    classLinksDeactivated: number;
    classLinksDeduped?: number;
    accountsCreated: number;
    linksCreated: number;
    errors: { enrollment: string; message: string }[];
    durationMs: number;
};

export type ReaderBrand = 'intelbras' | 'hikvision';

export type ReaderDirection = 'in' | 'out';

export type ReaderListRow = {
    id: string;
    clientId: string;
    clientName: string;
    brand: ReaderBrand;
    direction: ReaderDirection | null;
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

/** Câmera LPR/PTZ (área empresa) — JSON `GET /api/cameras`. */
export type CameraType = 'lpr' | 'ptz' | 'general';

export type CameraDirection = 'in' | 'out';

export type CameraListRow = {
    id: string;
    clientId: string;
    clientName: string;
    type: CameraType;
    direction: CameraDirection | null;
    brand: string;
    name: string;
    description: string | null;
    ip: string;
    port: number;
    serialNumber: string | null;
    model: string | null;
    location: string | null;
    username: string | null;
    hasCredentials: boolean;
    deviceId: string | null;
    deviceToken: string;
    isActive: boolean;
    lastSeenAt: string | null;
    createdAt: string;
};

/** Resposta de `GET /api/cameras/monitor/status` (datas ISO). */
export type CameraMonitorDeviceApiRow = {
    cameraId: string;
    cameraName: string;
    clientName: string;
    type: string;
    brand: string;
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

export type CamerasMonitorStatusResponse = {
    devices: CameraMonitorDeviceApiRow[];
    summary: {
        total: number;
        connected: number;
        disconnected: number;
    };
};

/** Resposta `GET /api/cameras/:cameraId/device-plates` — placas na câmera (TrafficRedList). */
export type DevicePlate = {
    plateNumber: string;
    recNo: number | null;
    /** Nome do proprietário na câmera (TrafficRedList / MasterOfCar). */
    owner: string;
};

export type DevicePlatesListResult = {
    totalCount: number;
    found: number;
    records: DevicePlate[];
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
    snapR2Key: string | null;
    readerDirection: "in" | "out" | null;
};

export type AccessesListResponse = {
    items: AccessRow[];
    page: number;
    pageSize: number;
    total: number;
};

/** Resposta de `GET /api/accesses/:id/photo` — URL temporária (R2). */
export type FacialAccessPhotoUrl = {
    snapUrl: string | null;
};

/** Item de `GET /api/lpr-accesses` (datas ISO). */
export type LprAccessRow = {
    id: string;
    cameraId: string;
    cameraName: string;
    clientId: string;
    clientName: string;
    plateNumber: string;
    plateColor: string | null;
    confidence: number | null;
    vehicleType: string | null;
    vehicleBrand: string | null;
    direction: string | null;
    snapTime: string | null;
    isAllowed: boolean | null;
    isBlocked: boolean | null;
    cutoutPicKey: string | null;
    createdAt: string;
};

export type LprAccessesListResponse = {
    items: LprAccessRow[];
    page: number;
    pageSize: number;
    total: number;
};

/** Resposta de `GET /api/lpr-accesses/:id/photo` — URLs temporárias (R2). */
export type LprAccessPhotoUrls = {
    cutoutUrl: string | null;
    vehicleUrl: string | null;
    normalUrl: string | null;
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
    shiftId: string | null;
    linkedShiftName: string | null;
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
    | "parent"
    | "grandparent"
    | "aunt_uncle"
    | "sibling"
    | "godparent"
    | "guardian"
    | "other";

/** Resposta paginada padrão da API escola (alunos, responsáveis, veículos). */
export type PaginatedResponse<T> = {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
};

export type StudentAccessScheduleJson = {
    shifts?: ClassShift[];
    entryTime?: string;
    exitTime?: string;
    notes?: string;
} | null;

export type StudentClassRow = {
    id: string;
    classId: string;
    className: string;
    shiftId: string | null;
    linkedShiftName: string | null;
    shift: ClassShift | null;
    year: number;
    situacaoMatricula: string | null;
    isActive: boolean;
};

export type StudentRow = {
    id: string;
    clientId: string;
    name: string;
    enrollment: string;
    document: string | null;
    birthDate: string | null;
    photoKey: string | null;
    photoUrl: string | null;
    faceId: number | null;
    deviceSyncStatus: DeviceSyncStatus | null;
    deviceSyncedAt: string | null;
    deviceSyncError: string | null;
    accessSchedule: StudentAccessScheduleJson;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    classes: StudentClassRow[];
};

export type ResponsibleRow = {
    id: string;
    clientId: string;
    userId: string | null;
    name: string;
    email?: string | null;
    phone: string | null;
    document: string | null;
    photoKey: string | null;
    photoUrl: string | null;
    faceId: number | null;
    deviceSyncStatus: DeviceSyncStatus | null;
    deviceSyncedAt: string | null;
    deviceSyncError: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

/** Item de `GET /api/clients/:clientId/roles`. */
export type ClientRoleRow = {
    id: string;
    clientId: string;
    name: string;
    slug: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

/** Item de `GET /api/clients/:clientId/members`. */
export type MemberRow = {
    id: string;
    clientId: string;
    roleId: string;
    roleName: string;
    roleSlug: string;
    userId: string | null;
    name: string;
    email?: string | null;
    phone: string | null;
    document: string | null;
    birthDate: string | null;
    photoKey: string | null;
    photoUrl: string | null;
    faceId: number | null;
    deviceSyncStatus: DeviceSyncStatus | null;
    deviceSyncedAt: string | null;
    deviceSyncError: string | null;
    isActive: boolean;
    canEnrollStudentFace: boolean;
    createdAt: string;
    updatedAt: string;
};

/** Item de `GET /api/clients/:clientId/vehicles` (datas ISO). */
export type VehicleRow = {
    id: string;
    clientId: string;
    responsibleId: string | null;
    memberId: string | null;
    plate: string;
    brand: string;
    model: string;
    color: string;
    driverName: string;
    createdAt: string;
    updatedAt: string;
    lprSyncStatus: DeviceSyncStatus | null;
    lprSyncError: string | null;
};

/** Item de `GET /api/clients/:clientId/vehicles/driver-options`. */
export type VehicleDriverOptionRow = {
    id: string;
    name: string;
    relationshipType: string;
};

/** Item de `GET /api/clients/:clientId/students/:studentId/responsibles`. */
export type StudentResponsibleLinkWithResponsible = {
    link: {
        id: string;
        responsibleId: string;
        studentId: string;
        relationshipType: ResponsibleRelationshipType;
        isAuthorizedPickup: boolean;
        createdAt: string;
    };
    responsible: ResponsibleRow;
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

export type PickupAuthorizationStudent = {
    studentId: string;
    name: string;
};

export type PickupAuthorizationVehicle = {
    plate: string;
    brand: string;
    model: string;
    color: string;
    lprSyncStatus: DeviceSyncStatus | null;
    lprSyncedAt: string | null;
    lprSyncError: string | null;
} | null;

/** Resposta da API de autorizações temporárias (inclui `effectiveStatus`). */
export type PickupAuthorizationRow = {
    id: string;
    clientId: string;
    requestedByResponsibleId: string;
    linkedResponsibleId: string | null;
    linkedResponsibleName: string | null;
    guestName: string;
    guestDocument: string;
    guestPhone: string | null;
    guestLinkCode: string | null;
    guestApprovalStatus:
        | "pending_face"
        | "submitted"
        | "approved"
        | "rejected";
    guestFaceSyncStatus: DeviceSyncStatus | null;
    guestFaceSyncError: string | null;
    status: PickupAuthorizationStatus;
    effectiveStatus: PickupAuthorizationStatus;
    validFrom: string;
    validUntil: string;
    notes: string | null;
    usedAt: string | null;
    createdAt: string;
    updatedAt: string;
    students: PickupAuthorizationStudent[];
    vehicle: PickupAuthorizationVehicle;
    guestRegistrationUrl: string | null;
    authorizedPhotoUrl: string | null;
};

export type InviteStatus = PickupAuthorizationStatus;

export type InviteVehicle = PickupAuthorizationVehicle;

/** Resposta da API de convites de visitantes. */
export type InviteRow = {
    id: string;
    clientId: string;
    requestedByMemberId: string;
    requestedByMemberName: string | null;
    guestName: string | null;
    guestDocument: string | null;
    guestPhone: string | null;
    guestLinkCode: string | null;
    guestApprovalStatus:
        | "pending_face"
        | "submitted"
        | "approved"
        | "rejected";
    guestFaceSyncStatus: DeviceSyncStatus | null;
    guestFaceSyncError: string | null;
    status: InviteStatus;
    effectiveStatus: InviteStatus;
    validFrom: string;
    validUntil: string;
    notes: string | null;
    usedAt: string | null;
    createdAt: string;
    updatedAt: string;
    vehicle: InviteVehicle;
    guestRegistrationUrl: string | null;
    authorizedPhotoUrl: string | null;
};
