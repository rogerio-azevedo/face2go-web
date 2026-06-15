import type { Metadata } from "next";

import { ConviteWizard } from "@/components/convite/ConviteWizard";
import {
    buildPublicLinkMetadata,
    fetchInviteRegisterPreview,
} from "@/lib/responsible-register-metadata";

type PageProps = {
    params: Promise<{ code: string }>;
};

export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {
    const { code } = await params;
    const preview = await fetchInviteRegisterPreview(code ?? "");
    const appBrand = preview?.appBrand ?? "face2go";

    return buildPublicLinkMetadata(appBrand);
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
