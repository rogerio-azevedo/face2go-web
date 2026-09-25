"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useId } from "react";

import { Button } from "@/components/ui/button";
import { PAGE_SIZE_OPTIONS, pageRangeLabel, totalPages } from "@/lib/pagination";

type DataTablePaginationProps = {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
    pageSizeOptions?: readonly number[];
    disabled?: boolean;
};

export function DataTablePagination({
    page,
    pageSize,
    total,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = PAGE_SIZE_OPTIONS,
    disabled,
}: DataTablePaginationProps) {
    const pageSizeId = useId();
    const pages = totalPages(total, pageSize);
    const canPrev = page > 1;
    const canNext = page < pages;
    const sizeOptions = pageSizeOptions.includes(pageSize)
        ? pageSizeOptions
        : [...pageSizeOptions, pageSize].sort((a, b) => a - b);

    if (total === 0) return null;

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground text-sm">
                {pageRangeLabel(page, pageSize, total)}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {onPageSizeChange ? (
                    <div className="flex items-center gap-2">
                        <label
                            htmlFor={pageSizeId}
                            className="text-sm font-medium whitespace-nowrap"
                        >
                            Linhas por página
                        </label>
                        <select
                            id={pageSizeId}
                            className="border-input bg-background h-8 rounded-md border px-2 text-sm"
                            value={pageSize}
                            disabled={disabled}
                            onChange={(event) =>
                                onPageSizeChange(Number(event.target.value))
                            }
                        >
                            {sizeOptions.map((size) => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                    </div>
                ) : null}
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
        </div>
    );
}
