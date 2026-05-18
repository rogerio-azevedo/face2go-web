import type { ReactNode } from 'react';

/** Grupo apenas para agrupar rota `/display`; herda RootLayout + AppProviders. */
export default function DisplayGroupLayout({
    children,
}: {
    children: ReactNode;
}) {
    return <>{children}</>;
}
