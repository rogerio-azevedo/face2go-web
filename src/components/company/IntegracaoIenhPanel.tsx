"use client";

import { Loader2, RefreshCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import {
    fetchIenhSnapshotsAction,
    getIenhSyncFromSnapshotSseUrlAction,
    getIenhSyncSseUrlAction,
    setIenhFilialMappingAction,
} from "@/app/company/integracao/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type {
    ClientListRow,
    IenhFilialMappingRow,
    IenhSnapshotInfo,
    IenhSyncResult,
} from "@/types/domain";

const selectClassName =
    "border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50";

type IenhSseEvt =
    | {
          type: "start";
          perlet: string;
          perlets?: string[];
          totalFiliais: number;
          fromSnapshot?: boolean;
          file?: string;
      }
    | { type: "filial_start"; filial: number; filialName: string }
    | { type: "perlet_start"; filial: number; perlet: string }
    | {
          type: "perlet_fetched";
          filial: number;
          perlet: string;
          count: number;
      }
    | {
          type: "filial_fetched";
          filial: number;
          count: number;
          mergedCount?: number;
      }
    | {
          type: "snapshot_saved";
          file: string;
          recordCount: number;
      }
    | { type: "process_start"; total: number }
    | {
          type: "progress";
          filial: number;
          processed: number;
          total: number;
          studentsCreated: number;
          studentsUpdated: number;
      }
    | { type: "deactivate_start" }
    | {
          type: "deactivate_progress";
          processed: number;
          total: number;
      }
    | { type: "heartbeat" }
    | { type: "done"; result: IenhSyncResult }
    | { type: "error"; message: string };

export function IntegracaoIenhPanel({
    initialClients,
    initialMappings,
}: {
    initialClients: ClientListRow[];
    initialMappings: IenhFilialMappingRow[];
}) {
    const currentYear = new Date().getFullYear();
    const [mappings, setMappings] = useState(initialMappings);
    const [perlet, setPerlet] = useState(String(currentYear));
    const [syncResult, setSyncResult] = useState<IenhSyncResult | null>(null);
    const [pendingFilial, setPendingFilial] = useState<number | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncLines, setSyncLines] = useState<string[]>([]);
    const [snapshots, setSnapshots] = useState<IenhSnapshotInfo[]>([]);
    const [snapshotsLoading, setSnapshotsLoading] = useState(true);
    const [isSavingMapping, startSaveMapping] = useTransition();
    const esRef = useRef<EventSource | null>(null);
    const logEndRef = useRef<HTMLDivElement | null>(null);

    const schoolClients = useMemo(
        () =>
            initialClients.filter(
                (c) => c.isActive && (c.type === "school" || c.type === "other"),
            ),
        [initialClients],
    );

    const mappingsComplete = mappings.every((m) => m.clientId != null);

    const cleanupEs = useCallback(() => {
        esRef.current?.close();
        esRef.current = null;
    }, []);

    const appendLine = useCallback((line: string) => {
        setSyncLines((prev) => [...prev, line]);
    }, []);

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [syncLines]);

    useEffect(() => {
        return () => cleanupEs();
    }, [cleanupEs]);

    const loadSnapshots = useCallback(async () => {
        setSnapshotsLoading(true);
        const res = await fetchIenhSnapshotsAction();
        setSnapshotsLoading(false);
        if ("error" in res) {
            setSnapshots([]);
            return;
        }
        setSnapshots(res.snapshots);
    }, []);

    useEffect(() => {
        void loadSnapshots();
    }, [loadSnapshots]);

    const runSyncWithUrl = useCallback(
        async (url: string, label: string) => {
            setSyncResult(null);
            setSyncLines([]);
            setIsSyncing(true);
            cleanupEs();

            appendLine(label);

            const es = new EventSource(url);
            esRef.current = es;

            es.onmessage = (ev) => {
                try {
                    const d = JSON.parse(ev.data) as IenhSseEvt;
                    switch (d.type) {
                        case "start":
                            if (d.fromSnapshot && d.file) {
                                appendLine(
                                    `Re-sincronizando do snapshot ${d.file} (PERLET=${d.perlet}).`,
                                );
                            } else {
                                const perletList =
                                    d.perlets && d.perlets.length > 1
                                        ? d.perlets.join(", ")
                                        : d.perlet;
                                appendLine(
                                    `Iniciando sincronização (PERLET=${perletList}, ${d.totalFiliais} filial(is)).`,
                                );
                            }
                            break;
                        case "filial_start":
                            appendLine(
                                `Buscando TOTVS: ${d.filialName} (filial ${d.filial})…`,
                            );
                            break;
                        case "perlet_start":
                            appendLine(
                                `  PERLET ${d.perlet} (filial ${d.filial})…`,
                            );
                            break;
                        case "perlet_fetched":
                            appendLine(
                                `    → ${d.count} registro(s) em PERLET ${d.perlet}.`,
                            );
                            break;
                        case "filial_fetched":
                            appendLine(
                                d.mergedCount != null
                                    ? `  → ${d.count} registro(s) recebidos; ${d.mergedCount} único(s) após merge (filial ${d.filial}).`
                                    : `  → ${d.count} registro(s) recebidos da filial ${d.filial}.`,
                            );
                            break;
                        case "snapshot_saved":
                            appendLine(
                                `Snapshot salvo: ${d.file} (${d.recordCount} registros).`,
                            );
                            void loadSnapshots();
                            break;
                        case "process_start":
                            appendLine(
                                `Processando ${d.total} registro(s) no Face2Go…`,
                            );
                            break;
                        case "progress":
                            appendLine(
                                `  ${d.processed}/${d.total} — alunos +${d.studentsCreated} criados, ${d.studentsUpdated} atualizados`,
                            );
                            break;
                        case "deactivate_start":
                            appendLine("Desativando alunos ausentes no ERP…");
                            break;
                        case "deactivate_progress":
                            appendLine(
                                `  Limpeza ${d.processed}/${d.total} aluno(s)…`,
                            );
                            break;
                        case "heartbeat":
                            break;
                        case "done": {
                            setSyncResult(d.result);
                            appendLine(
                                `Concluído em ${(d.result.durationMs / 1000).toFixed(1)}s.`,
                            );
                            setIsSyncing(false);
                            cleanupEs();
                            es.close();
                            toast.success("Sincronização IENH finalizada.");
                            break;
                        }
                        case "error":
                            appendLine(`Erro: ${d.message}`);
                            setIsSyncing(false);
                            cleanupEs();
                            es.close();
                            toast.error(d.message);
                            break;
                        default:
                            break;
                    }
                } catch {
                    appendLine(`(parse) ${ev.data}`);
                }
            };

            es.onerror = () => {
                appendLine("Conexão SSE encerrada inesperadamente.");
                setIsSyncing(false);
                cleanupEs();
                toast.error(
                    "Conexão com o servidor interrompida. Verifique os logs acima.",
                );
            };
        },
        [appendLine, cleanupEs, loadSnapshots],
    );

    function handleMappingChange(filialCode: number, clientId: string) {
        const value = clientId === "" ? null : clientId;
        setPendingFilial(filialCode);
        startSaveMapping(async () => {
            const res = await setIenhFilialMappingAction(filialCode, value);
            setPendingFilial(null);
            if ("error" in res) {
                toast.error(res.error);
                return;
            }
            setMappings(res.mappings);
            toast.success("Mapeamento atualizado.");
        });
    }

    const handleSync = useCallback(async () => {
        const urlResult = await getIenhSyncSseUrlAction(perlet);
        if ("error" in urlResult) {
            toast.error(urlResult.error);
            return;
        }
        await runSyncWithUrl(
            urlResult.url,
            "Conectando ao servidor (busca TOTVS + processamento)…",
        );
    }, [perlet, runSyncWithUrl]);

    const handleResyncFromSnapshot = useCallback(
        async (file: string) => {
            const urlResult = await getIenhSyncFromSnapshotSseUrlAction(file);
            if ("error" in urlResult) {
                toast.error(urlResult.error);
                return;
            }
            await runSyncWithUrl(
                urlResult.url,
                `Re-sincronizando a partir de ${file} (sem TOTVS)…`,
            );
        },
        [runSyncWithUrl],
    );

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Mapeamento de filiais</CardTitle>
                    <CardDescription>
                        Associe cada filial do TOTVS IENH ao cliente (unidade)
                        correspondente no Face2Go.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-16">Cód.</TableHead>
                                <TableHead>Filial IENH</TableHead>
                                <TableHead>Cliente Face2Go</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mappings.map((row) => (
                                <TableRow key={row.filialCode}>
                                    <TableCell>{row.filialCode}</TableCell>
                                    <TableCell>{row.filialName}</TableCell>
                                    <TableCell>
                                        <select
                                            className={selectClassName}
                                            value={row.clientId ?? ""}
                                            disabled={
                                                isSavingMapping &&
                                                pendingFilial === row.filialCode
                                            }
                                            onChange={(e) =>
                                                handleMappingChange(
                                                    row.filialCode,
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            <option value="">
                                                — Selecione —
                                            </option>
                                            {schoolClients.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name}
                                                </option>
                                            ))}
                                        </select>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {!mappingsComplete ? (
                        <p className="text-muted-foreground mt-4 text-sm">
                            Configure as três filiais antes de sincronizar.
                        </p>
                    ) : null}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Sincronização cadastral</CardTitle>
                    <CardDescription>
                        Busca os dados na API TOTVS, salva um snapshot em disco e
                        processa turmas, alunos e responsáveis em paralelo. Use
                        re-sincronizar para repetir o processamento sem nova
                        chamada ao ERP.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="max-w-xs space-y-2">
                        <Label htmlFor="perlet">Período letivo (PERLET)</Label>
                        <Input
                            id="perlet"
                            value={perlet}
                            onChange={(e) => setPerlet(e.target.value)}
                            placeholder={String(currentYear)}
                            disabled={isSyncing}
                        />
                        <p className="text-muted-foreground text-xs">
                            Ex.: informe 2026 para buscar educação básica e,
                            automaticamente, 2026/1 e 2026/2 (técnico e
                            graduação). Use 2026/1 apenas se quiser sincronizar
                            um semestre específico.
                        </p>
                    </div>
                    <Button
                        type="button"
                        disabled={!mappingsComplete || isSyncing}
                        onClick={() => void handleSync()}
                    >
                        {isSyncing ? (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                        ) : (
                            <RefreshCcw className="mr-2 size-4" />
                        )}
                        {isSyncing ? "Sincronizando…" : "Sincronizar agora"}
                    </Button>

                    <div className="space-y-2">
                        <p className="text-sm font-medium">Snapshots salvos</p>
                        {snapshotsLoading ? (
                            <p className="text-muted-foreground text-xs">
                                Carregando snapshots…
                            </p>
                        ) : snapshots.length === 0 ? (
                            <p className="text-muted-foreground text-xs">
                                Nenhum snapshot ainda. Execute uma sincronização
                                completa para gerar um arquivo.
                            </p>
                        ) : (
                            <ul className="divide-y rounded-md border text-sm">
                                {snapshots.map((s) => (
                                    <li
                                        key={s.file}
                                        className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate font-mono text-xs">
                                                {s.file}
                                            </p>
                                            <p className="text-muted-foreground text-xs">
                                                PERLET{" "}
                                                {s.perlets && s.perlets.length > 1
                                                    ? s.perlets.join(", ")
                                                    : s.perlet}{" "}
                                                · {s.recordCount} registros ·{" "}
                                                {new Date(
                                                    s.fetchedAt,
                                                ).toLocaleString("pt-BR")}
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={
                                                !mappingsComplete || isSyncing
                                            }
                                            onClick={() =>
                                                void handleResyncFromSnapshot(
                                                    s.file,
                                                )
                                            }
                                        >
                                            Re-sincronizar
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {(isSyncing || syncLines.length > 0) && (
                        <div className="bg-muted max-h-64 overflow-y-auto rounded-md border p-3 font-mono text-xs whitespace-pre-wrap">
                            {syncLines.length === 0 ? (
                                <span className="text-muted-foreground">
                                    Aguardando eventos…
                                </span>
                            ) : (
                                syncLines.map((line, i) => (
                                    // eslint-disable-next-line react/no-array-index-key -- log lines
                                    <div key={i}>{line}</div>
                                ))
                            )}
                            <div ref={logEndRef} />
                        </div>
                    )}
                </CardContent>
            </Card>

            {syncResult ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Resultado da sincronização</CardTitle>
                        <CardDescription>
                            Processados {syncResult.processedRecords} registros em{" "}
                            {(syncResult.durationMs / 1000).toFixed(1)}s
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">
                                Alunos criados: {syncResult.studentsCreated}
                            </Badge>
                            <Badge variant="secondary">
                                Alunos atualizados: {syncResult.studentsUpdated}
                            </Badge>
                            <Badge variant="secondary">
                                Alunos desativados:{" "}
                                {syncResult.studentsDeactivated}
                            </Badge>
                            {(syncResult.studentsDeactivatedByStatus ?? 0) >
                            0 ? (
                                <Badge variant="secondary">
                                    Desativados (status Bloqueado):{" "}
                                    {syncResult.studentsDeactivatedByStatus}
                                </Badge>
                            ) : null}
                            {(syncResult.studentsDeactivatedByAbsence ?? 0) >
                            0 ? (
                                <Badge variant="secondary">
                                    Desativados (ausentes no ERP):{" "}
                                    {syncResult.studentsDeactivatedByAbsence}
                                </Badge>
                            ) : null}
                            <Badge variant="secondary">
                                Responsáveis criados:{" "}
                                {syncResult.responsiblesCreated}
                            </Badge>
                            <Badge variant="secondary">
                                Responsáveis atualizados:{" "}
                                {syncResult.responsiblesUpdated}
                            </Badge>
                            <Badge variant="secondary">
                                Turmas criadas: {syncResult.classesCreated}
                            </Badge>
                            {(syncResult.classesMerged ?? 0) > 0 ? (
                                <Badge variant="secondary">
                                    Turmas duplicadas fundidas:{" "}
                                    {syncResult.classesMerged}
                                </Badge>
                            ) : null}
                            <Badge variant="secondary">
                                Vínculos turma criados:{" "}
                                {syncResult.classLinksCreated ?? 0}
                            </Badge>
                            <Badge variant="secondary">
                                Vínculos turma atualizados:{" "}
                                {syncResult.classLinksUpdated ?? 0}
                            </Badge>
                            <Badge variant="secondary">
                                Vínculos turma desativados:{" "}
                                {syncResult.classLinksDeactivated ?? 0}
                            </Badge>
                            {(syncResult.classLinksDeduped ?? 0) > 0 ? (
                                <Badge variant="secondary">
                                    Vínculos turma deduplicados:{" "}
                                    {syncResult.classLinksDeduped}
                                </Badge>
                            ) : null}
                            <Badge variant="secondary">
                                Contas de login criadas:{" "}
                                {syncResult.accountsCreated ?? 0}
                            </Badge>
                            <Badge variant="secondary">
                                Vínculos responsável: {syncResult.linksCreated}
                            </Badge>
                        </div>
                        {syncResult.errors.length > 0 ? (
                            <div className="space-y-2">
                                <p className="text-destructive text-sm font-medium">
                                    Erros ({syncResult.errors.length})
                                </p>
                                <ul className="text-muted-foreground max-h-48 overflow-y-auto text-xs">
                                    {syncResult.errors.slice(0, 50).map((e) => (
                                        <li key={`${e.enrollment}-${e.message}`}>
                                            {e.enrollment}: {e.message}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}
                        {(syncResult.deactivatedByAbsenceEnrollments?.length ??
                            0) > 0 ? (
                            <div className="space-y-2">
                                <p className="text-sm font-medium">
                                    Matrículas desativadas por ausência no ERP (
                                    {syncResult.deactivatedByAbsenceEnrollments
                                        ?.length ?? 0}
                                    )
                                </p>
                                <p className="text-muted-foreground font-mono text-xs break-all">
                                    {syncResult.deactivatedByAbsenceEnrollments
                                        ?.slice(0, 50)
                                        .join(", ")}
                                    {(syncResult.deactivatedByAbsenceEnrollments
                                        ?.length ?? 0) > 50
                                        ? " …"
                                        : ""}
                                </p>
                            </div>
                        ) : null}
                    </CardContent>
                </Card>
            ) : null}
        </div>
    );
}
