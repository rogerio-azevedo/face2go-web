import { ImageResponse } from "next/og";

import { contrastTextColor, isValidHttpUrl, parseHexColor } from "@/lib/branding";

import {
    BRAND_OG_HEIGHT,
    BRAND_OG_WIDTH,
} from "../og-image";
import {
    FACE2GO_ACCENT,
    FACE2GO_PRIMARY,
    type ResolvedBrand,
} from "../types";

const TAGLINE = "Gestão de cadastro e acesso com biometria";

function backgroundColor(brand: ResolvedBrand): string {
    return parseHexColor(brand.primaryColor)
        ? brand.primaryColor
        : FACE2GO_PRIMARY;
}

function accentColor(brand: ResolvedBrand): string {
    return parseHexColor(brand.accentColor) ? brand.accentColor : FACE2GO_ACCENT;
}

function logoForBackground(brand: ResolvedBrand, background: string): string | null {
    const onLight = contrastTextColor(background) === "#101010";
    const preferred = onLight ? brand.logoUrl : brand.logoDarkUrl;
    const alternate = onLight ? brand.logoDarkUrl : brand.logoUrl;
    if (isValidHttpUrl(preferred)) return preferred;
    if (isValidHttpUrl(alternate)) return alternate;
    return null;
}

function logoCard(background: string, accent: string, logo: string, appName: string) {
    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                backgroundColor: background,
            }}
        >
            <div
                style={{
                    display: "flex",
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "72px 96px 56px",
                }}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    alt={appName}
                    src={logo}
                    width={1000}
                    height={420}
                    style={{ objectFit: "contain" }}
                />
            </div>
            <div style={{ height: 16, width: "100%", backgroundColor: accent }} />
        </div>
    );
}

function textCard(
    background: string,
    accent: string,
    nameColor: string,
    appName: string,
) {
    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                backgroundColor: background,
            }}
        >
            <div
                style={{
                    display: "flex",
                    flex: 1,
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "72px 96px",
                }}
            >
                <div
                    style={{
                        fontFamily: "Inter",
                        fontSize: 84,
                        fontWeight: 600,
                        color: nameColor,
                        letterSpacing: -1.5,
                    }}
                >
                    {appName}
                </div>
                <div
                    style={{
                        fontFamily: "Inter",
                        marginTop: 24,
                        fontSize: 28,
                        color: nameColor,
                        opacity: 0.82,
                    }}
                >
                    {TAGLINE}
                </div>
            </div>
            <div style={{ height: 16, width: "100%", backgroundColor: accent }} />
        </div>
    );
}

async function loadFont(): Promise<ArrayBuffer> {
    const res = await fetch(
        "https://cdn.jsdelivr.net/fontsource/fonts/inter@5.2.8/latin-600-normal.ttf",
    );
    if (!res.ok) {
        throw new Error("Não foi possível carregar a fonte do cartão.");
    }
    return res.arrayBuffer();
}

export async function renderBrandOpenGraph(brand: ResolvedBrand): Promise<Response> {
    const background = backgroundColor(brand);
    const accent = accentColor(brand);
    const logo = logoForBackground(brand, background);
    const size = { width: BRAND_OG_WIDTH, height: BRAND_OG_HEIGHT };

    if (logo) {
        try {
            const image = new ImageResponse(
                logoCard(background, accent, logo, brand.appName),
                size,
            );
            const bytes = await image.arrayBuffer();
            return new Response(bytes, {
                headers: { "Content-Type": "image/png" },
            });
        } catch {
            // logo remoto inválido para o gerador: cai no nome da marca
        }
    }

    const nameColor = contrastTextColor(background);
    const font = await loadFont();
    const image = new ImageResponse(
        textCard(background, accent, nameColor, brand.appName),
        {
            ...size,
            fonts: [{ name: "Inter", data: font, weight: 600, style: "normal" }],
        },
    );
    const bytes = await image.arrayBuffer();
    return new Response(bytes, {
        headers: { "Content-Type": "image/png" },
    });
}
