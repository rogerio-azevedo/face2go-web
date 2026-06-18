export type ClientMapPoint = {
    id: string;
    name: string;
    type: "school" | "clinic" | "condominium" | "office" | "other";
    latitude: number;
    longitude: number;
    city: string | null;
    state: string | null;
};

export const CLIENT_TYPE_LABEL: Record<ClientMapPoint["type"], string> = {
    school: "Escola",
    clinic: "Clínica",
    condominium: "Condomínio",
    office: "Escritório",
    other: "Outro",
};

export function normalizeClientMapPointType(
    type: string,
): ClientMapPoint["type"] {
    if (
        type === "school" ||
        type === "clinic" ||
        type === "condominium" ||
        type === "office" ||
        type === "other"
    ) {
        return type;
    }
    return "other";
}
