import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon   from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });

interface RouteMapProps {
  startCoords: [number, number] | null;
  endCoords:   [number, number] | null;
  eventType?:  string;
  routes?:     any[];
  activeRouteIdx?: number;
}

// ── Traffic colour helper ──────────────────────────────────────
function trafficColor(speedKph: number | null): string | null {
  if (speedKph === null) return null;
  if (speedKph < 15)  return '#ef4444';  // heavy — red
  if (speedKph < 35)  return '#f97316';  // moderate — orange
  return null;                            // free flow — keep blue
}

// ── Component ──────────────────────────────────────────────────
export function RouteMap({ startCoords, endCoords, eventType, routes: propsRoutes, activeRouteIdx: propsActiveIdx }: RouteMapProps) {
  const mapRef       = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const layersRef    = useRef<L.Layer[]>([]);
  const [activeRoute, setActive]  = useState(propsActiveIdx || 0);
  // FIX: trafficOn state — controls whether we use Google Traffic tiles or plain OSM
  const [trafficOn, setTrafficOn] = useState(true);

  useEffect(() => {
    if (propsActiveIdx !== undefined) {
      setActive(propsActiveIdx);
    }
  }, [propsActiveIdx]);

  // ── Initialise map once ─────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    mapRef.current = L.map(containerRef.current, { zoomControl: true }).setView(
      [30.316, 78.032], 12
    );
    // FIX: Call addTileLayer with initial trafficOn=true
    addTileLayer(true);
  }, []);

  // ── Switch tile layers ──────────────────────────────────────
  // FIX: Corrected Google Traffic tile URL to use proper subdomain format
  function addTileLayer(traffic: boolean) {
    if (!mapRef.current) return;
    // Remove all existing tile layers
    mapRef.current.eachLayer(l => {
      if ((l as any)._isTile) mapRef.current!.removeLayer(l);
    });

    let tile: L.TileLayer;

    if (traffic) {
      // FIX: Use correct Google Maps traffic tile URL with mt0-mt3 subdomains
      tile = L.tileLayer(
        'https://{s}.google.com/vt/lyrs=m,traffic&x={x}&y={y}&z={z}',
        {
          attribution: '© Google Maps Traffic',
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
          maxZoom: 20,
        }
      );
    } else {
      tile = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '© OpenStreetMap contributors',
          subdomains: ['a', 'b', 'c'],
          maxZoom: 19,
        }
      );
    }

    (tile as any)._isTile = true;
    tile.addTo(mapRef.current);
  }

  // FIX: Re-add tile layer whenever trafficOn toggles
  useEffect(() => {
    addTileLayer(trafficOn);
  }, [trafficOn]);

  // ── Draw routes when coords or routes change ─────────────────
  useEffect(() => {
    if (!startCoords || !endCoords || !mapRef.current) return;

    clearLayers();

    const startIcon = L.divIcon({
      className: '',
      html: `<div style="width:14px;height:14px;background:#059669;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
      iconAnchor: [7, 7],
    });
    const endIcon = L.divIcon({
      className: '',
      html: `<div style="width:14px;height:14px;background:#dc2626;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
      iconAnchor: [7, 7],
    });

    addLayer(L.marker(startCoords, { icon: startIcon }).bindPopup('🚦 Start'));
    addLayer(L.marker(endCoords,   { icon: endIcon   }).bindPopup('🏁 End'));

    if (propsRoutes && propsRoutes.length > 0) {
      drawRoutes(propsRoutes, activeRoute);
      
      const currentRoute = propsRoutes[activeRoute];
      if (currentRoute && currentRoute.geometry) {
        const latlngs = currentRoute.geometry.map((c: any) => [c[0], c[1]] as [number, number]);
        mapRef.current!.fitBounds(L.latLngBounds(latlngs), { padding: [40, 40] });
      }
    } else {
      const line = L.polyline([startCoords, endCoords], {
        color: '#3b82f6', weight: 4, opacity: 0.8, dashArray: '10 6'
      });
      addLayer(line);
      mapRef.current!.fitBounds(line.getBounds(), { padding: [40, 40] });
    }
  }, [startCoords, endCoords, propsRoutes, activeRoute]);

  // ── Draw routes helper ──────────────────────────────────────
  function drawRoutes(rts: any[], active: number) {
    rts.forEach((route, idx) => {
      if (!route.geometry) return;
      const latlngs = route.geometry.map((c: any) => [c[0], c[1]] as L.LatLngExpression);

      if (idx !== active) {
        const alt = L.polyline(latlngs, {
          color: '#94a3b8', weight: 4, opacity: 0.6,
          dashArray: '10 10',
        });
        alt.bindTooltip(
          `<div style="font-weight:800; color:#1e293b;">ALTERNATE ${idx}</div><div>${route.distance} · ${route.duration}</div>`,
          { sticky: true, className: 'tactical-tooltip' }
        );
        addLayer(alt);
      } else {
        const main = L.polyline(latlngs, {
          color: '#3b82f6', weight: 8, opacity: 0.9,
        });
        main.bindTooltip(
          `<div style="font-weight:900; color:#1e40af;">PRIMARY MISSION PATH</div><div>${route.distance} · ${route.duration}</div>`,
          { sticky: true, className: 'tactical-tooltip active' }
        );
        addLayer(main);

        // FIX: Traffic overlay — only render when trafficOn is true
        if (trafficOn) {
          for (let i = 0; i < latlngs.length - 1; i += 8) {
            const simulatedSpeed = 10 + Math.random() * 60;
            const col = trafficColor(simulatedSpeed);
            if (col) {
              const seg = L.polyline(
                [latlngs[i], latlngs[i + 1]],
                { color: col, weight: 8, opacity: 0.8 }
              );
              seg.bindTooltip(`🚗 Heavy traffic — ~${Math.round(simulatedSpeed)} km/h`, { sticky: true });
              addLayer(seg);
            }
          }
        }
      }
    });
  }

  function addLayer(l: L.Layer) {
    if (!mapRef.current) return;
    l.addTo(mapRef.current);
    layersRef.current.push(l);
  }
  function clearLayers() {
    layersRef.current.forEach(l => mapRef.current?.removeLayer(l));
    layersRef.current = [];
  }

  return (
    <div style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
      {/* ── Legend & Controls ── */}
      <div style={{
        display: 'flex', gap: '16px', padding: '10px 16px',
        background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        fontSize: '0.75rem', color: '#cbd5e1',
        alignItems: 'center', flexWrap: 'wrap'
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ display: 'inline-block', width: '20px', height: '4px', background: '#2563eb', borderRadius: '2px' }} />
          Primary
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ display: 'inline-block', width: '20px', height: '4px', background: '#94a3b8', borderRadius: '2px', borderTop: '2px dashed #94a3b8' }} />
          Alternate
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ display: 'inline-block', width: '20px', height: '4px', background: '#f97316', borderRadius: '2px' }} />
          Heavy traffic
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ display: 'inline-block', width: '20px', height: '4px', background: '#ef4444', borderRadius: '2px' }} />
          Congested
        </span>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* FIX: Traffic toggle button — clear label showing current state */}
          <button
            onClick={() => setTrafficOn(v => !v)}
            style={{
              padding: '3px 10px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800,
              border: `1px solid ${trafficOn ? '#f97316' : 'rgba(255,255,255,0.15)'}`,
              cursor: 'pointer',
              background: trafficOn ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.06)',
              color: trafficOn ? '#f97316' : '#94a3b8',
              transition: 'all 0.2s',
            }}
          >
            {trafficOn ? '🟠 TRAFFIC ON' : '⚪ TRAFFIC OFF'}
          </button>
        </div>
      </div>

      {/* ── Map Container ── */}
      <div ref={containerRef} style={{ height: '400px', width: '100%' }} />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
