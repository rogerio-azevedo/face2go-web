import type { Metadata } from 'next';
import { previewChildApproval } from '@/features/child-approvals/actions';
import { ChildApprovalForm } from '@/features/child-approvals/components/ChildApprovalForm';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
    title: 'Autorização de menor | Face2Go',
    robots: { index: false, follow: false },
    referrer: 'no-referrer',
};
export default async function Page({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = await params;
    const result = await previewChildApproval(token);
    return (
        <main className="bg-background min-h-dvh px-4 py-6">
            <div className="bg-card mx-auto max-w-6xl rounded-xl border p-6 shadow-sm sm:p-8">
                {result.ok ? (
                    <ChildApprovalForm token={token} preview={result.data} />
                ) : (
                    <div className="space-y-3">
                        <h1 className="text-xl font-semibold">
                            Autorização indisponível
                        </h1>
                        <p role="alert" className="text-muted-foreground">
                            {result.error}
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
}
