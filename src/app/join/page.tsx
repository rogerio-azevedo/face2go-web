import { Suspense } from "react";

import { JoinContextForm } from "@/components/auth/JoinContextForm";
import {
    BRAND_OG_HEIGHT,
    BRAND_OG_WIDTH,
    brandOgImagePath,
} from "@/features/branding/og-image";
import { getBrand } from "@/features/branding/server/get-brand";
import { buildGenericPlatformMetadata } from "@/lib/responsible-register-metadata";

export async function generateMetadata() {
    const brand = await getBrand();
    return buildGenericPlatformMetadata(
        `Entrar no contexto • ${brand.appName}`,
        `Aceite o convite e acesse a plataforma ${brand.appName}.`,
        {
            url: brandOgImagePath(brand),
            width: BRAND_OG_WIDTH,
            height: BRAND_OG_HEIGHT,
        },
    );
}

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
