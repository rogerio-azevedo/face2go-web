export type PublicRegistrationFormData = {
    name: string;
    phone: string;
    document: string;
    plate: string;
    brand: string;
    model: string;
    color: string;
};

export const emptyPublicRegistrationForm = (): PublicRegistrationFormData => ({
    name: "",
    phone: "",
    document: "",
    plate: "",
    brand: "",
    model: "",
    color: "",
});

export function buildPublicRegistrationSubmitBody(
    form: PublicRegistrationFormData,
    faceImageKey: string,
): Record<string, unknown> {
    const hasVehicle = form.plate.trim().length > 0;
    const body: Record<string, unknown> = {
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        document: form.document.trim(),
        faceImageKey,
    };
    if (hasVehicle) {
        body.vehicle = {
            plate: form.plate.trim(),
            brand: form.brand.trim(),
            model: form.model.trim(),
            color: form.color.trim(),
        };
    }
    return body;
}
