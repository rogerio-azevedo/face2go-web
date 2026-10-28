import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";

import { AppProviders } from "@/components/shared/AppProviders";
import { BrandProvider } from "@/features/branding/components/BrandProvider";
import { BrandStyle } from "@/features/branding/components/BrandStyle";
import {
    BRAND_OG_HEIGHT,
    BRAND_OG_WIDTH,
    brandOgImagePath,
} from "@/features/branding/og-image";
import { getBrand } from "@/features/branding/server/get-brand";
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

export async function generateMetadata(): Promise<Metadata> {
    const brand = await getBrand();
    const headerList = await headers();
    const host = (
        headerList.get("x-forwarded-host") ??
        headerList.get("host") ??
        ""
    )
        .split(",")[0]
        ?.trim();
    const proto = headerList.get("x-forwarded-proto") ?? "https";
    const metadataBase =
        brand.source === "domain" && host
            ? new URL(`${proto}://${host}`)
            : new URL(getAppBaseUrl());
    const title = brand.isDefault
        ? PLATFORM_TITLE
        : `${brand.appName} - Plataforma de Controle de Acesso`;

    return {
        metadataBase,
        ...buildGenericPlatformMetadata(title, PLATFORM_DESCRIPTION, {
            url: brandOgImagePath(brand),
            width: BRAND_OG_WIDTH,
            height: BRAND_OG_HEIGHT,
        }),
        ...(brand.isDefault
            ? {}
            : { icons: { icon: brand.iconUrl, apple: brand.iconUrl } }),
    };
}

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const brand = await getBrand();

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
                <BrandStyle />
                <BrandProvider brand={brand}>
                    <AppProviders>{children}</AppProviders>
                </BrandProvider>
            </body>
        </html>
    );
}
