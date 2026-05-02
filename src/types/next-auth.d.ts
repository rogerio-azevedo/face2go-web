import type { DefaultSession } from 'next-auth';

import type { SessionRole } from '@/lib/dashboard-path';

declare module 'next-auth' {
    interface Session {
        accessToken?: string;
        user: DefaultSession['user'] & {
            id: string;
            role: SessionRole;
            companyId?: string;
            clientId?: string;
            companyUserId?: string;
            clientUserId?: string;
        };
    }

    interface User {
        role?: SessionRole;
        companyId?: string;
        clientId?: string;
        companyUserId?: string;
        clientUserId?: string;
        accessToken?: string;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        role?: SessionRole;
        companyId?: string | null;
        clientId?: string | null;
        companyUserId?: string | null;
        clientUserId?: string | null;
        accessToken?: string;
    }
}
