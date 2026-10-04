export type CatalogUnit = {
    id: string;
    name: string;
    isActive: boolean;
};

export type CatalogBlock = {
    id: string;
    name: string;
    isActive: boolean;
    units: CatalogUnit[];
};

export type LocationReviewSummaryRow = {
    clientId: string;
    name: string;
    isActive: boolean;
    activeUnits: number;
    linked: number;
    textOnly: number;
    noLocation: number;
    groups: number;
};

export type LocationReviewPerson = {
    kind: "registration" | "member";
    id: string;
    name: string | null;
    faceId: number | null;
};

export type LocationReviewSuggestion = {
    unitId: string;
    blockId: string;
    blockName: string;
    unitName: string;
    exact: boolean;
};

export type LocationReviewGroup = {
    key: string;
    blockText: string;
    unitText: string;
    registrations: number;
    members: number;
    people: LocationReviewPerson[];
    suggestion: LocationReviewSuggestion | null;
};

export type ClientLocationReview = {
    client: { id: string; name: string };
    catalog: CatalogBlock[];
    summary: { linked: number; textOnly: number; noLocation: number };
    groups: LocationReviewGroup[];
    noLocation: {
        registrations: number;
        members: number;
        people: LocationReviewPerson[];
    };
};
