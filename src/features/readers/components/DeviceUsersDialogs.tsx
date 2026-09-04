"use client";

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
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";

export function DeviceUsersConfirmDialogs({
    selectedCount,
    confirmSelectedOpen,
    onConfirmSelectedOpenChange,
    onConfirmSelected,
    confirmWipeOpen,
    onConfirmWipeOpenChange,
    onConfirmWipe,
    confirmForceOpen,
    onConfirmForceOpenChange,
    onConfirmForce,
    pending,
}: {
    selectedCount: number;
    confirmSelectedOpen: boolean;
    onConfirmSelectedOpenChange: (open: boolean) => void;
    onConfirmSelected: () => void;
    confirmWipeOpen: boolean;
    onConfirmWipeOpenChange: (open: boolean) => void;
    onConfirmWipe: () => void;
    confirmForceOpen: boolean;
    onConfirmForceOpenChange: (open: boolean) => void;
    onConfirmForce: () => void;
    pending: boolean;
}) {
    return (
        <>
            <AlertDialog
                open={confirmSelectedOpen}
                onOpenChange={onConfirmSelectedOpenChange}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remover selecionados do leitor?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {selectedCount} usuário(s) serão apagados só da memória do
                            equipamento. Cadastros do Face2Go não são excluídos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction disabled={pending} onClick={onConfirmSelected}>
                            Remover
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
                open={confirmWipeOpen}
                onOpenChange={onConfirmWipeOpenChange}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Apagar todos os usuários neste leitor?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação esvazia a memória deste equipamento: apaga faces do
                            sistema antigo e do Face2Go. Os cadastros no Face2Go permanecem.
                            Depois use &quot;Sincronizar neste leitor&quot; para reenviar só
                            quem tem foto aprovada.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            disabled={pending}
                            onClick={onConfirmWipe}
                        >
                            Apagar todos neste leitor
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
                open={confirmForceOpen}
                onOpenChange={onConfirmForceOpenChange}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Forçar sync neste leitor?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Reenvia todas as faces para este equipamento, mesmo quem já
                            estava synced. O trabalho segue em segundo plano — você pode
                            sair desta tela. Outros syncs deste cliente ficam bloqueados
                            até terminar.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction disabled={pending} onClick={onConfirmForce}>
                            Forçar neste leitor
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

export function DeviceUserFaceSheet({
    open,
    onOpenChange,
    name,
    photoBase64,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    name: string;
    photoBase64: string | null;
}) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>Foto no Dispositivo</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col items-center justify-center gap-6 py-10">
                    <div className="text-center">
                        <p className="text-sm font-medium">{name}</p>
                        <p className="text-xs text-muted-foreground">
                            Extraída diretamente da memória do leitor
                        </p>
                    </div>
                    {photoBase64 ? (
                        <div className="overflow-hidden rounded-xl border bg-muted shadow-sm">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={`data:image/jpeg;base64,${photoBase64}`}
                                alt="Foto do usuário"
                                className="max-h-100 w-auto object-contain"
                            />
                        </div>
                    ) : null}
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => onOpenChange(false)}
                    >
                        Fechar
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
