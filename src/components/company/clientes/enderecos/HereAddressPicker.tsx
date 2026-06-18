"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    MapContainer,
    Marker,
    TileLayer,
    useMap,
} from "react-leaflet";
import { Loader2, LocateFixed, MapPin, Search } from "lucide-react";
import { toast } from "sonner";

import {
    geocodingAutocompleteAction,
    geocodingGeocodeAction,
    geocodingLookupAction,
    geocodingReverseAction,
} from "@/app/company/clientes/[clientId]/enderecos/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GeocodingSuggestion } from "@/lib/validations/client-addresses";
import {
    normalizeCep,
    normalizeCountryCode,
} from "@/lib/validations/client-addresses";

const DEFAULT_CENTER: [number, number] = [-23.5505, -46.6333];

const markerIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

export type AddressPickerValue = {
    cep?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    geocodingProvider?: "here" | "manual";
    geocodingPrecision?: "rooftop" | "street" | "approximate";
    hereLocationId?: string;
};

type HereAddressPickerProps = {
    value: AddressPickerValue;
    onChange: (next: AddressPickerValue) => void;
};

function extractCepDigits(...sources: Array<string | undefined>): string | null {
    for (const source of sources) {
        const digits = source?.replace(/\D/g, "") ?? "";
        if (digits.length === 8) return digits;
    }
    return null;
}

function formatCep(digits: string): string {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function MapRecenter({
    center,
    zoom,
}: {
    center: [number, number];
    zoom: number;
}) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom, { animate: true });
    }, [center, zoom, map]);
    return null;
}

function DraggableMarker({
    position,
    onDragEnd,
}: {
    position: [number, number];
    onDragEnd: (lat: number, lng: number) => void;
}) {
    const markerRef = useRef<L.Marker>(null);

    return (
        <Marker
            draggable
            position={position}
            icon={markerIcon}
            ref={markerRef}
            eventHandlers={{
                dragend: () => {
                    const marker = markerRef.current;
                    if (!marker) return;
                    const latlng = marker.getLatLng();
                    onDragEnd(latlng.lat, latlng.lng);
                },
            }}
        />
    );
}

function applySuggestion(
    suggestion: GeocodingSuggestion,
): AddressPickerValue {
    return {
        cep: normalizeCep(suggestion.address.cep),
        street: suggestion.address.street,
        number: suggestion.address.number,
        neighborhood: suggestion.address.neighborhood,
        city: suggestion.address.city,
        state: suggestion.address.state,
        country: normalizeCountryCode(suggestion.address.country),
        latitude: suggestion.latitude,
        longitude: suggestion.longitude,
        geocodingProvider: "here",
        geocodingPrecision: suggestion.precision,
        hereLocationId: suggestion.id,
    };
}

export function HereAddressPicker({ value, onChange }: HereAddressPickerProps) {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<GeocodingSuggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [locating, setLocating] = useState(false);
    const [geocodingUnavailable, setGeocodingUnavailable] = useState(false);
    const [userCenter, setUserCenter] = useState<[number, number] | null>(
        null,
    );
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const autocompleteGenerationRef = useRef(0);

    const hasPin =
        value.latitude !== undefined && value.longitude !== undefined;

    const mapCenter = useMemo<[number, number]>(() => {
        if (hasPin) {
            return [value.latitude!, value.longitude!];
        }
        if (userCenter) return userCenter;
        return DEFAULT_CENTER;
    }, [hasPin, userCenter, value.latitude, value.longitude]);

    const mapZoom = hasPin ? 16 : userCenter ? 14 : 11;

    const biasAt = useMemo(() => {
        if (value.latitude !== undefined && value.longitude !== undefined) {
            return `${value.latitude},${value.longitude}`;
        }
        if (userCenter) return `${userCenter[0]},${userCenter[1]}`;
        return undefined;
    }, [userCenter, value.latitude, value.longitude]);

    const runAutocomplete = useCallback(
        async (text: string) => {
            if (text.trim().length < 2) {
                setSuggestions([]);
                return;
            }

            const generation = ++autocompleteGenerationRef.current;
            setLoading(true);

            const result = await geocodingAutocompleteAction(text, biasAt);

            if (generation !== autocompleteGenerationRef.current) return;

            setLoading(false);
            if (!result.ok) {
                setSuggestions([]);
                return;
            }

            setGeocodingUnavailable(false);
            setSuggestions(result.items);
        },
        [biasAt],
    );

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            void runAutocomplete(query);
        }, 300);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query, runAutocomplete]);

    const applyGeocodingResult = async (item: GeocodingSuggestion) => {
        setQuery(item.label);
        setSuggestions([]);
        setGeocodingUnavailable(false);

        if (item.latitude && item.longitude) {
            onChange(applySuggestion(item));
            return;
        }

        const lookup = await geocodingLookupAction(item.id);
        if (!lookup.ok || !lookup.item) {
            if (lookup.ok) {
                toast.error("Endereço não encontrado.");
            } else {
                toast.error(lookup.error);
                if (lookup.unavailable) setGeocodingUnavailable(true);
            }
            return;
        }

        onChange(applySuggestion(lookup.item));
    };

    const handleSearchCep = async () => {
        const cepDigits = extractCepDigits(query, value.cep);
        if (!cepDigits) {
            toast.error("Informe um CEP válido na busca ou no formulário.");
            return;
        }

        const formattedCep = formatCep(cepDigits);
        setQuery(formattedCep);
        setLoading(true);

        const result = await geocodingGeocodeAction(formattedCep);
        setLoading(false);

        if (!result.ok) {
            toast.error(result.error);
            if (result.unavailable) setGeocodingUnavailable(true);
            return;
        }

        setGeocodingUnavailable(false);

        if (result.items[0]) {
            await applyGeocodingResult(result.items[0]);
            return;
        }

        toast.error("CEP não encontrado.");
    };

    const handleMarkerDrag = async (lat: number, lng: number) => {
        onChange({
            ...value,
            latitude: lat,
            longitude: lng,
            geocodingProvider: "manual",
            geocodingPrecision: undefined,
        });

        const result = await geocodingReverseAction(lat, lng);
        if (!result.ok) {
            if (result.unavailable) setGeocodingUnavailable(true);
            return;
        }

        setGeocodingUnavailable(false);
        if (!result.item) return;

        onChange({
            ...applySuggestion(result.item),
            complement: value.complement,
        });
    };

    const handleUseMyLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocalização não suportada neste navegador.");
            return;
        }

        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                setUserCenter([lat, lng]);
                setLocating(false);

                onChange({
                    ...value,
                    latitude: lat,
                    longitude: lng,
                    geocodingProvider: "manual",
                    geocodingPrecision: undefined,
                });

                const result = await geocodingReverseAction(lat, lng);
                if (result.ok && result.item) {
                    setGeocodingUnavailable(false);
                    onChange({
                        ...applySuggestion(result.item),
                        complement: value.complement,
                    });
                    toast.success("Mapa centralizado na sua localização.");
                } else {
                    if (!result.ok && result.unavailable) {
                        setGeocodingUnavailable(true);
                    }
                    toast.success(
                        "Localização obtida. Ajuste o pin se necessário.",
                    );
                }
            },
            (err) => {
                setLocating(false);
                if (err.code === err.PERMISSION_DENIED) {
                    toast.error(
                        "Permissão de localização negada. Habilite no navegador para centralizar o mapa.",
                    );
                    return;
                }
                toast.error("Não foi possível obter sua localização.");
            },
            { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
        );
    };

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-sm font-semibold">Localização no mapa</h3>
                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                    Busque o endereço, use sua localização atual ou arraste o
                    pin para ajustar o ponto exato.
                </p>
            </div>

            {geocodingUnavailable ? (
                <p className="bg-muted/60 text-muted-foreground rounded-lg border px-3 py-2 text-xs">
                    Serviço de busca temporariamente indisponível. Tente
                    novamente ou preencha manualmente.
                </p>
            ) : null}

            <div className="relative z-[1100]">
                <Search className="text-muted-foreground absolute top-2.5 left-3 size-4" />
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar por endereço ou CEP..."
                    className="h-10 pl-9"
                />
                {loading ? (
                    <Loader2 className="text-muted-foreground absolute top-2.5 right-3 size-4 animate-spin" />
                ) : null}
                {suggestions.length > 0 ? (
                    <ul className="bg-popover absolute z-[1100] mt-1 max-h-52 w-full overflow-auto rounded-lg border shadow-lg">
                        {suggestions.map((item) => (
                            <li key={item.id}>
                                <button
                                    type="button"
                                    className="hover:bg-muted w-full px-3 py-2.5 text-left text-sm"
                                    onClick={() =>
                                        void applyGeocodingResult(item)
                                    }
                                >
                                    {item.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handleSearchCep()}
                    disabled={loading}
                >
                    <MapPin className="size-4" />
                    Buscar pelo CEP
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleUseMyLocation}
                    disabled={locating}
                >
                    {locating ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : (
                        <LocateFixed className="size-4" />
                    )}
                    Minha localização
                </Button>
            </div>

            <div className="relative isolate z-0 overflow-hidden rounded-xl border shadow-sm">
                <MapContainer
                    center={mapCenter}
                    zoom={mapZoom}
                    className="h-[min(42vh,360px)] w-full min-h-[240px]"
                    scrollWheelZoom
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapRecenter center={mapCenter} zoom={mapZoom} />
                    {hasPin ? (
                        <DraggableMarker
                            position={[value.latitude!, value.longitude!]}
                            onDragEnd={(lat, lng) =>
                                void handleMarkerDrag(lat, lng)
                            }
                        />
                    ) : null}
                </MapContainer>
            </div>

            {hasPin ? (
                <p className="text-muted-foreground text-xs">
                    Pin em {value.latitude!.toFixed(5)},{" "}
                    {value.longitude!.toFixed(5)} — arraste para refinar.
                </p>
            ) : (
                <p className="text-muted-foreground text-xs">
                    Nenhum pin definido. Busque um endereço ou use
                    &quot;Minha localização&quot;.
                </p>
            )}
        </div>
    );
}
