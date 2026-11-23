'use client';

import { Copy, Eye, EyeOff } from 'lucide-react';
import { useId, useState } from 'react';
import { toast } from 'sonner';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    revealReaderIsupKeyAction,
    setReaderIsupKeyAction,
} from '@/features/readers/actions/isup-key';

export function ReaderIsupKeyField({ readerId }: { readerId: string }) {
    const fieldId = useId();
    const [key, setKey] = useState<string | null>(null);
    const [visible, setVisible] = useState(false);
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState('');
    const [busy, setBusy] = useState(false);
    const [confirmation, setConfirmation] = useState<
        'generate' | 'manual' | null
    >(null);
    const [saveError, setSaveError] = useState<string | null>(null);

    function confirmKey(mode: 'generate' | 'manual') {
        setSaveError(null);
        setConfirmation(mode);
    }

    async function toggleVisibility() {
        if (visible) {
            setKey(null);
            setVisible(false);
            return;
        }
        setBusy(true);
        try {
            const result = await revealReaderIsupKeyAction(readerId);
            if (!result.ok) {
                toast.error(result.error);
                return;
            }
            setKey(result.data.key);
            setVisible(true);
        } catch {
            toast.error(
                'Não foi possível consultar a chave ISUP. Tente novamente.',
            );
        } finally {
            setBusy(false);
        }
    }

    async function copyKey() {
        if (key === null) return;
        try {
            await navigator.clipboard.writeText(key);
            toast.success('Chave ISUP copiada.');
        } catch {
            toast.error('Não foi possível copiar a chave ISUP.');
        }
    }

    async function saveKey() {
        if (!confirmation || busy) return;
        setBusy(true);
        setSaveError(null);
        try {
            const result = await setReaderIsupKeyAction(
                readerId,
                confirmation === 'manual' ? draft : undefined,
            );
            if (!result.ok) {
                setSaveError(result.error);
                return;
            }
            setConfirmation(null);
            setDraft('');
            setEditing(false);
            setKey(result.data.key);
            setVisible(true);
            if (result.data.reconnectRequested === false) {
                toast.warning(
                    'Chave salva. O gateway não confirmou o encerramento da sessão. Reconecte o leitor após gravar a chave.',
                );
            } else {
                toast.success('Chave ISUP salva.');
            }
        } catch {
            setSaveError(
                'Não foi possível confirmar o salvamento. Consulte a chave atual antes de tentar de novo.',
            );
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="min-w-0 space-y-2">
            <Label
                htmlFor={fieldId}
                className="text-muted-foreground text-xs font-semibold uppercase tracking-wider"
            >
                Chave ISUP
            </Label>
            <div className="flex items-center gap-2">
                <Input
                    id={fieldId}
                    readOnly
                    type={visible ? 'text' : 'password'}
                    value={key ?? ''}
                    placeholder={
                        visible
                            ? 'Sem chave individual cadastrada'
                            : 'Revele a chave para consultar'
                    }
                    className="bg-card h-10 min-w-0 font-mono shadow-sm"
                    autoComplete="off"
                />
                <Button
                    type="button"
                    variant="outline"
                    size="icon-lg"
                    aria-label={
                        visible ? 'Ocultar chave ISUP' : 'Revelar chave ISUP'
                    }
                    disabled={busy}
                    onClick={toggleVisibility}
                >
                    {visible ? <EyeOff /> : <Eye />}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="icon-lg"
                    aria-label="Copiar chave ISUP"
                    disabled={!visible || key === null || busy}
                    onClick={copyKey}
                >
                    <Copy />
                </Button>
            </div>
            {editing ? (
                <div className="space-y-2">
                    <Label htmlFor={`${fieldId}-new`}>
                        Chave gravada no aparelho
                    </Label>
                    <Input
                        id={`${fieldId}-new`}
                        type="password"
                        autoComplete="new-password"
                        maxLength={32}
                        spellCheck={false}
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') event.preventDefault();
                        }}
                        disabled={busy}
                        className="bg-card h-10"
                    />
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={busy || !draft}
                            onClick={() => confirmKey('manual')}
                        >
                            Salvar chave
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            disabled={busy}
                            onClick={() => {
                                setEditing(false);
                                setDraft('');
                            }}
                        >
                            Cancelar
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={busy}
                        onClick={() => confirmKey('generate')}
                    >
                        Gerar chave ISUP
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={busy}
                        onClick={() => setEditing(true)}
                    >
                        Informar chave existente
                    </Button>
                </div>
            )}
            <AlertDialog
                open={confirmation !== null}
                onOpenChange={(open) => {
                    if (!open && !busy) setConfirmation(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirmation === 'generate'
                                ? 'Gerar e salvar uma nova chave ISUP?'
                                : 'Salvar a chave ISUP informada?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmation === 'generate'
                                ? 'O leitor só vai voltar a se conectar depois que você gravar a nova chave no aparelho.'
                                : 'Confira se esta é a chave gravada no aparelho para que o leitor continue se conectando.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {saveError ? (
                        <p role="alert" className="text-destructive text-sm">
                            {saveError}
                        </p>
                    ) : null}
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={busy}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            type="button"
                            disabled={busy}
                            onClick={saveKey}
                        >
                            {busy
                                ? 'Salvando…'
                                : confirmation === 'generate'
                                  ? 'Gerar e salvar'
                                  : 'Salvar chave'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
