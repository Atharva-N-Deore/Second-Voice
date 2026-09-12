import React from 'react';
import { QuickPhrase } from '../services/api';
import { Volume2, AlertTriangle, ShieldCheck, HeartHandshake } from 'lucide-react';
import { speakWithBrowserTTS } from '../services/audioRecorder';

interface QuickPhrasesProps {
  phrases: QuickPhrase[];
  onSpeakPhrase: (phrase: string) => void;
}

export const QuickPhrases: React.FC<QuickPhrasesProps> = ({ phrases, onSpeakPhrase }) => {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <HeartHandshake size={18} color="var(--accent-rose)" />
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
          Quick Accessibility & Emergency Trigger Cards
        </h3>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '10px'
      }}>
        {phrases.map((item) => {
          const isCritical = item.severity === 'critical';
          const isUrgent = item.severity === 'urgent';
          
          let borderColor = 'var(--border-color)';
          let bgColor = 'rgba(255, 255, 255, 0.03)';
          let iconColor = 'var(--accent-blue)';

          if (isCritical) {
            borderColor = 'rgba(220, 38, 38, 0.4)';
            bgColor = 'rgba(220, 38, 38, 0.12)';
            iconColor = '#ef4444';
          } else if (isUrgent) {
            borderColor = 'rgba(245, 158, 11, 0.4)';
            bgColor = 'rgba(245, 158, 11, 0.12)';
            iconColor = '#f59e0b';
          }

          return (
            <button
              key={item.id}
              onClick={() => {
                onSpeakPhrase(item.phrase);
                speakWithBrowserTTS(item.phrase);
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                background: bgColor,
                border: `1px solid ${borderColor}`,
                color: 'var(--text-main)',
                cursor: 'pointer',
                textAlign: 'left',
                minHeight: '80px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = isCritical
                  ? '0 0 20px rgba(220, 38, 38, 0.3)'
                  : '0 4px 14px rgba(0,0,0,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '8px' }}>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: iconColor
                }}>
                  {item.category}
                </span>
                <Volume2 size={16} color={iconColor} />
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, lineHeight: 1.3 }}>
                "{item.phrase}"
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
