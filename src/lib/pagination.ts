import type { PaginatedResponse } from "@/types/domain";

export const DEFAULT_SCHOOL_PAGE_SIZE = 20;

export type SchoolListParams = {
    page?: number;
    pageSize?: number;
    search?: string;
    classId?: string;
};

export function buildSchoolListQuery(params: SchoolListParams = {}): string {
    const sp = new URLSearchParams();
    sp.set("page", String(params.page ?? 1));
    sp.set("pageSize", String(params.pageSize ?? DEFAULT_SCHOOL_PAGE_SIZE));
    const search = params.search?.trim();
    if (search) sp.set("search", search);
    if (params.classId) sp.set("classId", params.classId);
    return sp.toString();
}

export function emptyPaginated<T>(): PaginatedResponse<T> {
    return {
        data: [],
        total: 0,
        page: 1,
        pageSize: DEFAULT_SCHOOL_PAGE_SIZE,
    };
}

export function totalPages(total: number, pageSize: number): number {
    return Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
}

export function pageRangeLabel(
    page: number,
    pageSize: number,
    total: number,
): string {
    if (total === 0) return "Nenhum registro";
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);
    return `Exibindo ${start}–${end} de ${total}`;
}

function isPaginatedResponse<T>(value: unknown): value is PaginatedResponse<T> {
    if (!value || typeof value !== "object") return false;
    const v = value as PaginatedResponse<T>;
    return Array.isArray(v.data) && typeof v.total === "number";
}

/** Aceita resposta paginada ou array legado (retrocompat). */
export function normalizePaginated<T>(
    value: unknown,
    fallbackPageSize = DEFAULT_SCHOOL_PAGE_SIZE,
): PaginatedResponse<T> {
    if (isPaginatedResponse<T>(value)) return value;
    if (Array.isArray(value)) {
        return {
            data: value as T[],
            total: value.length,
            page: 1,
            pageSize: fallbackPageSize,
        };
    }
    return emptyPaginated<T>();
}
