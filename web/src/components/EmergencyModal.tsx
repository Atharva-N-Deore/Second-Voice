import React from 'react';
import { speakWithBrowserTTS } from '../services/audioRecorder';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const emergencyPhrases = [
    { phrase: 'I need immediate medical help! Please call an ambulance.', tag: '911 AMBULANCE' },
    { phrase: 'I have fallen down and cannot get up by myself.', tag: 'FALL ASSIST' },
    { phrase: 'I am having serious difficulty breathing.', tag: 'RESPIRATORY' },
    { phrase: 'Please wait, I communicate using an assistive voice assistant.', tag: 'VOICE ASSIST' },
  ];

  const handleTrigger = (phrase: string) => {
    speakWithBrowserTTS(phrase);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(186, 26, 26, 0.4)',
      backdropFilter: 'blur(10px)',
      zIndex: 70,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '500px',
        backgroundColor: 'var(--surface)',
        borderRadius: '24px',
        padding: '24px',
        boxShadow: '0 8px 36px rgba(186, 26, 26, 0.3)',
        border: '2px solid var(--error)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--error)' }} className="animate-ping" />
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 800, color: 'var(--error)' }}>
              EMERGENCY SOS VOICE
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--on-surface-variant)'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
          </button>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', marginBottom: '16px' }}>
          Tap any card below to broadcast emergency speech instantly at maximum volume:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {emergencyPhrases.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleTrigger(item.phrase)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                padding: '14px 16px',
                borderRadius: '14px',
                backgroundColor: 'var(--error-container)',
                color: 'var(--on-error-container)',
                border: '1px solid var(--error)',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em' }}>
                  {item.tag}
                </span>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>volume_up</span>
              </div>
              <span style={{ fontSize: '15px', fontWeight: 700, lineHeight: 1.3 }}>
                "{item.phrase}"
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            marginTop: '16px',
            padding: '12px',
            borderRadius: '12px',
            backgroundColor: 'var(--surface-container-high)',
            color: 'var(--on-surface)',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '14px'
          }}
        >
          Dismiss Emergency Menu
        </button>
      </div>
    </div>
  );
};
