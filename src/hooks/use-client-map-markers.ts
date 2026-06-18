"use client";

import mapboxgl from "mapbox-gl";
import { useEffect, useRef } from "react";

import {
    CLIENT_TYPE_LABEL,
    type ClientMapPoint,
} from "@/types/client-map-point";

const BUILDING_ICON_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
    <path d="M9 22v-4h6v4"/>
    <path d="M8 6h.01"/>
    <path d="M16 6h.01"/>
    <path d="M12 6h.01"/>
    <path d="M12 10h.01"/>
    <path d="M12 14h.01"/>
    <path d="M16 10h.01"/>
    <path d="M16 14h.01"/>
    <path d="M8 10h.01"/>
    <path d="M8 14h.01"/>
  </svg>
`;

function escapeHtml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function bindPinInteractions(
    wrap: HTMLElement,
    onActivate: () => void,
): void {
    const btn = wrap.querySelector<HTMLButtonElement>(".monitoring-client-pin");
    if (!btn) return;

    const handleActivate = (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
        onActivate();
    };

    btn.replaceWith(btn.cloneNode(true));
    const freshBtn = wrap.querySelector<HTMLButtonElement>(".monitoring-client-pin");
    if (!freshBtn) return;

    freshBtn.addEventListener("click", handleActivate);
    freshBtn.addEventListener("mousedown", (event) => {
        event.stopPropagation();
    });
    freshBtn.addEventListener("touchstart", (event) => {
        event.stopPropagation();
    }, { passive: true });
}

function buildClientPinElement(
    client: ClientMapPoint,
    onActivate: () => void,
): HTMLDivElement {
    const wrap = document.createElement("div");
    wrap.className = "monitoring-client-pin-wrap";

    const pulse = document.createElement("div");
    pulse.className = "monitoring-client-pin-pulse";
    pulse.setAttribute("aria-hidden", "true");

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "monitoring-client-pin";
    btn.title = client.name;
    btn.setAttribute("aria-label", client.name);
    btn.innerHTML = BUILDING_ICON_SVG;

    wrap.appendChild(pulse);
    wrap.appendChild(btn);
    bindPinInteractions(wrap, onActivate);

    return wrap;
}

function buildClientPopupHtml(client: ClientMapPoint): string {
    const typeLabel = CLIENT_TYPE_LABEL[client.type];
    return `
      <div class="monitoring-client-popup-body">
        <div class="monitoring-client-popup-type">${escapeHtml(typeLabel)}</div>
        <div class="monitoring-client-popup-name">${escapeHtml(client.name)}</div>
      </div>
    `;
}

type UseClientMapMarkersOptions = {
    mapRef: React.RefObject<mapboxgl.Map | null>;
    clients: ClientMapPoint[];
    mapReady: boolean;
};

export function useClientMapMarkers({
    mapRef,
    clients,
    mapReady,
}: UseClientMapMarkersOptions) {
    const clientMarkersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
    const popupRef = useRef<mapboxgl.Popup | null>(null);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReady) return;

        const currentIds = new Set(clients.map((client) => client.id));

        clientMarkersRef.current.forEach((marker, id) => {
            if (!currentIds.has(id)) {
                marker.remove();
                clientMarkersRef.current.delete(id);
            }
        });

        for (const client of clients) {
            const openPopup = () => {
                popupRef.current?.remove();
                popupRef.current = new mapboxgl.Popup({
                    offset: 22,
                    closeButton: true,
                    closeOnClick: false,
                    className: "monitoring-client-popup",
                })
                    .setLngLat([client.longitude, client.latitude])
                    .setHTML(buildClientPopupHtml(client))
                    .addTo(map);
            };

            const existing = clientMarkersRef.current.get(client.id);
            if (existing) {
                existing.setLngLat([client.longitude, client.latitude]);
                const wrap = existing.getElement();
                const btn = wrap.querySelector<HTMLButtonElement>(
                    ".monitoring-client-pin",
                );
                if (btn) {
                    btn.title = client.name;
                    btn.setAttribute("aria-label", client.name);
                }
                bindPinInteractions(wrap, openPopup);
                continue;
            }

            const el = buildClientPinElement(client, openPopup);

            const marker = new mapboxgl.Marker({
                element: el,
                anchor: "center",
            })
                .setLngLat([client.longitude, client.latitude])
                .addTo(map);

            marker.getElement().style.pointerEvents = "auto";
            clientMarkersRef.current.set(client.id, marker);
        }

        return () => {
            popupRef.current?.remove();
            popupRef.current = null;
            clientMarkersRef.current.forEach((marker) => marker.remove());
            clientMarkersRef.current.clear();
        };
    }, [clients, mapReady, mapRef]);
}
