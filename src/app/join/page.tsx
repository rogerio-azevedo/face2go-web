import { Suspense } from "react";

import { JoinContextForm } from "@/components/auth/JoinContextForm";

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
