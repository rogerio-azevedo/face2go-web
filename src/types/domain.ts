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
    isActive: boolean;
    lastSeenAt: string | null;
    createdAt: string;
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
