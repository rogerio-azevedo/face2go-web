import { FaceRetakePage } from "@/features/registrations/components/FaceRetakePage";

type PageProps = {
    params: Promise<{ code: string }>;
};

export default async function FaceRetakePublicPage({ params }: PageProps) {
    const { code } = await params;
    const raw = code?.trim() ?? "";

    if (!raw) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
                Código do link ausente.
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/30">
            <FaceRetakePage code={raw} />
        </div>
    );
}
