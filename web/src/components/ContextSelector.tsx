import React from 'react';
import { PresetItem } from '../services/api';
import { MapPin, Sparkles } from 'lucide-react';

interface ContextSelectorProps {
  presets: PresetItem[];
  selectedContext: string;
  onSelectContext: (id: string) => void;
}

export const ContextSelector: React.FC<ContextSelectorProps> = ({
  presets,
  selectedContext,
  onSelectContext,
}) => {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapPin size={18} color="var(--accent-blue)" />
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Active Environment Context
          </h2>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Assists LLM in disambiguating partial words
        </span>
      </div>

      {/* Preset Chips Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
        gap: '10px'
      }}>
        {presets.map((preset) => {
          const isSelected = selectedContext === preset.name || selectedContext === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => onSelectContext(preset.name)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: isSelected ? 'rgba(99, 102, 241, 0.22)' : 'rgba(255, 255, 255, 0.03)',
                border: isSelected ? '1px solid var(--accent-indigo)' : '1px solid var(--border-color)',
                color: isSelected ? '#ffffff' : 'var(--text-muted)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                boxShadow: isSelected ? '0 0 16px rgba(99, 102, 241, 0.25)' : 'none',
              }}
            >
              <span style={{ fontSize: '1.3rem' }}>{preset.icon}</span>
              <div style={{ overflow: 'hidden' }}>
                <div style={{
                  fontSize: '0.85rem',
                  fontWeight: isSelected ? 700 : 500,
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  color: isSelected ? '#ffffff' : 'var(--text-main)'
                }}>
                  {preset.name}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
