import type { components } from "@/types/api.generated";

export type UpdateClientBlockInput = components["schemas"]["UpdateClientBlockDto"];
export type MoveLocationGroupsInput =
    components["schemas"]["MoveLocationGroupsDto"];

export type CatalogUnit = {
    id: string;
    name: string;
    isActive: boolean;
};

export type CatalogBlock = {
    id: string;
    name: string;
    isActive: boolean;
    isAdministrative: boolean;
    units: CatalogUnit[];
};

export type LocationReviewPerson = {
    kind: "registration" | "member";
    id: string;
    name: string | null;
    faceId: number | null;
    /** Só nos grupos vinculados; `false` = pessoa inativa. */
    active?: boolean;
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

export type LinkedLocationGroup = {
    key: string;
    unitId: string;
    blockName: string;
    unitName: string;
    blockActive: boolean;
    unitActive: boolean;
    registrations: number;
    members: number;
    inactive: number;
    people: LocationReviewPerson[];
    suggestion: LocationReviewSuggestion | null;
};

export type ClientLocationReview = {
    client: { id: string; name: string };
    catalog: CatalogBlock[];
    summary: {
        linked: number;
        linkedGroups: number;
        textOnly: number;
        noLocation: number;
    };
    groups: LocationReviewGroup[];
    noLocation: {
        registrations: number;
        members: number;
        people: LocationReviewPerson[];
    };
    linkedGroups: LinkedLocationGroup[];
};
