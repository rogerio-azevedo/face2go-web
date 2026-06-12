import { ConviteWizard } from "@/components/convite/ConviteWizard";

type PageProps = {
    params: Promise<{ code: string }>;
};

export default async function ConvitePublicPage({ params }: PageProps) {
    const { code } = await params;
    const raw = code?.trim() ?? "";

    return (
        <div className="min-h-screen bg-muted/30 px-4 pt-3 pb-10">
            <ConviteWizard code={raw} />
        </div>
    );
}
