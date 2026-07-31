export type PersonContextType = "member" | "responsible";

export type PersonLookupContext = {
    type: PersonContextType;
    clientId: string;
    clientName: string;
    isActive: boolean;
    hasLogin: boolean;
};

export type PersonLookupProfile = {
    name: string;
    email: string | null;
    phone: string | null;
};

export type PersonLookupResult = {
    matched: boolean;
    userId: string | null;
    hasLogin: boolean;
    profile: PersonLookupProfile | null;
    contexts: PersonLookupContext[];
    conflict?: string;
};

export const PERSON_CONTEXT_LABELS: Record<PersonContextType, string> = {
    member: "Membro",
    responsible: "Responsável",
};
