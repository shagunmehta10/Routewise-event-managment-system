import React, { useEffect, useState } from 'react';
import { AlertTriangle, Clock, Zap } from 'lucide-react';
import type { ClashResult } from '../../utils/clashDetector';

interface ClashAlertProps {
  result: ClashResult;
  onConfirm: () => void;         // proceed anyway (takes the penalty)
  onCancel:  () => void;         // go back and change time
}

export function ClashAlert({ result, onConfirm, onCancel }: ClashAlertProps) {
  const [countdown, setCountdown] = useState(10);

  // Auto-cancel after 30 s to prevent accidental confirms
  useEffect(() => {
    if (countdown <= 0) return;
    const id = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  if (!result.clashes || !result.conflictingEvent) return null;

  const ev = result.conflictingEvent;

  return (
    /* ── Backdrop ── */
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, backdropFilter: 'blur(4px)',
      animation: 'fadeIn 0.2s ease',
    }}>
      {/* ── Card ── */}
      <div style={{
        background: 'white', borderRadius: '24px', width: '480px', maxWidth: '95vw',
        boxShadow: '0 32px 64px -16px rgba(0,0,0,0.4)',
        animation: 'slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        overflow: 'hidden',
      }}>
        {/* Header stripe */}
        <div style={{
          background: 'linear-gradient(135deg, #dc2626, #ef4444)',
          padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.2)', borderRadius: '12px',
            padding: '10px', display: 'flex',
          }}>
            <AlertTriangle size={24} color="white" />
          </div>
          <div>
            <h3 style={{ margin: 0, color: 'white', fontWeight: 800, fontSize: '1.1rem' }}>
              ⚠️ Time Clash Detected
            </h3>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem' }}>
              Route conflict with an existing event
            </p>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {/* Conflicting event info */}
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: '14px', padding: '16px', marginBottom: '16px',
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ef4444', letterSpacing: '0.06em', marginBottom: '8px' }}>
              CONFLICTING EVENT
            </div>
            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>{ev.name}</div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: '#64748b' }}>
                <Clock size={13} /> {ev.startTime} – {ev.endTime}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: '#64748b' }}>
                📅 {ev.date}
              </span>
            </div>
          </div>

          {/* Penalty box */}
          <div style={{
            background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
            border: '1px solid #fde68a', borderRadius: '14px', padding: '16px', marginBottom: '20px',
            display: 'flex', alignItems: 'center', gap: '14px',
          }}>
            <div style={{
              background: '#f59e0b', color: 'white', borderRadius: '10px',
              padding: '10px', display: 'flex',
            }}>
              <Zap size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, color: '#92400e', fontSize: '1rem' }}>
                {result.penaltyPoints} Penalty Points
              </div>
              <div style={{ color: '#78350f', fontSize: '0.8rem', marginTop: '3px' }}>
                {result.penaltyReason}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onCancel}
              style={{
                flex: 1, padding: '14px', borderRadius: '12px',
                border: '2px solid #e2e8f0', background: 'white',
                color: '#374151', fontWeight: 700, fontSize: '0.9rem',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
              onMouseLeave={e => (e.currentTarget.style.background = 'white')}
            >
              ← Change Time
            </button>
            <button
              onClick={onConfirm}
              disabled={countdown > 0}
              style={{
                flex: 1, padding: '14px', borderRadius: '12px',
                border: 'none',
                background: countdown > 0 ? '#fca5a5' : '#dc2626',
                color: 'white', fontWeight: 700, fontSize: '0.9rem',
                cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {countdown > 0
                ? `Accept Penalty (${countdown}s)`
                : `Accept ${result.penaltyPoints} pt Penalty & Deploy`
              }
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { transform:translateY(30px);opacity:0 } to { transform:translateY(0);opacity:1 } }
      `}</style>
    </div>
  );
}
