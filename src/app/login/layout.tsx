import type { Metadata } from "next";

import { LoginHero } from "@/components/login/LoginHero";

export const metadata: Metadata = {
    title: "Entrar • Face2go",
    description: "Acesso à conta Face2go",
};

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="bg-auth-dot-grid relative flex min-h-full flex-1 flex-col px-4 py-8 sm:px-6 lg:min-h-screen lg:px-12 lg:py-12">
            <div className="mx-auto flex min-h-[min(820px,calc(100vh-7rem))] w-full max-w-6xl flex-1 flex-col items-stretch lg:flex-row lg:items-center lg:gap-14 xl:gap-20">
                <aside className="hidden flex-1 py-6 lg:flex lg:max-w-lg lg:justify-end xl:max-w-xl">
                    <LoginHero />
                </aside>
                <div className="flex flex-1 items-center justify-center py-6 lg:justify-start lg:py-0">
                    <div className="w-full max-w-md">{children}</div>
                </div>
            </div>
        </div>
    );
}
