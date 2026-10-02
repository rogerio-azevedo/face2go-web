import { Suspense } from "react";

import { RegisterForm } from "@/components/auth/RegisterForm";
import { buildGenericPlatformMetadata } from "@/lib/responsible-register-metadata";

export const metadata = buildGenericPlatformMetadata(
    "Cadastro • Face2Go",
    "Conclua seu cadastro na plataforma Face2Go.",
);

export default function RegisterPage() {
    return (
        <div className="bg-muted/30 flex min-h-svh flex-col items-center justify-center p-4">
            <Suspense
                fallback={
                    <p className="text-muted-foreground text-sm">Carregando...</p>
                }
            >
                <RegisterForm />
            </Suspense>
        </div>
    );
}
