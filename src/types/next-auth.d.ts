import type { DefaultSession } from 'next-auth';

import type { SessionRole } from '@/lib/dashboard-path';
import type { UserContext } from '@/types/auth-context';

declare module 'next-auth' {
    interface Session {
        accessToken?: string;
        contexts?: UserContext[];
        activeContext?: UserContext | null;
        user: DefaultSession['user'] & {
            id: string;
            role: SessionRole;
            companyId?: string;
            clientId?: string;
            companyUserId?: string;
            clientUserId?: string;
            responsibleId?: string;
        };
    }

    interface User {
        role?: SessionRole;
        companyId?: string;
        clientId?: string;
        companyUserId?: string;
        clientUserId?: string;
        responsibleId?: string;
        accessToken?: string;
        contexts?: UserContext[];
        activeContext?: UserContext;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        role?: SessionRole;
        companyId?: string | null;
        clientId?: string | null;
        companyUserId?: string | null;
        clientUserId?: string | null;
        responsibleId?: string | null;
        accessToken?: string;
        contexts?: UserContext[];
        activeContext?: UserContext | null;
    }
}
