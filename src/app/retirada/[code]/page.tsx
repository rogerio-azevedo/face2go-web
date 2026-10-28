import type { Metadata } from "next";

import { RetiradaWizard } from "@/components/retirada/RetiradaWizard";
import {
    buildPublicLinkMetadata,
    fetchPickupRegisterPreview,
    withDomainBrandMetadata,
} from "@/lib/responsible-register-metadata";

type PageProps = {
    params: Promise<{ code: string }>;
};

export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {
    const { code } = await params;
    const preview = await fetchPickupRegisterPreview(code ?? "");
    return withDomainBrandMetadata(
        buildPublicLinkMetadata(
            preview?.appBrand ?? "face2go",
            preview?.clientType,
        ),
        (appName) => `Link de retirada da plataforma ${appName}`,
    );
}

export default async function RetiradaPublicPage({ params }: PageProps) {
    const { code } = await params;
    const raw = code?.trim() ?? "";

    return (
        <div className="min-h-screen bg-muted/30 px-4 pt-3 pb-10">
            <RetiradaWizard code={raw} />
        </div>
    );
}
