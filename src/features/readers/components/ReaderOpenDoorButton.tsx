"use client";

import { DoorOpen } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import {
    openClientReaderDoorAction,
    openReaderDoorAction,
} from "@/features/readers/actions/remote-open";

const LOCAL_COOLDOWN_MS = 3_000;

export function ReaderOpenDoorButton({
    readerId,
    readerName,
    disabled,
    variant,
}: {
    readerId: string;
    readerName: string;
    disabled?: boolean;
    variant: "company" | "client";
}) {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [coolingDown, setCoolingDown] = useState(false);
    const [pending, startTransition] = useTransition();

    function confirmOpenDoor() {
        startTransition(async () => {
            const result =
                variant === "client"
                    ? await openClientReaderDoorAction(readerId)
                    : await openReaderDoorAction(readerId);
            if (!result.ok) {
                toast.error(result.error);
                return;
            }
            toast.success("Porta acionada.");
            setConfirmOpen(false);
            setCoolingDown(true);
            window.setTimeout(() => setCoolingDown(false), LOCAL_COOLDOWN_MS);
        });
    }

    return (
        <>
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={disabled || pending || coolingDown}
                onClick={() => setConfirmOpen(true)}
            >
                <DoorOpen className="size-3.5" />
                Abrir
            </Button>
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Abrir {readerName}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            O relé do leitor será acionado agora. Confirme
                            apenas se a passagem estiver livre.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={pending}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            disabled={pending}
                            onClick={confirmOpenDoor}
                        >
                            Abrir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
