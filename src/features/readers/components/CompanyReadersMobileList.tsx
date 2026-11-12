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
    monitorLoading: boolean;
    monitorByReaderId: Record<string, ReaderMonitorDeviceApiRow>;
    onOpenEdit: (reader: ReaderListRow) => void;
};

export function CompanyReadersMobileList({
    readers,
    hasUnfilteredReaders,
    canManage,
    monitorLoading,
    monitorByReaderId,
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
                    monitorLoading={monitorLoading}
                    monitorDevice={monitorByReaderId[reader.id]}
                    onOpenEdit={onOpenEdit}
                />
            ))}
        </div>
    );
}
