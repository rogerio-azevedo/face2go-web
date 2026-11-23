'use client';

import { Copy, Eye, EyeOff } from 'lucide-react';
import { useId, useState } from 'react';
import { toast } from 'sonner';

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
        if (
            !window.confirm(
                'Definir a chave ISUP deste leitor? Se a chave mudar, grave a nova chave no equipamento para que ele volte a conectar.',
            )
        ) {
            return;
        }
        setBusy(true);
        try {
            const result = await setReaderIsupKeyAction(
                readerId,
                draft || undefined,
            );
            if (!result.ok) {
                toast.error(result.error);
                return;
            }
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
                    <Label htmlFor={`${fieldId}-new`}>Nova chave ISUP</Label>
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
                    <p className="text-muted-foreground text-xs">
                        Informe a chave já gravada no aparelho ou deixe o campo
                        vazio para gerar uma nova.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={busy}
                            onClick={saveKey}
                        >
                            {draft ? 'Salvar chave' : 'Gerar chave'}
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
                <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => setEditing(true)}
                >
                    Definir chave
                </Button>
            )}
        </div>
    );
}
