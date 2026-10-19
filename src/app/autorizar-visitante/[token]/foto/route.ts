import { apiFetchPublic } from '@/lib/api-fetch';

export const dynamic = 'force-dynamic';
const headers = {
    'Cache-Control': 'private, no-store',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
};

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ token: string }> },
) {
    const { token } = await params;
    if (!/^[a-f0-9]{64}$/.test(token))
        return new Response(null, { status: 404, headers });
    try {
        const response = await apiFetchPublic(
            `/api/visitor-approvals/${token}/photo`,
            {
                cache: 'no-store',
            },
        );
        if (
            !response.ok ||
            response.headers.get('content-type')?.split(';')[0] !== 'image/jpeg'
        )
            return new Response(null, { status: 404, headers });
        return new Response(response.body, {
            headers: { ...headers, 'Content-Type': 'image/jpeg' },
        });
    } catch {
        return new Response(null, { status: 503, headers });
    }
}
