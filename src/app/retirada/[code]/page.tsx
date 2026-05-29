import { RetiradaWizard } from "@/components/retirada/RetiradaWizard";

type PageProps = {
    params: Promise<{ code: string }>;
};

export default async function RetiradaPublicPage({ params }: PageProps) {
    const { code } = await params;
    const raw = code?.trim() ?? "";

    return (
        <div className="min-h-screen bg-muted/30 px-4 py-10">
            <RetiradaWizard code={raw} />
        </div>
    );
}
