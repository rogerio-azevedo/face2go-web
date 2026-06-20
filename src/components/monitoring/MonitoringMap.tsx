"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import "@/components/monitoring/monitoring-map-markers.css";

import mapboxgl from "mapbox-gl";
import { useEffect, useRef, useState } from "react";

import { useClientMapMarkers } from "@/hooks/use-client-map-markers";
import type { ClientMapPoint } from "@/types/client-map-point";
import type { PanicEventItem } from "@/types/panic-events";

const DEFAULT_CENTER: [number, number] = [-46.6333, -23.5505];

const PANIC_SOS_ICON_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
`;

type MonitoringMapProps = {
    events: PanicEventItem[];
    clients: ClientMapPoint[];
    selectedId: string | null;
    onSelect: (id: string) => void;
};

function buildPanicPinElement(
    event: PanicEventItem,
    selected: boolean,
    onSelect: (id: string) => void,
): HTMLDivElement {
    const wrap = document.createElement("div");
    wrap.className = `monitoring-panic-pin-wrap monitoring-panic-pin-wrap--${event.status}`;
    if (selected) {
        wrap.classList.add("is-selected");
    }

    const pulse = document.createElement("div");
    pulse.className = "monitoring-panic-pin-pulse";
    pulse.setAttribute("aria-hidden", "true");

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "monitoring-panic-pin";
    btn.title = `${event.requesterName} — pedido de socorro`;
    btn.setAttribute("aria-label", `Pedido de socorro: ${event.requesterName}`);
    btn.innerHTML = PANIC_SOS_ICON_SVG;
    btn.onclick = () => onSelect(event.id);

    wrap.appendChild(pulse);
    wrap.appendChild(btn);

    return wrap;
}

function updatePanicPinElement(
    wrap: HTMLDivElement,
    event: PanicEventItem,
    selected: boolean,
    onSelect: (id: string) => void,
): void {
    wrap.className = `monitoring-panic-pin-wrap monitoring-panic-pin-wrap--${event.status}`;
    if (selected) {
        wrap.classList.add("is-selected");
    }

    const btn = wrap.querySelector<HTMLButtonElement>(".monitoring-panic-pin");
    if (btn) {
        btn.title = `${event.requesterName} — pedido de socorro`;
        btn.setAttribute(
            "aria-label",
            `Pedido de socorro: ${event.requesterName}`,
        );
        btn.onclick = () => onSelect(event.id);
    }
}

export function MonitoringMap({
    events,
    clients,
    selectedId,
    onSelect,
}: MonitoringMapProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
    const [mapReady, setMapReady] = useState(false);

    useClientMapMarkers({ mapRef, clients, mapReady });

    useEffect(() => {
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (!token || !containerRef.current || mapRef.current) return;

        mapboxgl.accessToken = token;
        const map = new mapboxgl.Map({
            container: containerRef.current,
            style: "mapbox://styles/mapbox/streets-v12",
            center: DEFAULT_CENTER,
            zoom: 11,
        });
        map.addControl(new mapboxgl.NavigationControl(), "top-right");
        map.addControl(
            new mapboxgl.GeolocateControl({
                positionOptions: {
                    enableHighAccuracy: true,
                    timeout: 10_000,
                    maximumAge: 60_000,
                },
                trackUserLocation: false,
                showUserHeading: false,
            }),
            "top-right",
        );
        mapRef.current = map;
        setMapReady(true);

        map.on("load", () => {
            if (!navigator.geolocation) return;

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    map.flyTo({
                        center: [
                            position.coords.longitude,
                            position.coords.latitude,
                        ],
                        zoom: 12,
                        essential: true,
                    });
                },
                () => {
                    /* mantém o centro padrão se o usuário negar ou falhar */
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10_000,
                    maximumAge: 60_000,
                },
            );
        });

        return () => {
            setMapReady(false);
            markersRef.current.forEach((marker) => marker.remove());
            markersRef.current.clear();
            map.remove();
            mapRef.current = null;
        };
    }, []);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReady) return;

        const currentIds = new Set(events.map((e) => e.id));

        markersRef.current.forEach((marker, id) => {
            if (!currentIds.has(id)) {
                marker.remove();
                markersRef.current.delete(id);
            }
        });

        for (const event of events) {
            const lngLat: [number, number] = [
                event.location.longitude,
                event.location.latitude,
            ];
            const existing = markersRef.current.get(event.id);

            if (existing) {
                existing.setLngLat(lngLat);
                const wrap = existing.getElement();
                if (wrap instanceof HTMLDivElement) {
                    updatePanicPinElement(
                        wrap,
                        event,
                        selectedId === event.id,
                        onSelect,
                    );
                }
                continue;
            }

            const wrap = buildPanicPinElement(
                event,
                selectedId === event.id,
                onSelect,
            );
            const marker = new mapboxgl.Marker({
                element: wrap,
                anchor: "center",
            })
                .setLngLat(lngLat)
                .addTo(map);
            marker.getElement().style.pointerEvents = "auto";
            markersRef.current.set(event.id, marker);
        }

        if (selectedId) {
            const selected = events.find((e) => e.id === selectedId);
            if (selected) {
                map.flyTo({
                    center: [
                        selected.location.longitude,
                        selected.location.latitude,
                    ],
                    zoom: 15,
                    essential: true,
                });
            }
        }
    }, [events, mapReady, onSelect, selectedId]);

    if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
        return (
            <div className="bg-muted text-muted-foreground flex h-full items-center justify-center p-6 text-sm">
                Configure NEXT_PUBLIC_MAPBOX_TOKEN para exibir o mapa.
            </div>
        );
    }

    return <div ref={containerRef} className="h-full w-full" />;
};
