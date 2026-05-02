"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
    type CreateRegistrationLinkBody,
    defaultTemporaryVigenciaLocal,
    localDateTimeRangeToIso,
} from "@/lib/registration-link-schedule";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";

type ScheduleChoice = "permanent" | "temporary";

export function CreateRegistrationLinkSheet({
    open,
    onOpenChange,
    onSubmit,
    title = "Novo link de cadastro",
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    onSubmit: (body: CreateRegistrationLinkBody) => Promise<
        | { ok: true; registrationUrl: string }
        | { ok: false; error: string }
    >;
    title?: string;
}) {
    const [choice, setChoice] = useState<ScheduleChoice>("permanent");
    const [dateTimeFrom, setDateTimeFrom] = useState("");
    const [dateTimeUntil, setDateTimeUntil] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            setChoice("permanent");
            setDateTimeFrom("");
            setDateTimeUntil("");
            setSubmitting(false);
        }
    }, [open]);

    function setTemporaryChoice() {
        setChoice("temporary");
        const d = defaultTemporaryVigenciaLocal();
        setDateTimeFrom(d.from);
        setDateTimeUntil(d.until);
    }

    async function handleConfirm() {
        let body: CreateRegistrationLinkBody;
        if (choice === "permanent") {
            body = { kind: "permanent" };
        } else {
            if (!dateTimeFrom.trim() || !dateTimeUntil.trim()) {
                toast.error("Informe início e fim da vigência (data e hora).");
                return;
            }
            try {
                const r = localDateTimeRangeToIso(
                    dateTimeFrom.trim(),
                    dateTimeUntil.trim(),
                );
                body = {
                    kind: "temporary",
                    validFrom: r.validFrom,
                    validUntil: r.validUntil,
                };
            } catch (e) {
                toast.error(
                    e instanceof Error ? e.message : "Datas inválidas.",
                );
                return;
            }
        }
        setSubmitting(true);
        try {
            const result = await onSubmit(body);
            if (!result.ok) {
                toast.error(result.error);
                return;
            }
            toast.success("Link gerado.");
            onOpenChange(false);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                showCloseButton
                className="flex h-full w-full max-w-md flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
            >
                <SheetHeader className="shrink-0 space-y-2 border-b px-4 py-4 pr-14">
                    <SheetTitle>{title}</SheetTitle>
                    <SheetDescription>
                        Temporário: defina quando o link passa a valer e quando
                        encerra (horário do seu navegador). Permanente: válido até
                        você desativar o link.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 py-5">
                    <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground">
                            Tipo de vigência
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                type="button"
                                variant={
                                    choice === "permanent" ? "default" : "outline"
                                }
                                className="h-10 w-full"
                                onClick={() => {
                                    setChoice("permanent");
                                    setDateTimeFrom("");
                                    setDateTimeUntil("");
                                }}
                            >
                                Permanente
                            </Button>
                            <Button
                                type="button"
                                variant={
                                    choice === "temporary" ? "default" : "outline"
                                }
                                className="h-10 w-full"
                                onClick={() => setTemporaryChoice()}
                            >
                                Temporário
                            </Button>
                        </div>
                    </div>

                    {choice === "temporary" ? (
                        <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
                            <p className="text-xs text-muted-foreground">
                                Ajuste data e hora de início e fim. Visitantes só
                                conseguem usar o formulário dentro desse intervalo.
                            </p>
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <Label htmlFor="v-from" className="text-foreground">
                                        Início (data e hora)
                                    </Label>
                                    <Input
                                        id="v-from"
                                        type="datetime-local"
                                        step={60}
                                        value={dateTimeFrom}
                                        onChange={(e) =>
                                            setDateTimeFrom(e.target.value)
                                        }
                                        className="font-mono text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="v-until" className="text-foreground">
                                        Fim (data e hora)
                                    </Label>
                                    <Input
                                        id="v-until"
                                        type="datetime-local"
                                        step={60}
                                        value={dateTimeUntil}
                                        onChange={(e) =>
                                            setDateTimeUntil(e.target.value)
                                        }
                                        className="font-mono text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>

                <SheetFooter className="shrink-0 flex-row justify-end gap-2 border-t bg-background px-4 py-4">
                    <Button
                        type="button"
                        variant="outline"
                        className="min-w-24"
                        onClick={() => onOpenChange(false)}
                        disabled={submitting}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        className="min-w-24"
                        onClick={() => void handleConfirm()}
                        disabled={submitting}
                    >
                        {submitting ? "Gerando…" : "Gerar link"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
