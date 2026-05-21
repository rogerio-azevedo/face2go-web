import { CTASection } from "@/components/landing/CTASection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HeroSection } from "@/components/landing/HeroSection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { SolutionsSection } from "@/components/landing/SolutionsSection";

export function LandingPage() {
    return (
        <>
            <LandingHeader />
            <main id="main-content">
                <HeroSection />
                <FeaturesSection />
                <SolutionsSection />
                <CTASection />
            </main>
            <LandingFooter />
        </>
    );
}
