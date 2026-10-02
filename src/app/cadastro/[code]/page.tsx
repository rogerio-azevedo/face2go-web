import type { Metadata } from "next";

import { CadastroWizard } from "@/components/cadastro/CadastroWizard";
import {
    buildPublicLinkMetadata,
    fetchRegisterPreview,
} from "@/lib/responsible-register-metadata";

type PageProps = {
    params: Promise<{ code: string }>;
};

export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {
    const { code } = await params;
    const preview = await fetchRegisterPreview(code ?? "");
    return buildPublicLinkMetadata(
        preview?.appBrand ?? "face2go",
        preview?.clientType,
    );
}

export default async function CadastroPublicPage({ params }: PageProps) {
    const { code } = await params;
    const raw = code?.trim() ?? "";

    if (!raw) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
                Código do convite ausente.
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/30">
            <CadastroWizard code={raw} />
        </div>
    );
}
