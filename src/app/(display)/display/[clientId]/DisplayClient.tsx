'use client';

import { ArrivalDisplay } from '@/components/arrivals/ArrivalDisplay';

export default function DisplayClientRoute(props: {
    clientId: string;
    token: string;
}) {
    const { clientId, token } = props;
    return <ArrivalDisplay clientId={clientId} token={token} />;
}
