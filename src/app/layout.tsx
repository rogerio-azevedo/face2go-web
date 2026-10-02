import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AppProviders } from "@/components/shared/AppProviders";
import {
    buildGenericPlatformMetadata,
    getAppBaseUrl,
} from "@/lib/responsible-register-metadata";

import "./brand-theme.css";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

const PLATFORM_TITLE = "Face2go - Plataforma de Controle de Acesso";
const PLATFORM_DESCRIPTION =
    "Plataforma para gestão de cadastro integrada a leitores faciais, CFTV, câmeras LPR e catracas — soluções para escolas, clínicas, empresas e escritórios.";

export const metadata: Metadata = {
    metadataBase: new URL(getAppBaseUrl()),
    ...buildGenericPlatformMetadata(PLATFORM_TITLE, PLATFORM_DESCRIPTION),
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="pt-BR"
            suppressHydrationWarning
            className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        >
            <body
                className="min-h-full flex flex-col font-sans"
                suppressHydrationWarning
            >
                <AppProviders>{children}</AppProviders>
            </body>
        </html>
    );
}
