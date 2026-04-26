import { useState, useEffect, useCallback } from 'react';
import { Radio, AlertTriangle, CheckCircle, Navigation } from 'lucide-react';
import {
  MapContainer, TileLayer, Marker, Popup,
  Polyline, useMap, ZoomControl
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { routeAPI, eventAPI } from '../../utils/api';
import { useGeolocation } from '../../hooks/useGeolocation';
import '../styles/live-tracking.css';

// ── Fix Leaflet marker icons (Vite asset issue) ──────────────
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const AssetIcon = L.divIcon({
  className: 'asset-marker',
  html: `<div style="
    width:16px;height:16px;
    background:#10b981;
    border:3px solid white;
    border-radius:50%;
    box-shadow:0 0 0 3px rgba(16,185,129,0.35), 0 2px 8px rgba(0,0,0,0.3);
    animation: liveping 1.4s ease-in-out infinite;
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// ── Types ────────────────────────────────────────────────────
interface AltRoute {
  geometry: [number, number][];
  distance: string;
  duration: number;
}

interface EventRoute {
  id: number;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  startCoords: [number, number];
  endCoords: [number, number];
  geometry: [number, number][];
  alternatives: AltRoute[];
  activeRouteIdx: number;
  color: string;
  clashing: boolean;
  /** BUG FIX 1: status derived from real time, not stale DB value */
  status: 'live' | 'upcoming' | 'completed';
}

const EVENT_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];

// ── BUG FIX 1: Compute live status from actual clock ─────────
// The original code called eventAPI.getLiveStatus() but that
// returned the stale DB value. This function always uses NOW.
function computeStatus(event: {
  date: string; startTime: string; endTime?: string;
}): 'live' | 'upcoming' | 'completed' {
  const nowUtc = new Date();
  const now = new Date(nowUtc.getTime() + (5.5 * 60 * 60 * 1000)); // IST
  
  const [y, mo, d] = event.date.split('-').map(Number);
  const [sh, sm]   = event.startTime.split(':').map(Number);
  const [eh, em]   = (event.endTime ?? '23:59').split(':').map(Number);

  const start = new Date(y, mo - 1, d, sh, sm);
  const end   = new Date(y, mo - 1, d, eh, em);

  if (now >= start && now <= end) return 'live';
  if (now > end)                  return 'completed';
  return 'upcoming';
}

// ── BUG FIX 2: Clash detection by time overlap, not just
//    exact startTime equality (original used ===)  ────────────
function timesOverlap(a: EventRoute, b: EventRoute): boolean {
  if (a.date !== b.date) return false;
  const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const aStart = toMin(a.startTime), aEnd = toMin(a.endTime);
  const bStart = toMin(b.startTime), bEnd = toMin(b.endTime);
  return aStart < bEnd && aEnd > bStart;
}

// ── FitBounds helper ─────────────────────────────────────────
function FitBounds({ routes }: { routes: EventRoute[] }) {
  const map = useMap();
  useEffect(() => {
    if (routes.length === 0) return;
    const bounds = L.latLngBounds([]);
    routes.forEach(r => {
      bounds.extend(r.startCoords);
      bounds.extend(r.endCoords);
      r.geometry.forEach(c => bounds.extend(c));
    });
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], animate: true });
    }
  }, [routes, map]);
  return null;
}

// ── BUG FIX 3: LiveMarker — only animates for 'live' events.
//    Original had broken height typo "120x" and no guard when
//    geometry is empty.  ────────────────────────────────────────
function LiveMarker({
  route, onSwap
}: { route: EventRoute; onSwap: () => void }) {
  const [posIdx, setPosIdx] = useState(0);

  useEffect(() => {
    if (route.status !== 'live') return;
    const geo = route.geometry;
    if (!geo || geo.length === 0) return;

    setPosIdx(0);
    const id = setInterval(() => {
      setPosIdx(prev => (prev + 1 < geo.length ? prev + 1 : 0));
    }, 1800);
    return () => clearInterval(id);
  }, [route.status, route.geometry]);

  // Don't render dot for non-live events
  if (route.status !== 'live') return null;
  const geo = route.geometry;
  if (!geo || geo.length === 0) return null;

  const pos = geo[posIdx] ?? route.startCoords;

  return (
    <Marker position={pos} icon={AssetIcon}>
      <Popup>
        <div style={{ padding: '6px', minWidth: '150px' }}>
          <strong style={{ fontSize: '0.9rem' }}>{route.name}</strong>
          <br />
          <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 700 }}>
            🔴 LIVE — tracking active
          </span>
          {route.clashing && (
            <button
              onClick={onSwap}
              style={{
                width: '100%', background: '#ef4444', color: 'white',
                border: 'none', padding: '7px', borderRadius: '6px',
                fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer',
                marginTop: '8px',
              }}
            >
              ⚡ USE SAFE PATH
            </button>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

// ── Status badge UI ───────────────────────────────────────────
function StatusBadge({ status }: { status: EventRoute['status'] }) {
  const cfg = {
    live:      { bg: '#dcfce7', color: '#16a34a', label: '● LIVE',     dot: '#16a34a' },
    upcoming:  { bg: '#eff6ff', color: '#2563eb', label: '◷ UPCOMING', dot: '#2563eb' },
    completed: { bg: '#f1f5f9', color: '#64748b', label: '✓ DONE',     dot: '#64748b' },
  }[status];
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      fontSize: '0.65rem', fontWeight: 800,
      padding: '3px 9px', borderRadius: '999px',
      letterSpacing: '0.05em',
    }}>
      {cfg.label}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────
export function LiveTracking({
  selectedEvent,
  allEvents = [],
  viewType = 'single',
}: {
  selectedEvent?: any;
  allEvents?: any[];
  viewType?: 'single' | 'all';
}) {
  const { latitude, longitude } = useGeolocation();
  const [eventRoutes, setEventRoutes]   = useState<EventRoute[]>([]);
  const [clashPairs, setClashPairs]     = useState<string[]>([]);   // clash messages
  const [showAllAlts, setShowAllAlts]   = useState(false);
  const [loading, setLoading]           = useState(false);
  const [tick, setTick]                 = useState(0);              // BUG FIX 4: 60s refresh

  // ── BUG FIX 4: Re-evaluate statuses every 60 seconds ────────
  useEffect(() => {
    const id = setInterval(() => setTick(n => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  // Re-derive statuses on each tick without re-fetching routes
  useEffect(() => {
    setEventRoutes(prev =>
      prev.map(r => ({ ...r, status: computeStatus(r) }))
    );
  }, [tick]);

  // ── Fetch routes ─────────────────────────────────────────────
  const fetchAllRoutes = useCallback(async () => {
    const eventsToFetch =
      viewType === 'all'
        ? allEvents
        : selectedEvent
          ? [selectedEvent]
          : [];

    if (eventsToFetch.length === 0) return;
    setLoading(true);

    const routes: EventRoute[] = [];

    for (let i = 0; i < eventsToFetch.length; i++) {
      const event = eventsToFetch[i];
      if (!event.startLocation && !event.startCoords) continue;

      try {
        const start: [number, number] =
          event.startCoords ?? (await routeAPI.geocodeLocation(event.startLocation));
        const end: [number, number] =
          event.endCoords   ?? (await routeAPI.geocodeLocation(event.endLocation));

        if (!start || !end) continue;

        const altData = await routeAPI.getOSRMAlternatives(start, end);
        if (!altData.routes?.length) continue;

        // BUG FIX 1: use computeStatus, not DB value
        const status = computeStatus(event);

        routes.push({
          id:             event.id,
          name:           event.name,
          date:           event.date,
          startTime:      event.startTime,
          endTime:        event.endTime ?? '23:59',
          startCoords:    start,
          endCoords:      end,
          geometry:       altData.routes[0].geometry,
          alternatives:   altData.routes,
          activeRouteIdx: 0,
          color:          EVENT_COLORS[i % EVENT_COLORS.length],
          clashing:       false,
          status,
        });
      } catch (err) {
        console.error(`Route fetch error for event ${event.id}:`, err);
      }
    }

    // ── BUG FIX 2: proper overlap clash detection ────────────
    const clashingIds = new Set<number>();
    const messages: string[] = [];

    for (let i = 0; i < routes.length; i++) {
      for (let j = i + 1; j < routes.length; j++) {
        if (timesOverlap(routes[i], routes[j])) {
          clashingIds.add(routes[i].id);
          clashingIds.add(routes[j].id);
          messages.push(
            `⚠️ "${routes[i].name}" clashes with "${routes[j].name}"`
          );
        }
      }
    }

    setClashPairs(messages);
    setEventRoutes(routes.map(r => ({ ...r, clashing: clashingIds.has(r.id) })));
    setLoading(false);
  }, [selectedEvent, allEvents, viewType]);

  useEffect(() => { fetchAllRoutes(); }, [fetchAllRoutes]);

  // ── Route swap handler ───────────────────────────────────────
  const handleAltChange = (eventId: number, idx: number) => {
    setEventRoutes(prev =>
      prev.map(r =>
        r.id === eventId
          ? { ...r, activeRouteIdx: idx, geometry: r.alternatives[idx]?.geometry ?? r.geometry }
          : r
      )
    );
  };

  // BUG FIX: for single-view, swap always applies to first route
  const handleSingleAltChange = (idx: number) => {
    if (eventRoutes.length === 0) return;
    handleAltChange(eventRoutes[0].id, idx);
  };

  const primaryRoute = eventRoutes[0];
  const hasClash     = clashPairs.length > 0;

  // ── User location icon ───────────────────────────────────────
  const userIcon = L.divIcon({
    className: '',
    html: `<div style="
      width:13px;height:13px;
      background:#3b82f6;
      border:3px solid white;
      border-radius:50%;
      box-shadow:0 0 0 4px rgba(59,130,246,0.25);
    "></div>`,
    iconAnchor: [7, 7],
  });

  return (
    <div className="live-tracking-container">
      {/* ── Banner ── */}
      <div className="tracking-banner" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div className="banner-content" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Radio size={18} style={{ animation: 'pulse 1.5s infinite' }} />
          <span className="banner-text" style={{ fontWeight: 700 }}>
            {viewType === 'all'
              ? `Fleet View — ${eventRoutes.length} route${eventRoutes.length !== 1 ? 's' : ''}`
              : `Tracking: ${selectedEvent?.name ?? 'No event selected'}`}
          </span>
          {loading && (
            <span style={{ fontSize: '0.72rem', opacity: 0.7, fontStyle: 'italic' }}>
              Fetching routes…
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Clash indicator */}
          {hasClash
            ? <span style={{ display:'flex', alignItems:'center', gap:'5px', background:'#fee2e2', color:'#dc2626', fontSize:'0.7rem', fontWeight:800, padding:'4px 10px', borderRadius:'8px' }}>
                <AlertTriangle size={12} /> CLASH
              </span>
            : <span style={{ display:'flex', alignItems:'center', gap:'5px', background:'#dcfce7', color:'#16a34a', fontSize:'0.7rem', fontWeight:800, padding:'4px 10px', borderRadius:'8px' }}>
                <CheckCircle size={12} /> CLEAR
              </span>
          }
          <button
            onClick={() => setShowAllAlts(v => !v)}
            style={{
              background: showAllAlts ? '#3b82f6' : 'rgba(255,255,255,0.12)',
              border: 'none', color: 'white',
              padding: '5px 12px', borderRadius: '7px',
              fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
            }}
          >
            {showAllAlts ? 'Hide Alts' : 'Show Alts'}
          </button>
        </div>
      </div>

      {/* ── Clash messages ── */}
      {hasClash && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: '10px', padding: '10px 16px',
          margin: '8px 0', display: 'flex', flexDirection: 'column', gap: '4px',
        }}>
          {clashPairs.map((msg, i) => (
            <div key={i} style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: 600 }}>
              {msg}
            </div>
          ))}
        </div>
      )}

      {/* ── Map ── */}
      <div style={{
        height: '500px', borderRadius: '16px',
        overflow: 'hidden', border: '1px solid #eff6ff',
        position: 'relative',
      }}>
        <MapContainer
          center={[30.3165, 78.0322]}
          zoom={13}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution="© OpenStreetMap contributors"
          />
          <ZoomControl position="bottomright" />

          {/* User location */}
          {latitude && longitude && (
            <Marker position={[latitude, longitude]} icon={userIcon}>
              <Popup>📍 Your Location</Popup>
            </Marker>
          )}

          {eventRoutes.map((route) => {
            const isSelected  = selectedEvent?.id === route.id || viewType === 'all';
            const showPath    = isSelected || showAllAlts;
            const routeColor  = route.clashing && route.activeRouteIdx === 0
              ? '#ef4444'    // red if clashing on primary
              : route.color; // per-event colour

            return (
              <div key={route.id}>
                {/* Start marker */}
                <Marker position={route.startCoords}>
                  <Popup>
                    <div style={{ padding: '8px', minWidth: '190px' }}>
                      <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '0.95rem' }}>
                        {route.name}
                      </div>
                      <div style={{ marginTop: '4px', marginBottom: '10px' }}>
                        <StatusBadge status={route.status} />
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '8px' }}>
                        📅 {route.date} &nbsp; ⏱ {route.startTime}–{route.endTime}
                      </div>

                      {/* Alt buttons in popup */}
                      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#1e40af', textTransform: 'uppercase', marginBottom: '6px' }}>
                          Route options
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          {route.alternatives.map((alt, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleAltChange(route.id, idx)}
                              style={{
                                display: 'flex', justifyContent: 'space-between',
                                padding: '7px 10px', borderRadius: '8px', border: '1px solid',
                                borderColor: route.activeRouteIdx === idx ? '#3b82f6' : '#e2e8f0',
                                background: route.activeRouteIdx === idx ? '#eff6ff' : '#f8fafc',
                                color: route.activeRouteIdx === idx ? '#1d4ed8' : '#64748b',
                                fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                              }}
                            >
                              <span>{idx === 0 ? 'Primary' : `Alt ${idx}`}</span>
                              <span style={{ opacity: 0.7 }}>{alt.distance}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {route.clashing && route.activeRouteIdx === 0 && (
                        <button
                          onClick={() => handleAltChange(route.id, 1)}
                          style={{
                            width: '100%', background: 'linear-gradient(135deg,#ef4444,#be123c)',
                            color: 'white', border: 'none', padding: '10px',
                            borderRadius: '8px', fontSize: '0.72rem', fontWeight: 800,
                            cursor: 'pointer', marginTop: '10px',
                          }}
                        >
                          ⚡ DEPLOY SAFE ROUTE
                        </button>
                      )}
                    </div>
                  </Popup>
                </Marker>

                {/* End marker */}
                <Marker position={route.endCoords}>
                  <Popup>
                    <div style={{ padding: '4px' }}>
                      <strong>{route.name}</strong><br />
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>🏁 Destination</span>
                    </div>
                  </Popup>
                </Marker>

                {/* Primary / active route polyline */}
                {showPath && (
                  <Polyline
                    key={`route-${route.id}-${route.activeRouteIdx}`}
                    positions={route.geometry}
                    color={routeColor}
                    weight={6}
                    opacity={0.88}
                    dashArray={route.activeRouteIdx > 0 ? '10,8' : undefined}
                  />
                )}

                {/* Alternate polylines when toggled */}
                {showAllAlts && isSelected &&
                  route.alternatives.map((alt, aidx) =>
                    aidx !== route.activeRouteIdx ? (
                      <Polyline
                        key={`alt-${route.id}-${aidx}`}
                        positions={alt.geometry}
                        color="#94a3b8"
                        weight={3}
                        opacity={0.5}
                        dashArray="6,10"
                      />
                    ) : null
                  )
                }

                {/* Animated live dot — only for live events */}
                <LiveMarker
                  route={route}
                  onSwap={() => handleAltChange(route.id, 1)}
                />
              </div>
            );
          })}

          <FitBounds routes={eventRoutes} />
        </MapContainer>

        {/* ── Alt-route overlay panel ── */}
        {primaryRoute?.alternatives?.length > 0 && (
          <div style={{
            position: 'absolute', bottom: '24px', left: '16px',
            zIndex: 1000, background: 'rgba(255,255,255,0.93)',
            backdropFilter: 'blur(12px)', padding: '16px',
            borderRadius: '18px', width: '250px',
            boxShadow: '0 12px 32px rgba(30,64,175,0.12)',
            border: '1px solid rgba(59,130,246,0.12)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Routes
              </span>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <StatusBadge status={primaryRoute.status} />
                {primaryRoute.clashing && (
                  <span style={{ background: '#fff1f2', color: '#be123c', fontSize: '0.6rem', fontWeight: 900, padding: '2px 6px', borderRadius: '4px' }}>
                    CLASH
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {primaryRoute.alternatives.map((alt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSingleAltChange(idx)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: '10px', border: '2px solid',
                    borderColor: primaryRoute.activeRouteIdx === idx ? '#3b82f6' : 'transparent',
                    background: primaryRoute.activeRouteIdx === idx ? '#eff6ff' : '#f8fafc',
                    color: primaryRoute.activeRouteIdx === idx ? '#1e40af' : '#64748b',
                    fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '9px', height: '9px', borderRadius: '50%',
                      background: primaryRoute.activeRouteIdx === idx ? '#3b82f6' : '#cbd5e1',
                      boxShadow: primaryRoute.activeRouteIdx === idx ? '0 0 6px #3b82f6' : 'none',
                    }} />
                    {idx === 0 ? 'Optimal Path' : `Tactical ${idx}`}
                  </div>
                  <span style={{ fontSize: '0.68rem', opacity: 0.75 }}>{alt.distance}</span>
                </button>
              ))}
            </div>

            {primaryRoute.clashing && primaryRoute.activeRouteIdx === 0 && (
              <button
                onClick={() => handleSingleAltChange(1)}
                style={{
                  width: '100%', background: 'linear-gradient(135deg,#1e40af,#3b82f6)',
                  color: 'white', border: 'none', padding: '11px',
                  borderRadius: '10px', fontSize: '0.78rem', fontWeight: 900,
                  cursor: 'pointer', marginTop: '14px',
                  boxShadow: '0 8px 20px -4px rgba(59,130,246,0.4)',
                  letterSpacing: '0.5px', textTransform: 'uppercase',
                }}
              >
                ⚡ Execute Safe Swap
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Info bar ── */}
      <div className="route-info" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div className="info-item">
          <span className="info-label">Monitoring</span>
          <span className="info-value">
            {viewType === 'all'
              ? `${eventRoutes.length} route${eventRoutes.length !== 1 ? 's' : ''}`
              : (selectedEvent?.name ?? 'None')}
          </span>
        </div>
        <span className="info-divider">|</span>
        <div className="info-item">
          <span className="info-label">Live</span>
          <span className="info-value" style={{ color: '#10b981' }}>
            {eventRoutes.filter(r => r.status === 'live').length}
          </span>
        </div>
        <span className="info-divider">|</span>
        <div className="info-item">
          <span className="info-label">Upcoming</span>
          <span className="info-value" style={{ color: '#2563eb' }}>
            {eventRoutes.filter(r => r.status === 'upcoming').length}
          </span>
        </div>
        <span className="info-divider">|</span>
        <div className="info-item">
          <span className="info-label">Status</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="info-value" style={{ color: hasClash ? '#dc2626' : '#10b981' }}>
              {hasClash ? 'CONGESTION THREAT' : 'SECTOR CLEAR'}
            </span>
            {hasClash && primaryRoute?.alternatives?.length > 1 && (
              <button
                onClick={() => handleSingleAltChange(1)}
                style={{
                  background: '#be123c', color: 'white', border: 'none',
                  padding: '5px 12px', borderRadius: '6px',
                  fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer',
                }}
              >
                DIVERT NOW
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Upcoming events list (NEW) ── */}
      {eventRoutes.some(r => r.status === 'upcoming') && (
        <div style={{ marginTop: '12px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
            Upcoming Events
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {eventRoutes
              .filter(r => r.status === 'upcoming')
              .map(r => (
                <div key={r.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: '#f8fafc', border: '1px solid #e2e8f0',
                  borderRadius: '10px', padding: '10px 14px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Navigation size={14} style={{ color: r.color }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>{r.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        {r.date} · {r.startTime}–{r.endTime}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status="upcoming" />
                </div>
              ))
            }
          </div>
        </div>
      )}

      <style>{`
        @keyframes liveping {
          0%,100% { box-shadow: 0 0 0 3px rgba(16,185,129,0.35); }
          50%      { box-shadow: 0 0 0 8px rgba(16,185,129,0); }
        }
        @keyframes pulse {
          0%,100% { opacity:1; }
          50%      { opacity:0.4; }
        }
      `}</style>
    </div>
  );
}
