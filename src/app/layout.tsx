import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AppProviders } from "@/components/shared/AppProviders";
import { getAppBaseUrl } from "@/lib/responsible-register-metadata";

import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    metadataBase: new URL(getAppBaseUrl()),
    title: "Face2go - Plataforma de Controle de Acesso",
    description: "Plataforma para gestão de cadastro integrada a leitores faciais, CFTV, câmeras LPR e catracas — soluções para escolas, clínicas, empresas e escritórios.",
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
