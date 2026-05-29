import { ResponsibleRegisterWizard } from "@/components/cadastro-responsavel/ResponsibleRegisterWizard";

type PageProps = {
    params: Promise<{ code: string }>;
};

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
