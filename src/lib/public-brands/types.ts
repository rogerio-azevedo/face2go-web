export type PublicBrandSlug = "face2go" | "ienh";

export type ManualScreenIcon = "home" | "user-plus" | "clock" | "car";

export type ManualStep = {
    title: string;
    description: string;
    showStoreLinks?: boolean;
};

export type ManualScreenImage = {
    src: string;
    alt: string;
    caption?: string;
};

export type ManualScreen = {
    id: string;
    icon: ManualScreenIcon;
    title: string;
    subtitle: string;
    description: string;
    images: ManualScreenImage[];
    tips: string[];
};

export type FaqAnswerPart =
    | { type: "text"; text: string }
    | { type: "link"; href: string; label: string; external?: boolean }
    | { type: "store"; store: "play" | "app" };

export type ManualFaqItem = {
    question: string;
    answer: FaqAnswerPart[];
};

export type PublicBrandConfig = {
    slug: PublicBrandSlug;
    appName: string;
    storeAppName: string;
    displayName: string;
    routePrefix: string;
    homeHref: string;
    logo: {
        src: string;
        alt: string;
        width: number;
        height: number;
        headerClassName?: string;
    };
    colors: {
        deepNavy: string;
        accent: string;
        accentForeground: string;
        link: string;
        offWhite: string;
        slate: string;
    };
    storeLinks: {
        playStore: string;
        appStore: string;
        qrPlay: string;
        qrAppStore: string;
    };
    support: { href: string; label: string };
    metadata: {
        title: string;
        description: string;
        ogImage?: string;
    };
    copy: {
        intro: string;
        gettingStartedSubtitle: string;
        syncAppName: string;
        steps: ManualStep[];
        screens: ManualScreen[];
        faq: ManualFaqItem[];
        footerTagline: string;
        copyrightName: string;
    };
};
