import { CadastroWizard } from "@/components/cadastro/CadastroWizard";

type PageProps = {
    params: Promise<{ code: string }>;
};

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
