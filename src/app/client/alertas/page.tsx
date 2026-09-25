import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { PageHeader } from '@/components/shared/PageHeader';
import { fetchClientSelfSystemUsersAction } from '@/app/client/equipe/actions';
import { TelegramAlertsPanel } from '@/features/telegram-alerts/components/TelegramAlertsPanel';

export default async function ClientAlertasPage() {
    const session = await auth();
    if (session?.user?.role !== 'client_admin' || !session.user.clientId) {
        redirect('/client/cadastros');
    }

    const systemUsers = await fetchClientSelfSystemUsersAction();

    return (
        <div className="space-y-6">
            <PageHeader
                title="Alertas"
                description="Quem recebe no Telegram o aviso de tentativa de acesso bloqueada."
            />
            <TelegramAlertsPanel
                clientId={session.user.clientId}
                users={systemUsers.users}
            />
        </div>
    );
}
