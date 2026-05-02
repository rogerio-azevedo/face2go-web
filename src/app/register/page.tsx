import { Suspense } from "react";

import { RegisterForm } from "@/components/auth/RegisterForm";

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
