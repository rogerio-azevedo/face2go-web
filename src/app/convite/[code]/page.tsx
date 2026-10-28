import type { Metadata } from "next";

import { ConviteWizard } from "@/components/convite/ConviteWizard";
import {
    buildPublicLinkMetadata,
    fetchInviteRegisterPreview,
    withDomainBrandMetadata,
} from "@/lib/responsible-register-metadata";

type PageProps = {
    params: Promise<{ code: string }>;
};

export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {
    const { code } = await params;
    const preview = await fetchInviteRegisterPreview(code ?? "");
    return withDomainBrandMetadata(
        buildPublicLinkMetadata(
            preview?.appBrand ?? "face2go",
            preview?.clientType,
        ),
        (appName) => `Link de convite da plataforma ${appName}`,
    );
}

export default async function ConvitePublicPage({ params }: PageProps) {
    const { code } = await params;
    const raw = code?.trim() ?? "";

    return (
        <div className="min-h-screen bg-muted/30 px-4 pt-3 pb-10">
            <ConviteWizard code={raw} />
        </div>
    );
}
