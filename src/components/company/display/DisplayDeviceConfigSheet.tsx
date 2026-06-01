'use client';

import { Camera, ScanFace, Settings2 } from 'lucide-react';
import { useEffect, useMemo, useState, useTransition, type ReactNode } from 'react';
import { toast } from 'sonner';

import {
    getDisplayDevicesAction,
    saveDisplayDevicesAction,
    type DisplayDeviceListItem,
} from '@/app/company/display/actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { READER_DIRECTION_LABELS } from '@/lib/validations/readers';

type ClientMini = { id: string; name: string };

function directionLabel(direction: 'in' | 'out' | null): string {
    if (direction === 'in' || direction === 'out') {
        return READER_DIRECTION_LABELS[direction];
    }
    return '—';
}

function DeviceCheckboxList(props: {
    title: string;
    icon: ReactNode;
    items: DisplayDeviceListItem[];
    selectedIds: Set<string>;
    disabled: boolean;
    onToggle: (id: string, checked: boolean) => void;
    emptyMessage: string;
}) {
    const { title, icon, items, selectedIds, disabled, onToggle, emptyMessage } =
        props;

    return (
        <section className="space-y-3">
            <div className="flex items-center gap-2">
                {icon}
                <h3 className="text-sm font-semibold">{title}</h3>
                <Badge variant="secondary" className="font-normal">
                    {items.length}
                </Badge>
            </div>

            {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">{emptyMessage}</p>
            ) : (
                <ul className="space-y-2 rounded-md border p-3">
                    {items.map((item) => {
                        const inputId = `${title}-${item.id}`;
                        return (
                            <li
                                key={item.id}
                                className="flex items-start gap-3 rounded-md px-1 py-1"
                            >
                                <Checkbox
                                    id={inputId}
                                    checked={selectedIds.has(item.id)}
                                    onCheckedChange={(checked) =>
                                        onToggle(item.id, checked === true)
                                    }
                                    disabled={disabled}
                                />
                                <Label
                                    htmlFor={inputId}
                                    className="flex flex-1 cursor-pointer flex-col gap-1 font-normal"
                                >
                                    <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                                        {item.name}
                                        {item.isActive ? (
                                            <Badge>Ativo</Badge>
                                        ) : (
                                            <Badge variant="secondary">
                                                Inativo
                                            </Badge>
                                        )}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        Direção: {directionLabel(item.direction)}
                                    </span>
                                </Label>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}

export function DisplayDeviceConfigSheet(props: {
    client: ClientMini | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { client, open, onOpenChange } = props;
    const [loading, startLoadTransition] = useTransition();
    const [saving, startSaveTransition] = useTransition();
    const [hasConfiguredDevices, setHasConfiguredDevices] = useState(false);
    const [lprCameras, setLprCameras] = useState<DisplayDeviceListItem[]>([]);
    const [facialReaders, setFacialReaders] = useState<DisplayDeviceListItem[]>(
        [],
    );
    const [selectedLprIds, setSelectedLprIds] = useState<Set<string>>(
        () => new Set(),
    );
    const [selectedReaderIds, setSelectedReaderIds] = useState<Set<string>>(
        () => new Set(),
    );

    useEffect(() => {
        if (!open || !client) {
            setHasConfiguredDevices(false);
            setLprCameras([]);
            setFacialReaders([]);
            setSelectedLprIds(new Set());
            setSelectedReaderIds(new Set());
            return;
        }

        startLoadTransition(async () => {
            const result = await getDisplayDevicesAction(client.id);
            if ('error' in result) {
                toast.error(result.error);
                setHasConfiguredDevices(false);
                setLprCameras([]);
                setFacialReaders([]);
                setSelectedLprIds(new Set());
                setSelectedReaderIds(new Set());
                return;
            }

            setHasConfiguredDevices(result.hasConfiguredDevices);
            setLprCameras(result.lprCameras);
            setFacialReaders(result.facialReaders);

            if (result.hasConfiguredDevices) {
                setSelectedLprIds(
                    new Set(
                        result.lprCameras
                            .filter((d) => d.isEnabled)
                            .map((d) => d.id),
                    ),
                );
                setSelectedReaderIds(
                    new Set(
                        result.facialReaders
                            .filter((d) => d.isEnabled)
                            .map((d) => d.id),
                    ),
                );
            } else {
                setSelectedLprIds(new Set());
                setSelectedReaderIds(new Set());
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps -- recarrega ao abrir o sheet / mudar cliente
    }, [open, client?.id]);

    const busy = loading || saving;
    const totalSelected = selectedLprIds.size + selectedReaderIds.size;

    const summary = useMemo(() => {
        if (!hasConfiguredDevices && totalSelected === 0) {
            return 'Sem seleção salva: todos os equipamentos geram eventos no display.';
        }
        if (totalSelected === 0) {
            return 'Nenhum equipamento selecionado. Salve para voltar ao modo “todos os equipamentos”.';
        }
        return `${totalSelected} equipamento(s) selecionado(s) para o display.`;
    }, [hasConfiguredDevices, totalSelected]);

    const save = () => {
        if (!client?.id) return;

        const devices = [
            ...Array.from(selectedLprIds).map((deviceId) => ({
                deviceType: 'lpr_camera' as const,
                deviceId,
            })),
            ...Array.from(selectedReaderIds).map((deviceId) => ({
                deviceType: 'facial_reader' as const,
                deviceId,
            })),
        ];

        startSaveTransition(async () => {
            const result = await saveDisplayDevicesAction(client.id, devices);
            if ('error' in result) {
                toast.error(result.error);
                return;
            }

            setHasConfiguredDevices(result.hasConfiguredDevices);
            setLprCameras(result.lprCameras);
            setFacialReaders(result.facialReaders);
            toast.success('Configuração do display salva.');
        });
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="flex h-full w-full max-w-[min(100vw,42rem)] flex-col gap-5 overflow-y-auto px-6 pb-8 pt-6 sm:max-w-2xl sm:px-8 sm:pb-10"
            >
                <SheetHeader className="space-y-2 p-0">
                    <SheetTitle className="flex items-center gap-2 text-lg">
                        <Settings2 className="size-5 shrink-0" aria-hidden />
                        Dispositivos do Display
                    </SheetTitle>
                    <SheetDescription>
                        Escolha quais câmeras LPR e leitores faciais disparam
                        chegadas na TV desta unidade.
                    </SheetDescription>
                </SheetHeader>

                {client ? (
                    <p className="-mt-1 text-sm font-medium text-foreground/90">
                        {client.name}
                    </p>
                ) : null}

                <p className="rounded-md border border-dashed bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                    {summary}
                </p>

                {loading ? (
                    <p className="text-sm text-muted-foreground">Carregando…</p>
                ) : (
                    <div className="space-y-6">
                        <DeviceCheckboxList
                            title="Câmeras LPR"
                            icon={
                                <Camera
                                    className="size-4 text-muted-foreground"
                                    aria-hidden
                                />
                            }
                            items={lprCameras}
                            selectedIds={selectedLprIds}
                            disabled={busy}
                            onToggle={(id, checked) => {
                                setSelectedLprIds((prev) => {
                                    const next = new Set(prev);
                                    if (checked) next.add(id);
                                    else next.delete(id);
                                    return next;
                                });
                            }}
                            emptyMessage="Nenhuma câmera LPR cadastrada neste cliente."
                        />

                        <DeviceCheckboxList
                            title="Leitores faciais"
                            icon={
                                <ScanFace
                                    className="size-4 text-muted-foreground"
                                    aria-hidden
                                />
                            }
                            items={facialReaders}
                            selectedIds={selectedReaderIds}
                            disabled={busy}
                            onToggle={(id, checked) => {
                                setSelectedReaderIds((prev) => {
                                    const next = new Set(prev);
                                    if (checked) next.add(id);
                                    else next.delete(id);
                                    return next;
                                });
                            }}
                            emptyMessage="Nenhum leitor facial cadastrado neste cliente."
                        />
                    </div>
                )}

                <div className="mt-auto flex flex-col gap-2 sm:flex-row">
                    <Button
                        type="button"
                        disabled={busy || !client}
                        onClick={save}
                    >
                        Salvar configuração
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={busy}
                        onClick={() => onOpenChange(false)}
                    >
                        Fechar
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
