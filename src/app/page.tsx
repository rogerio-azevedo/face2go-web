import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { LandingPage } from "@/components/landing/LandingPage";
import { getDashboardPathForRole } from "@/lib/dashboard-path";

export const metadata: Metadata = {
    title: "Face2Go — Gestão de cadastro e acesso com biometria",
    description:
        "Plataforma para gestão de cadastro integrada a leitores faciais, CFTV, câmeras LPR e catracas — soluções para escolas, clínicas, empresas e escritórios.",
};

export default async function HomePage() {
    const session = await auth();
    const user = session?.user;
    if (user) {
        redirect(getDashboardPathForRole(user.role));
    }
    return <LandingPage />;
}
