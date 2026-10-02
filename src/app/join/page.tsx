import { Suspense } from "react";

import { JoinContextForm } from "@/components/auth/JoinContextForm";
import { buildGenericPlatformMetadata } from "@/lib/responsible-register-metadata";

export const metadata = buildGenericPlatformMetadata(
    "Entrar no contexto • Face2Go",
    "Aceite o convite e acesse a plataforma Face2Go.",
);

export default function JoinPage() {
    return (
        <div className="bg-muted/30 flex min-h-svh flex-col items-center justify-center p-4">
            <Suspense
                fallback={
                    <p className="text-muted-foreground text-sm">Carregando...</p>
                }
            >
                <JoinContextForm />
            </Suspense>
        </div>
    );
}
