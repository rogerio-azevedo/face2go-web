"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import "@/components/monitoring/monitoring-map-markers.css";

import mapboxgl from "mapbox-gl";
import { useEffect, useRef, useState } from "react";

import { useClientMapMarkers } from "@/hooks/use-client-map-markers";
import type { ClientMapPoint } from "@/types/client-map-point";
import type { PanicEventItem } from "@/types/panic-events";

const DEFAULT_CENTER: [number, number] = [-46.6333, -23.5505];

const STATUS_COLOR: Record<PanicEventItem["status"], string> = {
    open: "#DC2626",
    claimed: "#F59E0B",
    closed: "#6B7280",
};

type MonitoringMapProps = {
    events: PanicEventItem[];
    clients: ClientMapPoint[];
    selectedId: string | null;
    onSelect: (id: string) => void;
};

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
        if (!map) return;

        const currentIds = new Set(events.map((e) => e.id));

        markersRef.current.forEach((marker, id) => {
            if (!currentIds.has(id)) {
                marker.remove();
                markersRef.current.delete(id);
            }
        });

        for (const event of events) {
            const color = STATUS_COLOR[event.status];
            const el = document.createElement("button");
            el.type = "button";
            el.className = "monitoring-pin";
            el.style.width = selectedId === event.id ? "18px" : "14px";
            el.style.height = selectedId === event.id ? "18px" : "14px";
            el.style.borderRadius = "999px";
            el.style.border = "2px solid #fff";
            el.style.background = color;
            el.style.boxShadow = "0 0 0 2px " + color;
            el.title = event.requesterName;
            el.onclick = () => onSelect(event.id);

            const existing = markersRef.current.get(event.id);
            if (existing) {
                existing.setLngLat([
                    event.location.longitude,
                    event.location.latitude,
                ]);
                existing.getElement().replaceWith(el);
                existing.remove();
            }

            const marker = new mapboxgl.Marker({ element: el })
                .setLngLat([event.location.longitude, event.location.latitude])
                .addTo(map);
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
    }, [events, onSelect, selectedId]);

    if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
        return (
            <div className="bg-muted text-muted-foreground flex h-full items-center justify-center p-6 text-sm">
                Configure NEXT_PUBLIC_MAPBOX_TOKEN para exibir o mapa.
            </div>
        );
    }

    return <div ref={containerRef} className="h-full w-full" />;
}
