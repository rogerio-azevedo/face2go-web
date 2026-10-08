"use client";

import { CompanyReaderMobileCard } from "@/features/readers/components/CompanyReaderMobileCard";
import type {
    ReaderListRow,
    ReaderMonitorDeviceApiRow,
} from "@/types/domain";

type CompanyReadersMobileListProps = {
    readers: ReaderListRow[];
    hasUnfilteredReaders: boolean;
    canManage: boolean;
    pending: boolean;
    monitorLoading: boolean;
    monitorByReaderId: Record<string, ReaderMonitorDeviceApiRow>;
    onToggleActive: (readerId: string, isActive: boolean) => void;
    onOpenEdit: (reader: ReaderListRow) => void;
};

export function CompanyReadersMobileList({
    readers,
    hasUnfilteredReaders,
    canManage,
    pending,
    monitorLoading,
    monitorByReaderId,
    onToggleActive,
    onOpenEdit,
}: CompanyReadersMobileListProps) {
    if (readers.length === 0) {
        return (
            <div className="text-muted-foreground rounded-md border py-10 text-center text-sm md:hidden">
                {hasUnfilteredReaders
                    ? "Nenhum leitor para o filtro selecionado."
                    : "Nenhum leitor cadastrado."}
            </div>
        );
    }

    return (
        <div className="space-y-3 md:hidden">
            {readers.map((reader) => (
                <CompanyReaderMobileCard
                    key={reader.id}
                    reader={reader}
                    canManage={canManage}
                    pending={pending}
                    monitorLoading={monitorLoading}
                    monitorDevice={monitorByReaderId[reader.id]}
                    onToggleActive={onToggleActive}
                    onOpenEdit={onOpenEdit}
                />
            ))}
        </div>
    );
}
