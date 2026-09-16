"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Sheet,
    SheetContent,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";

export function ClientSystemUserEditSheet({
    open,
    name,
    email,
    password,
    pending,
    onNameChange,
    onEmailChange,
    onPasswordChange,
    onClose,
    onSave,
}: {
    open: boolean;
    name: string;
    email: string;
    password: string;
    pending: boolean;
    onNameChange: (value: string) => void;
    onEmailChange: (value: string) => void;
    onPasswordChange: (value: string) => void;
    onClose: () => void;
    onSave: () => void;
}) {
    return (
        <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
            <SheetContent side="right" className="w-full sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>Editar usuário</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="clientUserName">Nome</Label>
                        <Input
                            id="clientUserName"
                            value={name}
                            onChange={(e) => onNameChange(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="clientUserEmail">E-mail</Label>
                        <Input
                            id="clientUserEmail"
                            type="email"
                            autoCapitalize="none"
                            autoCorrect="off"
                            value={email}
                            onChange={(e) =>
                                onEmailChange(e.target.value.toLowerCase())
                            }
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="clientUserPassword">
                            Nova senha (opcional)
                        </Label>
                        <Input
                            id="clientUserPassword"
                            type="password"
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => onPasswordChange(e.target.value)}
                        />
                    </div>
                </div>
                <SheetFooter className="flex-row justify-end gap-2">
                    <Button
                        variant="outline"
                        type="button"
                        onClick={onClose}
                        disabled={pending}
                    >
                        Cancelar
                    </Button>
                    <Button type="button" onClick={onSave} disabled={pending}>
                        {pending ? "Salvando..." : "Salvar"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
