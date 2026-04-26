import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, Loader2, X, Shuffle, Navigation } from 'lucide-react';
import { routeAPI } from '../../utils/api';

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  address?: {
    city?: string;
    state?: string;
    country?: string;
    road?: string;
  };
}

interface LocationSearchProps {
  type: 'start' | 'end';
  value: string;
  resolved: boolean;
  onChange: (value: string) => void;
  onSelect: (result: SearchResult) => void;
  onClear: () => void;
}

export function LocationSearch({
  type, value, resolved, onChange, onSelect, onClear
}: LocationSearchProps) {
  const [results, setResults]     = useState<SearchResult[]>([]);
  const [loading, setLoading]     = useState(false);
  const [focused, setFocused]     = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef  = useRef<HTMLInputElement>(null);
  const listRef   = useRef<HTMLDivElement>(null);
  const timerRef  = useRef<ReturnType<typeof setTimeout>>();

  const isStart = type === 'start';
  const accent  = isStart ? '#059669' : '#dc2626';
  const bgAccent= isStart ? '#ecfdf5' : '#fef2f2';

  // ── Debounced search ──────────────────────────────────────
  useEffect(() => {
    clearTimeout(timerRef.current);
    if (resolved || value.length < 3) { setResults([]); return; }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await routeAPI.searchLocations(value);
        setResults(data);
        setActiveIdx(-1);
      } catch (err) {
        console.error("Location search failed:", err);
      } finally {
        setLoading(false);
      }
    }, 450);
    return () => clearTimeout(timerRef.current);
  }, [value, resolved]);

  // ── Keyboard navigation ──────────────────────────────────
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIdx >= 0) { onSelect(results[activeIdx]); setResults([]); }
    } else if (e.key === 'Escape') {
      setResults([]); setFocused(false); inputRef.current?.blur();
    }
  }, [results, activeIdx, onSelect]);

  // ── Close on outside click ───────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        inputRef.current && !inputRef.current.contains(e.target as Node) &&
        listRef.current  && !listRef.current.contains(e.target as Node)
      ) {
        setResults([]);
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Pretty label for a result ─────────────────────────────
  const getLabel = (r: SearchResult) => {
    const parts = r.display_name.split(',');
    return parts[0].trim();
  };
  const getSublabel = (r: SearchResult) => {
    const parts = r.display_name.split(',');
    return parts.slice(1, 3).join(',').trim();
  };

  // ── Icon by type ──────────────────────────────────────────
  const getIcon = (r: SearchResult) => {
    const t = (r.type || '').toLowerCase();
    if (t.includes('city') || t.includes('town'))    return '🏙️';
    if (t.includes('road') || t.includes('street'))  return '🛣️';
    if (t.includes('hospital'))                       return '🏥';
    if (t.includes('school') || t.includes('college'))return '🎓';
    return '📍';
  };

  const showDropdown = focused && results.length > 0 && !resolved;

  return (
    <div style={{ position: 'relative', flex: 1 }}>
      {/* ── Label ── */}
      <label style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        fontSize: '0.75rem', fontWeight: 800, color: accent,
        letterSpacing: '0.06em', marginBottom: '8px', textTransform: 'uppercase'
      }}>
        <MapPin size={14} />
        {isStart ? 'Event Origin' : 'Final Destination'}
      </label>

      {/* ── Input wrapper ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        background: focused ? '#fff' : '#f8fafc',
        border: `2px solid ${focused ? accent : resolved ? accent + '60' : '#e2e8f0'}`,
        borderRadius: '14px', padding: '4px 4px 4px 14px',
        transition: 'all 0.25s ease',
        boxShadow: focused ? `0 0 0 3px ${accent}18` : 'none',
      }}>
        {/* Search icon / spinner */}
        <div style={{ color: loading ? '#3b82f6' : resolved ? accent : '#94a3b8', flexShrink: 0 }}>
          {loading
            ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            : resolved
              ? <Navigation size={16} />
              : <MapPin size={16} />
          }
        </div>

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          placeholder={isStart ? 'Search origin in India…' : 'Search destination in India…'}
          onChange={e => { onChange(e.target.value); }}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontSize: '0.9rem', fontWeight: 600, color: '#0f172a',
            padding: '8px 0',
          }}
          autoComplete="off"
        />

        {/* Resolved badge */}
        {resolved && (
          <div style={{
            background: bgAccent, color: accent,
            fontSize: '0.65rem', fontWeight: 800,
            padding: '4px 10px', borderRadius: '8px', whiteSpace: 'nowrap',
          }}>✓ SET</div>
        )}

        {/* Clear button (shown when there's text) */}
        {value && !resolved && (
          <button
            type="button"
            onClick={onClear}
            style={{
              background: '#f1f5f9', border: 'none', cursor: 'pointer',
              padding: '6px', borderRadius: '8px', color: '#64748b',
              display: 'flex', transition: 'background 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#e2e8f0')}
            onMouseLeave={e => (e.currentTarget.style.background = '#f1f5f9')}
          >
            <X size={14} />
          </button>
        )}

        {/* Clear resolved */}
        {resolved && (
          <button
            type="button"
            onClick={onClear}
            title="Change location"
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: '6px', borderRadius: '8px', color: '#94a3b8',
              display: 'flex',
            }}
          >
            <X size={14} />
          </button>
        )}

      </div>

      {/* ── Dropdown ── */}
      {showDropdown && (
        <div
          ref={listRef}
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
            background: 'white', borderRadius: '14px',
            boxShadow: '0 20px 40px -8px rgba(0,0,0,0.15)',
            border: '1px solid #e2e8f0', zIndex: 1200,
            overflow: 'hidden',
            animation: 'dropIn 0.15s ease',
          }}
        >
          {/* Google-style header */}
          <div style={{
            padding: '10px 16px 6px',
            fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            borderBottom: '1px solid #f1f5f9',
          }}>
            Suggested locations
          </div>

          {results.map((r, i) => (
            <div
              key={i}
              onMouseDown={() => { onSelect(r); setResults([]); setFocused(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 16px',
                background: i === activeIdx ? '#f8fafc' : 'white',
                cursor: 'pointer',
                borderBottom: i < results.length - 1 ? '1px solid #f8fafc' : 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
              onMouseLeave={e => (e.currentTarget.style.background = i === activeIdx ? '#f8fafc' : 'white')}
            >
              {/* Icon bubble */}
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: bgAccent, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0,
              }}>
                {getIcon(r)}
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: 700, color: '#0f172a', fontSize: '0.88rem',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {getLabel(r)}
                </div>
                <div style={{
                  color: '#94a3b8', fontSize: '0.74rem', marginTop: '2px',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {getSublabel(r)}
                </div>
              </div>

              {/* Arrow */}
              <div style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>›</div>
            </div>
          ))}

          {/* Footer attribution */}
          <div style={{
            padding: '6px 16px',
            fontSize: '0.62rem', color: '#cbd5e1', textAlign: 'right',
            borderTop: '1px solid #f1f5f9',
          }}>
            Powered by OpenStreetMap
          </div>
        </div>
      )}

      <style>{`
        @keyframes dropIn {
          from { opacity:0; transform:translateY(-6px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
