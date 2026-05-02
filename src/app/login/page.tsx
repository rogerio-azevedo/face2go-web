import { Suspense } from "react";

import { LoginForm } from "@/components/login/LoginForm";

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="text-muted-foreground">Carregando...</div>}>
            <LoginForm />
        </Suspense>
    );
}
