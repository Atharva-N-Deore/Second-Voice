import React from 'react';
import { PresetItem } from '../services/api';

interface SidebarContextProps {
  presets: PresetItem[];
  selectedContext: string;
  onSelectContext: (name: string) => void;
  volumeLevel: number;
  onOpenEmergency: () => void;
}

export const SidebarContext: React.FC<SidebarContextProps> = ({
  presets,
  selectedContext,
  onSelectContext,
  volumeLevel,
  onOpenEmergency,
}) => {
  return (
    <aside style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* Emergency Immediate Action Card */}
      <button
        onClick={onOpenEmergency}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--rose-surface)',
          border: '1px solid rgba(244, 63, 94, 0.4)',
          color: 'var(--text-main)',
          cursor: 'pointer',
          textAlign: 'left',
          boxShadow: '0 4px 20px rgba(244, 63, 94, 0.15)',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 0 30px rgba(244, 63, 94, 0.4)')}
        onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(244, 63, 94, 0.15)')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'rgba(244, 63, 94, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--rose-alert)'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>crisis_alert</span>
          </div>
          <div>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '13px',
              fontWeight: 800,
              color: 'var(--rose-alert)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              display: 'block'
            }}>
              Emergency SOS
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Broadcast immediate help
            </span>
          </div>
        </div>
        <span className="material-symbols-outlined" style={{ color: 'var(--rose-alert)', fontSize: '20px' }}>
          arrow_forward
        </span>
      </button>

      {/* Situational Context Selector */}
      <div className="lux-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--gold-primary)' }}>
              location_on
            </span>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700 }}>
              Active Environment
            </h2>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            LLM Context Boost
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {presets.map((preset) => {
            const isSelected = selectedContext === preset.name;
            return (
              <button
                key={preset.id}
                onClick={() => onSelectContext(preset.name)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isSelected ? 'var(--gold-surface)' : 'rgba(255, 255, 255, 0.03)',
                  border: isSelected ? '1px solid var(--border-gold)' : '1px solid var(--border-subtle)',
                  color: isSelected ? 'var(--gold-bright)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 0 16px rgba(201, 164, 76, 0.2)' : 'none'
                }}
              >
                <span style={{ fontSize: '20px' }}>{preset.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '13px',
                    fontWeight: isSelected ? 800 : 600,
                    color: isSelected ? 'var(--text-main)' : 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden'
                  }}>
                    {preset.name}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: 'var(--text-dim)',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    marginTop: '2px'
                  }}>
                    {preset.description}
                  </div>
                </div>
                {isSelected && (
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--gold-primary)' }}>
                    check_circle
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Acoustic VU Decibel Meter */}
      <div className="lux-panel" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--emerald-accent)' }}>
              mic
            </span>
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Microphone Sensitivity
            </span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {Math.round(volumeLevel * 100)}%
          </span>
        </div>

        {/* 12-segment LED VU meter */}
        <div style={{ display: 'flex', gap: '4px', height: '10px', width: '100%' }}>
          {[...Array(14)].map((_, i) => {
            const isLit = (i / 14) <= volumeLevel;
            const isWarning = i > 10;
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  borderRadius: '3px',
                  backgroundColor: isLit
                    ? (isWarning ? 'var(--rose-alert)' : 'var(--emerald-accent)')
                    : 'rgba(255, 255, 255, 0.08)',
                  boxShadow: isLit
                    ? (isWarning ? '0 0 6px rgba(244, 63, 94, 0.6)' : '0 0 6px rgba(16, 185, 129, 0.6)')
                    : 'none',
                  transition: 'background-color 0.08s ease'
                }}
              />
            );
          })}
        </div>
      </div>
    </aside>
  );
};
