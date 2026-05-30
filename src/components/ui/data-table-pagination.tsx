"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { pageRangeLabel, totalPages } from "@/lib/pagination";

type DataTablePaginationProps = {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    disabled?: boolean;
};

export function DataTablePagination({
    page,
    pageSize,
    total,
    onPageChange,
    disabled,
}: DataTablePaginationProps) {
    const pages = totalPages(total, pageSize);
    const canPrev = page > 1;
    const canNext = page < pages;

    if (total === 0) return null;

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground text-sm">
                {pageRangeLabel(page, pageSize, total)}
            </p>
            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled || !canPrev}
                    onClick={() => onPageChange(page - 1)}
                >
                    <ChevronLeft className="size-4" />
                    Anterior
                </Button>
                <span className="text-muted-foreground min-w-[5rem] text-center text-sm tabular-nums">
                    {page} / {pages}
                </span>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled || !canNext}
                    onClick={() => onPageChange(page + 1)}
                >
                    Próxima
                    <ChevronRight className="size-4" />
                </Button>
            </div>
        </div>
    );
}
