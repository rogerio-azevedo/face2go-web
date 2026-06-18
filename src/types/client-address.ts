export type ClientAddressRow = {
    id: string;
    clientId: string;
    label: string;
    isPrimary: boolean;
    cep: string | null;
    street: string | null;
    number: string | null;
    complement: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
    country: string;
    latitude: number | null;
    longitude: number | null;
    geocodingProvider: "here" | "manual";
    geocodingPrecision: "rooftop" | "street" | "approximate" | null;
    hereLocationId: string | null;
    createdAt: string;
    updatedAt: string;
};

export function formatAddressLine(row: ClientAddressRow): string {
    const parts = [
        row.street,
        row.number,
        row.neighborhood,
        row.city,
        row.state,
    ].filter(Boolean);
    return parts.join(", ") || row.label;
}
