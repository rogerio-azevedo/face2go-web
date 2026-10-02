import type { Metadata } from "next";

import { ResponsibleRegisterWizard } from "@/components/cadastro-responsavel/ResponsibleRegisterWizard";
import {
    buildPublicLinkMetadata,
    fetchResponsibleRegisterPreview,
} from "@/lib/responsible-register-metadata";

type PageProps = {
    params: Promise<{ code: string }>;
};

export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {
    const { code } = await params;
    const preview = await fetchResponsibleRegisterPreview(code ?? "");
    return buildPublicLinkMetadata(
        preview?.appBrand ?? "face2go",
        preview?.clientType,
    );
}

export default async function CadastroResponsavelPublicPage({
    params,
}: PageProps) {
    const { code } = await params;
    const raw = code?.trim() ?? "";

    return (
        <div className="min-h-screen bg-muted/30 px-4 pt-3 pb-10">
            <ResponsibleRegisterWizard code={raw} />
        </div>
    );
}
