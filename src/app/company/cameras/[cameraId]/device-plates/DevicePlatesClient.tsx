"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { getDevicePlatesAction } from "@/app/company/cameras/actions";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { DevicePlate, DevicePlatesListResult } from "@/types/domain";

const LIMIT = 50;

function totalForPagination(result: DevicePlatesListResult, offset: number): number {
    if (result.totalCount > 0) return result.totalCount;
    return Math.max(result.found, offset + result.records.length);
}

export default function DevicePlatesClient({ cameraId }: { cameraId: string }) {
    const router = useRouter();
    const [records, setRecords] = useState<DevicePlate[]>([]);
    const [totalFound, setTotalFound] = useState(0);
    const [offset, setOffset] = useState(0);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    const fetchPlates = useCallback(
        async (currentOffset: number, searchTerm: string) => {
            setIsLoading(true);
            const res = await getDevicePlatesAction(
                cameraId,
                LIMIT,
                currentOffset,
                searchTerm.trim() || undefined,
            );
            if (res.ok) {
                setRecords(res.data.records);
                setTotalFound(totalForPagination(res.data, currentOffset));
            } else {
                toast.error(res.error || "Erro ao carregar placas.");
                setRecords([]);
                setTotalFound(0);
            }
            setIsLoading(false);
        },
        [cameraId],
    );

    const handleSearchChange = useCallback((value: string) => {
        setSearch(value);
        setOffset(0);
    }, []);

    useEffect(() => {
        void fetchPlates(offset, search);
    }, [offset, search, fetchPlates]);

    const handleNext = () => {
        if (offset + LIMIT < totalFound) {
            setOffset((prev) => prev + LIMIT);
        }
    };

    const handlePrev = () => {
        if (offset - LIMIT >= 0) {
            setOffset((prev) => prev - LIMIT);
        }
    };

    const rangeEndLabel =
        totalFound <= 0
            ? "0"
            : String(Math.min(offset + LIMIT, totalFound));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <PageHeader
                    title="Placas na Câmera"
                    description="Listagem cadastrada na lista de permissão da câmera LPR (TrafficRedList / allowlist)."
                />
                <Button variant="outline" onClick={() => router.back()}>
                    Voltar
                </Button>
            </div>

            <div className="rounded-md border bg-card text-card-foreground">
                <div className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <SearchInput
                        value={search}
                        onValueChange={handleSearchChange}
                        placeholder="Buscar por placa..."
                        disabled={isLoading}
                        className="sm:max-w-xs"
                    />
                    {search.trim() ? (
                        <p className="text-sm text-muted-foreground">
                            Filtrando por &quot;{search.trim()}&quot;
                        </p>
                    ) : null}
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>Placa</TableHead>
                            <TableHead>Proprietário</TableHead>
                            <TableHead className="text-right">RecNo</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell
                                    colSpan={4}
                                    className="py-10 text-center text-muted-foreground"
                                >
                                    Consultando câmera...
                                </TableCell>
                            </TableRow>
                        ) : records.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={4}
                                    className="py-10 text-center text-muted-foreground"
                                >
                                    Nenhuma placa retornada nesta página ou lista vazia.
                                </TableCell>
                            </TableRow>
                        ) : (
                            records.map((row, i) => (
                                <TableRow key={`${row.recNo ?? "x"}-${row.plateNumber}-${i}`}>
                                    <TableCell className="text-muted-foreground tabular-nums">
                                        {offset + i + 1}
                                    </TableCell>
                                    <TableCell className="font-mono font-medium">
                                        {row.plateNumber.trim() !== ""
                                            ? row.plateNumber
                                            : "—"}
                                    </TableCell>
                                    <TableCell>
                                        {(row.owner ?? "").trim() !== ""
                                            ? row.owner
                                            : "—"}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {row.recNo ?? "—"}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                <div className="flex items-center justify-between border-t px-4 py-3">
                    <div className="text-sm text-muted-foreground">
                        {totalFound > 0 ? (
                            <span>
                                Mostrando {offset + 1} a {rangeEndLabel} de{" "}
                                {totalFound}
                            </span>
                        ) : (
                            <span>Total: 0</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrev}
                            disabled={offset === 0 || isLoading}
                        >
                            <ChevronLeft className="mr-1 size-4" />
                            Anterior
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNext}
                            disabled={offset + LIMIT >= totalFound || isLoading}
                        >
                            Próxima
                            <ChevronRight className="ml-1 size-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
