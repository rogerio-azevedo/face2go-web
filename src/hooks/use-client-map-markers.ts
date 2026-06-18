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

function closeAllClientTooltips(markers: Map<string, mapboxgl.Marker>): void {
    markers.forEach((marker) => {
        marker.getElement().classList.remove("is-active");
    });
}

function openClientTooltip(
    markers: Map<string, mapboxgl.Marker>,
    wrap: HTMLElement,
): void {
    closeAllClientTooltips(markers);
    wrap.classList.add("is-active");
}

function bindPinInteractions(
    wrap: HTMLElement,
    markers: Map<string, mapboxgl.Marker>,
): void {
    const btn = wrap.querySelector<HTMLButtonElement>(".monitoring-client-pin");
    const closeBtn = wrap.querySelector<HTMLButtonElement>(
        ".monitoring-client-tooltip-close",
    );
    if (!btn) return;

    const handleActivate = (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
        openClientTooltip(markers, wrap);
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

    if (closeBtn) {
        closeBtn.replaceWith(closeBtn.cloneNode(true));
        const freshCloseBtn = wrap.querySelector<HTMLButtonElement>(
            ".monitoring-client-tooltip-close",
        );
        freshCloseBtn?.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            wrap.classList.remove("is-active");
        });
    }
}

function buildClientTooltipHtml(client: ClientMapPoint): string {
    const typeLabel = CLIENT_TYPE_LABEL[client.type];
    return `
      <div class="monitoring-client-tooltip-body">
        <div class="monitoring-client-tooltip-type">${escapeHtml(typeLabel)}</div>
        <div class="monitoring-client-tooltip-name">${escapeHtml(client.name)}</div>
      </div>
      <button
        type="button"
        class="monitoring-client-tooltip-close"
        aria-label="Fechar"
      >&times;</button>
    `;
}

function buildClientPinElement(client: ClientMapPoint): HTMLDivElement {
    const wrap = document.createElement("div");
    wrap.className = "monitoring-client-pin-wrap";

    const tooltip = document.createElement("div");
    tooltip.className = "monitoring-client-tooltip";
    tooltip.innerHTML = buildClientTooltipHtml(client);

    const pulse = document.createElement("div");
    pulse.className = "monitoring-client-pin-pulse";
    pulse.setAttribute("aria-hidden", "true");

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "monitoring-client-pin";
    btn.title = client.name;
    btn.setAttribute("aria-label", client.name);
    btn.innerHTML = BUILDING_ICON_SVG;

    wrap.appendChild(tooltip);
    wrap.appendChild(pulse);
    wrap.appendChild(btn);

    return wrap;
}

function updateClientPinElement(
    wrap: HTMLElement,
    client: ClientMapPoint,
): void {
    const tooltip = wrap.querySelector(".monitoring-client-tooltip");
    if (tooltip) {
        tooltip.innerHTML = buildClientTooltipHtml(client);
    }

    const btn = wrap.querySelector<HTMLButtonElement>(".monitoring-client-pin");
    if (btn) {
        btn.title = client.name;
        btn.setAttribute("aria-label", client.name);
    }
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

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReady) return;

        const handleMapClick = () => {
            closeAllClientTooltips(clientMarkersRef.current);
        };

        map.on("click", handleMapClick);

        const currentIds = new Set(clients.map((client) => client.id));

        clientMarkersRef.current.forEach((marker, id) => {
            if (!currentIds.has(id)) {
                marker.remove();
                clientMarkersRef.current.delete(id);
            }
        });

        for (const client of clients) {
            const existing = clientMarkersRef.current.get(client.id);
            if (existing) {
                existing.setLngLat([client.longitude, client.latitude]);

                const wrap = existing.getElement();
                updateClientPinElement(wrap, client);
                bindPinInteractions(wrap, clientMarkersRef.current);
                continue;
            }

            const wrap = buildClientPinElement(client);
            const marker = new mapboxgl.Marker({
                element: wrap,
                anchor: "center",
            })
                .setLngLat([client.longitude, client.latitude])
                .addTo(map);

            marker.getElement().style.pointerEvents = "auto";
            bindPinInteractions(wrap, clientMarkersRef.current);
            clientMarkersRef.current.set(client.id, marker);
        }

        return () => {
            map.off("click", handleMapClick);
            clientMarkersRef.current.forEach((marker) => marker.remove());
            clientMarkersRef.current.clear();
        };
    }, [clients, mapReady, mapRef]);
}
