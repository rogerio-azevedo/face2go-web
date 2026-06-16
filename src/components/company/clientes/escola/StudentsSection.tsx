"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { listStudentsAction } from "@/app/company/clientes/[clientId]/usuarios/escola-actions";
import { deferInEffect } from "@/lib/defer-in-effect";
import { useFaceSyncOffer } from "@/lib/use-face-sync-offer";
import type { PaginatedResponse, SchoolClassRow, StudentRow } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { FaceCirclePhoto } from "@/components/ui/face-circle-photo";
import { Label } from "@/components/ui/label";
import { SearchInput } from "@/components/ui/search-input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { schoolClassTurnLabel } from "@/lib/validations/school";

import { StudentEditSheet } from "./StudentEditSheet";
import { StudentForm } from "./StudentForm";
import { DeviceSyncStatusBadge } from "./DeviceSyncStatusBadge";
import { FaceGlobalSyncModal } from "./FaceGlobalSyncModal";
import { FaceSyncOfferModal } from "./FaceSyncOfferModal";
import { FaceSyncResultModal } from "./FaceSyncResultModal";

function classesLabel(
    classes: SchoolClassRow[],
    studentClasses: StudentRow["classes"],
): string {
    const active = (studentClasses ?? []).filter((c) => c.isActive);
    if (active.length === 0) return "—";

    return active
        .map((link) => {
            const meta = classes.find((c) => c.id === link.classId);
            const turn = meta ? schoolClassTurnLabel(meta) : link.linkedShiftName ?? "—";
            return `${link.className} (${turn}, ${link.year})`;
        })
        .join(" · ");
}

export function StudentsSection({
    clientId,
    isAdmin = false,
    classes,
    initialStudents,
}: {
    clientId: string;
    isAdmin?: boolean;
    classes: SchoolClassRow[];
    initialStudents: PaginatedResponse<StudentRow>;
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [list, setList] = useState(initialStudents);
    const [search, setSearch] = useState("");
    const [filterClassId, setFilterClassId] = useState("");
    const [page, setPage] = useState(initialStudents.page);
    const [loading, setLoading] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editRow, setEditRow] = useState<StudentRow | null>(null);
    const [syncingId, setSyncingId] = useState<string | null>(null);

    const faceSyncOffer = useFaceSyncOffer({
        clientId,
        kind: "student",
        onAfterSync: () => refresh(),
    });

    const fetchList = useCallback(
        async (nextPage: number, nextSearch: string, classId: string) => {
            setLoading(true);
            try {
                const r = await listStudentsAction(clientId, {
                    page: nextPage,
                    pageSize: list.pageSize,
                    search: nextSearch || undefined,
                    classId: classId || undefined,
                });
                if ("error" in r) {
                    toast.error(r.error);
                    return;
                }
                setList(r.result);
            } finally {
                setLoading(false);
            }
        },
        [clientId, list.pageSize],
    );

    useEffect(() => {
        deferInEffect(() => {
            setList(initialStudents);
            setPage(initialStudents.page);
        });
    }, [initialStudents]);

    useEffect(() => {
        deferInEffect(() => {
            void fetchList(page, search, filterClassId);
        });
    }, [page, search, filterClassId, fetchList]);

    function refresh() {
        startTransition(() => router.refresh());
        void fetchList(page, search, filterClassId);
    }

    function onSearchChange(value: string) {
        setSearch(value);
        setPage(1);
    }

    function onClassFilterChange(classId: string) {
        setFilterClassId(classId);
        setPage(1);
    }

    async function handleSync(row: StudentRow) {
        setSyncingId(row.id);
        try {
            await faceSyncOffer.runSync(row.id, row.name);
        } finally {
            setSyncingId(null);
        }
    }

    function handleSyncModalClose() {
        faceSyncOffer.closeSyncResult();
    }

    const rows = list.data.map((s) => ({
        ...s,
        classes: s.classes ?? [],
    }));

    const tableBusy = loading || isPending;

    return (
        <>
            <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                <div className="flex w-full flex-col gap-2 sm:w-auto">
                    <Label htmlFor="filter-class" className="text-muted-foreground">
                        Filtrar por turma
                    </Label>
                    <select
                        id="filter-class"
                        className="border-input bg-background ring-offset-background focus-visible:ring-ring h-10 w-full min-w-[200px] rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none sm:w-72"
                        value={filterClassId}
                        disabled={tableBusy}
                        onChange={(e) => onClassFilterChange(e.target.value)}
                    >
                        <option value="">Todas</option>
                        {classes.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name} — {schoolClassTurnLabel(c)} / {c.year}
                            </option>
                        ))}
                    </select>
                </div>
                <SearchInput
                    id="search-students"
                    value={search}
                    onValueChange={onSearchChange}
                    placeholder="Buscar por nome ou matrícula…"
                    disabled={tableBusy}
                    className="sm:flex-1"
                />
                <Button
                    type="button"
                    size="default"
                    onClick={() => setCreateOpen(true)}
                >
                    Novo aluno
                </Button>
                <FaceGlobalSyncModal
                    clientId={clientId}
                    kind="students"
                    disabled={tableBusy}
                />
            </div>

            <div className="relative rounded-md border">
                {tableBusy ? (
                    <div
                        className="bg-background/60 absolute inset-0 z-10 flex items-center justify-center rounded-md"
                        aria-hidden
                    >
                        <Loader2 className="text-muted-foreground size-6 animate-spin" />
                    </div>
                ) : null}
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[52px]" aria-label="Foto" />
                            <TableHead>Nome</TableHead>
                            <TableHead>Matrícula</TableHead>
                            <TableHead>Turmas</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Leitor</TableHead>
                            <TableHead className="text-right">
                                Ações
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    className="text-muted-foreground py-10 text-center"
                                >
                                    {search || filterClassId
                                        ? "Nenhum aluno encontrado."
                                        : "Nenhum aluno cadastrado."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell className="align-middle">
                                        <div className="size-8 shrink-0 overflow-hidden rounded-full bg-teal-100 ring-2 ring-teal-100">
                                            <FaceCirclePhoto
                                                className="size-full"
                                                photoUrl={row.photoUrl ?? null}
                                                nameHint={row.name}
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {row.name}
                                    </TableCell>
                                    <TableCell>{row.enrollment}</TableCell>
                                    <TableCell className="max-w-[280px] text-sm">
                                        {classesLabel(classes, row.classes)}
                                    </TableCell>
                                    <TableCell>
                                        {row.isActive ? (
                                            <Badge>Ativo</Badge>
                                        ) : (
                                            <Badge variant="secondary">
                                                Inativo
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <DeviceSyncStatusBadge
                                            status={row.deviceSyncStatus}
                                            hasFace={row.faceId != null}
                                            error={row.deviceSyncError}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={
                                                    row.faceId == null ||
                                                    syncingId === row.id ||
                                                    tableBusy
                                                }
                                                title={
                                                    row.faceId == null
                                                        ? "Cadastre uma foto antes de sincronizar"
                                                        : "Sincronizar face com os leitores"
                                                }
                                                onClick={() => void handleSync(row)}
                                            >
                                                {syncingId === row.id ? (
                                                    <Loader2 className="size-4 animate-spin" />
                                                ) : (
                                                    <RefreshCw className="size-4" />
                                                )}
                                                <span className="sr-only sm:not-sr-only sm:ml-1.5">
                                                    Sincronizar
                                                </span>
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setEditRow(row);
                                                    setEditOpen(true);
                                                }}
                                            >
                                                Editar
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <DataTablePagination
                page={list.page}
                pageSize={list.pageSize}
                total={list.total}
                disabled={tableBusy}
                onPageChange={setPage}
            />

            <StudentForm
                open={createOpen}
                onOpenChange={setCreateOpen}
                clientId={clientId}
                mode="create"
                student={null}
                onSuccess={() => {
                    toast.success("Aluno cadastrado.");
                    refresh();
                }}
            />

            <StudentEditSheet
                open={editOpen}
                onOpenChange={(open) => {
                    setEditOpen(open);
                    if (!open) setEditRow(null);
                }}
                clientId={clientId}
                isAdmin={isAdmin}
                student={editRow}
                onSuccess={(hint) => {
                    toast.success("Aluno atualizado.");
                    refresh();
                    faceSyncOffer.promptFromSave(hint);
                }}
                onDeleted={() => {
                    toast.success("Aluno excluído.");
                    refresh();
                }}
                onLinksChanged={() => refresh()}
                onFaceSyncOffer={faceSyncOffer.promptFromLinkChange}
            />

            <FaceSyncOfferModal
                open={faceSyncOffer.offerTarget != null}
                personName={faceSyncOffer.offerTarget?.name ?? ""}
                onConfirm={() => void faceSyncOffer.confirmOffer()}
                onDismiss={faceSyncOffer.dismissOffer}
            />

            <FaceSyncResultModal
                state={faceSyncOffer.syncModalState}
                onClose={handleSyncModalClose}
            />
        </>
    );
}
