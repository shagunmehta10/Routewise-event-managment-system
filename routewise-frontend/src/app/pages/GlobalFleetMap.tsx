import { useState, useEffect, useRef } from 'react';
import { Navbar } from '../components/Navbar';
import TrafficTicker from '../components/TrafficTicker';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { eventAPI, routeAPI } from '../../utils/api';
import { useGeolocation } from '../../hooks/useGeolocation';
import { 
  Navigation2, 
  Search, 
  Calendar, 
  Clock, 
  ChevronRight,
  MapPin,
  RotateCw,
  Layers,
  AlertTriangle,
  Map as MapIcon,
  Satellite
} from 'lucide-react';
import '../styles/global-fleet-map.css';

// ── Fix Leaflet default icon paths ──
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const StartIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const EndIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const ClashIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [35, 55],
  iconAnchor: [17, 55],
  popupAnchor: [1, -46],
});

const UserIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const EVENT_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#4f46e5'];

// Available tile layers
const TILE_LAYERS = {
  osm: {
    label: 'Street Map',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    subdomains: ['a', 'b', 'c'],
    opacity: 1,
  },
  light: {
    label: 'Light Command',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap, © CARTO',
    subdomains: 'abcd',
    opacity: 1,
  },
  traffic: {
    label: 'Live Traffic',
    url: 'https://mt1.google.com/vt/lyrs=m,traffic&x={x}&y={y}&z={z}',
    attribution: '© Google Maps',
    subdomains: '',
    opacity: 1,
  },
  dark: {
    label: 'Stealth Mode (Dark)',
    url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
    attribution: '© Stadia Maps, © OpenMapTiles, © OpenStreetMap contributors',
    subdomains: '',
    opacity: 1,
  },
  satellite: {
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri, Maxar, Earthstar Geographics',
    subdomains: '',
    opacity: 1,
  },
};

interface FleetEvent {
  id: number;
  name: string;
  date: string;
  startTime: string;
  endTime?: string;
  startLocation: string;
  endLocation: string;
  status: string;
  eventType?: string;
  startCoords?: [number, number];
  endCoords?: [number, number];
  geometry?: [number, number][];
  alternatives?: any[];
  activeRouteIdx: number;
  color: string;
  clashing?: boolean;
  clashWith?: string;
  mustDivert?: boolean;
  geoLoading?: boolean;
  geoError?: boolean;
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

function FitBounds({ events }: { events: FleetEvent[] }) {
  const map = useMap();
  const boundsRef = useRef<string>('');

  useEffect(() => {
    if (events.length === 0) return;
    const coordsKey = events.map(e => `${e.startCoords}-${e.endCoords}`).join('|');
    if (coordsKey === boundsRef.current) return;
    boundsRef.current = coordsKey;

    const bounds = L.latLngBounds([]);
    let hasCoords = false;
    events.forEach(e => {
      if (e.startCoords) { bounds.extend(e.startCoords); hasCoords = true; }
      if (e.endCoords) { bounds.extend(e.endCoords); hasCoords = true; }
    });
    if (hasCoords) {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14, animate: true, duration: 1.2 });
    }
  }, [events, map]);
  return null;
}

export default function GlobalFleetMap() {
  const { latitude, longitude } = useGeolocation();
  const [events, setEvents] = useState<FleetEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [showAllAlternatives, setShowAllAlternatives] = useState(false);
  const [clashCount, setClashCount] = useState(0);
  const [tileLayer, setTileLayer] = useState<keyof typeof TILE_LAYERS>('traffic');
  const [showLayerPicker, setShowLayerPicker] = useState(false);

  // Auto-set theme based on privacy settings
  useEffect(() => {
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;
    if (user?.settings?.privacy === 'private') {
      setTileLayer('dark');
    } else {
      setTileLayer('traffic'); // Default to traffic for public mode
    }
  }, []);

  const fetchMapData = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const userJson = localStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : null;
      const rawEvents = await eventAPI.getAllEvents(); // Fetch ALL global events, not just user's own

      const initialEvents: FleetEvent[] = rawEvents.map((e: any, i: number) => ({
        ...e,
        color: EVENT_COLORS[i % EVENT_COLORS.length],
        geoLoading: !e.startCoords,
        activeRouteIdx: 0,
        alternatives: e.alternatives || null
      }));

      const eventsWithClashes = eventAPI.detectClashes(initialEvents);
      
      // Apply privacy filter and hide old events from other users
      const visibleEvents: FleetEvent[] = eventsWithClashes.filter((e: any) => 
        (!e.is_private || (user && String(e.user_id) === String(user.id))) &&
        eventAPI.getLiveStatus(e) !== 'completed'
      );
      
      setEvents(visibleEvents);
      setClashCount(visibleEvents.filter((e: FleetEvent) => e.clashing).length);

      // Geocode + route fetch for events missing coords
      const processed = [...visibleEvents];
      for (let i = 0; i < processed.length; i++) {
        const ev = processed[i];
        if (ev.startCoords && ev.endCoords && ev.alternatives) continue;

        try {
          let start = ev.startCoords;
          let end = ev.endCoords;

          if (!start) {
            try {
              start = await routeAPI.geocodeLocation(ev.startLocation);
              await delay(350);
            } catch {
              start = [30.3165 + Math.random() * 0.05, 78.0322 + Math.random() * 0.05];
            }
          }
          if (!end) {
            try {
              end = await routeAPI.geocodeLocation(ev.endLocation);
              await delay(350);
            } catch {
              end = [30.3165 + Math.random() * 0.05, 78.0322 + Math.random() * 0.05];
            }
          }

          if (start && end) {
            const altData = await routeAPI.getOSRMAlternatives(start, end);
            processed[i] = { ...processed[i], startCoords: start, endCoords: end, alternatives: altData.routes, geoLoading: false };
          } else {
            processed[i] = { ...processed[i], geoLoading: false, geoError: true };
          }
          setEvents([...processed]);
          if (start && end) {
            await delay(1000); // Prevent OSRM API 429 Rate Limit
          }
        } catch {
          processed[i] = { ...processed[i], geoLoading: false };
          setEvents([...processed]);
        }
      }
    } catch (err) {
      console.error('Fleet fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapData(true);
    const interval = setInterval(() => fetchMapData(false), 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredEvents = events.filter(e =>
    e.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.startLocation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.endLocation?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentTile = TILE_LAYERS[tileLayer];

  return (
    <div className="global-fleet-map-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0f172a' }}>
      <Navbar />
      <TrafficTicker />

      {/* Clash Alert Banner */}
      {clashCount > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
          color: 'white', padding: '0.85rem 2rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 4px 12px rgba(239,68,68,0.4)', zIndex: 100
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={20} />
            <strong style={{ fontSize: '0.9rem' }}>
              ⚡ {clashCount} Route Clash{clashCount > 1 ? 'es' : ''} Detected
            </strong>
            <span style={{ opacity: 0.85, fontSize: '0.85rem' }}>
              — Click a conflicted event to switch to a safe alternate path.
            </span>
          </div>
          <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>
            {new Date().toLocaleTimeString()}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, height: 'calc(100vh - 60px)', overflow: 'hidden' }}>
        {/* ── Sidebar ── */}
        <aside style={{
          width: '340px', flexShrink: 0,
          background: '#0f172a', borderRight: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, color: 'white', fontSize: '1.1rem', fontWeight: 900 }}>
                Fleet Command
              </h2>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ 
                  background: 'rgba(16,185,129,0.15)', color: '#10b981',
                  fontSize: '0.7rem', fontWeight: 900, padding: '3px 8px', borderRadius: '6px'
                }}>
                  {filteredEvents.length} Active
                </span>
                <button
                  onClick={() => fetchMapData(true)}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                  title="Refresh fleet data"
                >
                  <RotateCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>
            {/* Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.75rem', padding: '0.6rem 1rem', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Search size={16} color="#64748b" />
              <input
                type="text"
                placeholder="Search missions..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: '0.875rem', flex: 1 }}
              />
            </div>
          </div>

          {/* Event List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem' }}>
                {[1,2,3].map(i => (
                  <div key={i} style={{ height: '90px', background: 'rgba(255,255,255,0.05)', borderRadius: '0.75rem', animation: 'pulse 2s infinite' }} />
                ))}
              </div>
            ) : filteredEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                <MapPin size={36} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
                <p style={{ margin: 0, fontSize: '0.9rem' }}>No missions found</p>
              </div>
            ) : (
              filteredEvents.map(event => (
                <div
                  key={event.id}
                  onClick={() => setSelectedEventId(selectedEventId === event.id ? null : event.id)}
                  style={{
                    padding: '1rem',
                    borderRadius: '0.875rem',
                    border: '1px solid',
                    borderColor: selectedEventId === event.id 
                      ? event.color 
                      : event.clashing 
                        ? 'rgba(239,68,68,0.3)' 
                        : 'rgba(255,255,255,0.06)',
                    background: selectedEventId === event.id 
                      ? `${event.color}18`
                      : event.clashing 
                        ? 'rgba(239,68,68,0.05)'
                        : 'rgba(255,255,255,0.03)',
                    cursor: 'pointer',
                    marginBottom: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                >
                  {/* Event color bar */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.6rem' }}>
                    <div style={{ width: '4px', height: '100%', minHeight: '40px', borderRadius: '2px', background: event.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.3rem' }}>
                        <h4 style={{ margin: 0, color: 'white', fontSize: '0.9rem', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {event.name}
                        </h4>
                        {event.clashing && (
                          <AlertTriangle size={14} color="#ef4444" style={{ flexShrink: 0 }} />
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Calendar size={11} /> {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Clock size={11} /> {event.startTime}
                        </span>
                        {event.alternatives?.[event.activeRouteIdx]?.distance && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: event.color }}>
                            <Navigation2 size={11} /> {event.alternatives[event.activeRouteIdx].distance}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Route segment label */}
                  <div style={{ fontSize: '0.72rem', color: '#475569', paddingLeft: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    📍 {event.startLocation} → {event.endLocation}
                  </div>

                  {/* Alt path selector */}
                  {event.alternatives && event.alternatives.length > 1 && selectedEventId === event.id && (
                    <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Route Paths
                        </span>
                        {event.clashing && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setEvents(prev => prev.map(ev =>
                                ev.id === event.id ? { ...ev, activeRouteIdx: 1 } : ev
                              ));
                            }}
                            style={{ background: '#ef4444', color: 'white', border: 'none', padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer' }}
                          >
                            Use Safe Path ⚡
                          </button>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {event.alternatives.map((alt: any, idx: number) => (
                          <div
                            key={idx}
                            onClick={e => {
                              e.stopPropagation();
                              setEvents(prev => prev.map(ev =>
                                ev.id === event.id ? { ...ev, activeRouteIdx: idx } : ev
                              ));
                            }}
                            style={{
                              padding: '4px 8px', borderRadius: '5px',
                              border: `1px solid ${event.activeRouteIdx === idx ? event.color : 'rgba(255,255,255,0.1)'}`,
                              background: event.activeRouteIdx === idx ? `${event.color}22` : 'rgba(255,255,255,0.03)',
                              color: event.activeRouteIdx === idx ? event.color : '#94a3b8',
                              fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer', textAlign: 'center'
                            }}
                          >
                            <div>{idx === 0 ? 'Main' : `Alt ${idx}`}</div>
                            <div style={{ opacity: 0.8, fontSize: '0.6rem' }}>{alt.distance}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {event.geoLoading && (
                    <div style={{ fontSize: '0.68rem', color: '#3b82f6', marginTop: '0.4rem', paddingLeft: '1rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <RotateCw size={10} className="animate-spin" /> Locating GPS...
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </aside>

        {/* ── Map ── */}
        <div style={{ flex: 1, position: 'relative' }}>
          {/* Map Controls */}
          <div style={{
            position: 'absolute', top: '1rem', right: '1rem', zIndex: 1000,
            display: 'flex', flexDirection: 'column', gap: '0.5rem'
          }}>
            {/* Layer Picker */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowLayerPicker(!showLayerPicker)}
                title="Switch map layer"
                style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(255,255,255,0.12)',
                  color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backdropFilter: 'blur(8px)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }}
              >
                {tileLayer === 'satellite' ? <Satellite size={18} /> : <MapIcon size={18} />}
              </button>
              {showLayerPicker && (
                <div style={{
                  position: 'absolute', right: '48px', top: 0,
                  background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '10px', padding: '0.5rem', backdropFilter: 'blur(12px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)', minWidth: '140px'
                }}>
                  {(Object.keys(TILE_LAYERS) as (keyof typeof TILE_LAYERS)[]).map(key => (
                    <button
                      key={key}
                      onClick={() => { setTileLayer(key); setShowLayerPicker(false); }}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '0.5rem 0.75rem', border: 'none', borderRadius: '6px',
                        background: tileLayer === key ? 'rgba(59,130,246,0.2)' : 'transparent',
                        color: tileLayer === key ? '#60a5fa' : '#94a3b8',
                        cursor: 'pointer', fontSize: '0.82rem', fontWeight: tileLayer === key ? 800 : 600
                      }}
                    >
                      {TILE_LAYERS[key].label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowAllAlternatives(!showAllAlternatives)}
              title="Toggle all alternative paths"
              style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: showAllAlternatives ? 'rgba(59,130,246,0.3)' : 'rgba(15,23,42,0.85)',
                border: `1px solid ${showAllAlternatives ? '#3b82f6' : 'rgba(255,255,255,0.12)'}`,
                color: showAllAlternatives ? '#60a5fa' : 'white', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(8px)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}
            >
              <Layers size={18} />
            </button>

            <button
              onClick={() => { setSelectedEventId(null); fetchMapData(false); }}
              title="Fit all events"
              style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(255,255,255,0.12)',
                color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(8px)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}
            >
              <MapPin size={18} />
            </button>
          </div>

          {/* Map Legend */}
          <div style={{
            position: 'absolute', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
            zIndex: 1000, background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(12px)',
            borderRadius: '999px', padding: '0.5rem 1.25rem',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', gap: '1.25rem', alignItems: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
          }}>
            {[
              { color: '#22c55e', label: 'Start Point' },
              { color: '#ef4444', label: 'End Point' },
              { color: '#f59e0b', label: 'Clash Zone' },
              { color: '#8b5cf6', label: 'You' },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#94a3b8' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
                {label}
              </div>
            ))}
            {showAllAlternatives && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#60a5fa', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '1rem' }}>
                <div style={{ width: '20px', height: '2px', background: '#94a3b8', borderRadius: '1px', borderTop: '2px dashed #94a3b8' }} />
                Alt Paths ON
              </div>
            )}
          </div>

          <MapContainer
            center={[30.3165, 78.0322]}
            zoom={12}
            style={{ width: '100%', height: '100%' }}
            zoomControl={false}
            scrollWheelZoom={true}
          >
            <TileLayer
              url={currentTile.url}
              attribution={currentTile.attribution}
              subdomains={currentTile.subdomains as any}
              opacity={currentTile.opacity}
            />
            <ZoomControl position="bottomright" />

            {/* User location */}
            {latitude && longitude && (
              <Marker position={[latitude, longitude]} icon={UserIcon}>
                <Popup>
                  <div style={{ padding: '6px' }}>
                    <strong>📍 You are here</strong>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Render events */}
            {filteredEvents.map(event => {
              const isSelected = event.id === selectedEventId;
              const activeAlt = event.alternatives?.[event.activeRouteIdx];

              return (
                <div key={event.id}>
                  {/* Start marker */}
                  {event.startCoords && (
                    <Marker position={event.startCoords} icon={event.clashing ? ClashIcon : StartIcon}>
                      <Popup>
                        <div style={{ padding: '8px', minWidth: '180px' }}>
                          <strong style={{ color: event.clashing ? '#dc2626' : '#1e3a8a', display: 'block', marginBottom: '4px' }}>
                            {event.clashing ? '⚠️ Route Conflict' : `🚦 ${event.name}`}
                          </strong>
                          <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '6px' }}>
                            {event.startLocation}
                          </div>
                          {activeAlt?.distance && (
                            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: event.color, marginBottom: '8px' }}>
                              📍 Distance: {activeAlt.distance}
                            </div>
                          )}
                          {event.clashing && event.clashWith && (
                            <div style={{ fontSize: '0.75rem', color: '#ef4444', background: '#fef2f2', padding: '4px 8px', borderRadius: '4px', marginBottom: '8px' }}>
                              Conflicts with: <strong>{event.clashWith}</strong>
                            </div>
                          )}
                          {event.clashing && event.alternatives && event.alternatives.length > 1 && (
                            <button
                              onClick={() => setEvents(prev => prev.map(ev =>
                                ev.id === event.id ? { ...ev, activeRouteIdx: 1 } : ev
                              ))}
                              style={{ width: '100%', background: '#ef4444', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                            >
                              ⚡ Switch to Safe Path
                            </button>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  )}

                  {/* End marker */}
                  {event.endCoords && (
                    <Marker position={event.endCoords} icon={EndIcon}>
                      <Popup>
                        <div style={{ padding: '8px' }}>
                          <strong style={{ display: 'block', marginBottom: '4px' }}>🏁 {event.name}</strong>
                          <span style={{ fontSize: '0.8rem', color: '#475569' }}>{event.endLocation}</span>
                        </div>
                      </Popup>
                    </Marker>
                  )}

                  {/* Active route */}
                  {activeAlt?.geometry && (isSelected || !selectedEventId) && (
                    <Polyline
                      positions={activeAlt.geometry}
                      color={event.clashing ? '#ef4444' : event.color}
                      weight={isSelected ? 6 : 4}
                      opacity={isSelected ? 1 : 0.7}
                    />
                  )}

                  {/* Alternate paths */}
                  {(isSelected || showAllAlternatives) && event.alternatives && event.alternatives.map((alt: any, idx: number) => {
                    if (idx === event.activeRouteIdx) return null;
                    return (
                      <Polyline
                        key={`${event.id}-alt-${idx}`}
                        positions={alt.geometry || []}
                        color="#94a3b8"
                        weight={3}
                        opacity={0.45}
                        dashArray="8, 8"
                      />
                    );
                  })}
                </div>
              );
            })}

            <FitBounds events={selectedEventId ? filteredEvents.filter(e => e.id === selectedEventId) : filteredEvents} />
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
