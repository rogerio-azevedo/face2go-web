"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { setReaderDoorHoldAction } from "@/features/readers/actions/remote-open";

function holdTooltip(
    at: string | null | undefined,
    by: string | null | undefined,
): string | undefined {
    if (!at) return undefined;
    const when = new Date(at);
    const formatted = Number.isNaN(when.getTime())
        ? at
        : when.toLocaleString("pt-BR");
    return by
        ? `Aberta por ${by} desde ${formatted}`
        : `Aberta desde ${formatted}`;
}

export function ReaderHoldOpenSwitch({
    readerId,
    readerName,
    heldOpen,
    heldOpenAt,
    heldOpenByName,
    disabled,
    variant,
}: {
    readerId: string;
    readerName: string;
    heldOpen: boolean;
    heldOpenAt?: string | null;
    heldOpenByName?: string | null;
    disabled?: boolean;
    variant: "company" | "client";
}) {
    const router = useRouter();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pending, startTransition] = useTransition();

    function runHold(hold: boolean) {
        startTransition(async () => {
            const result = await setReaderDoorHoldAction(
                readerId,
                variant,
                hold,
            );
            if (!result.ok) {
                toast.error(result.error);
                return;
            }
            toast.success(
                hold ? "Porta mantida aberta." : "Porta voltou ao modo normal.",
            );
            setConfirmOpen(false);
            router.refresh();
        });
    }

    return (
        <>
            <div
                className="flex items-center gap-1.5"
                title={heldOpen ? holdTooltip(heldOpenAt, heldOpenByName) : undefined}
            >
                <Switch
                    id={`hold-${readerId}`}
                    checked={heldOpen}
                    disabled={disabled || pending}
                    aria-label={`Manter porta aberta no leitor ${readerName}`}
                    onCheckedChange={(next) => {
                        if (next) {
                            setConfirmOpen(true);
                            return;
                        }
                        runHold(false);
                    }}
                />
                <Label
                    htmlFor={`hold-${readerId}`}
                    className={
                        heldOpen
                            ? "text-primary text-xs font-medium"
                            : "text-muted-foreground text-xs"
                    }
                >
                    Manter
                </Label>
            </div>
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Manter {readerName} aberta?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            A porta fica destrancada até você desligar. Use só
                            durante abastecimento.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={pending}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            disabled={pending}
                            onClick={() => runHold(true)}
                        >
                            Manter aberta
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
