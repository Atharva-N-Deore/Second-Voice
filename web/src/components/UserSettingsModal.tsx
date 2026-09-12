import React, { useState } from 'react';
import { UserSpeechProfile } from '../services/api';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserSpeechProfile;
  onSaveProfile: (profile: UserSpeechProfile) => void;
}

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
}) => {
  const [formData, setFormData] = useState<UserSpeechProfile>(profile);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="lux-panel"
        style={{
          width: '100%',
          maxWidth: '540px',
          padding: '28px',
          backgroundColor: 'var(--panel-bg)',
          border: '1px solid var(--border-gold)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(201, 164, 76, 0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--gold-surface)',
                border: '1px solid var(--border-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--gold-bright)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                psychology
              </span>
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 800, margin: 0 }}>
                Personal Speech Profile
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-dim)', margin: 0 }}>
                Tune acoustic priors and personal voice synthesis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Impairment Classification */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Condition / Speech Classification
            </label>
            <select
              value={formData.impairmentType}
              onChange={(e) => setFormData({ ...formData, impairmentType: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 14px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-main)',
                fontSize: '13px',
                outline: 'none',
              }}
            >
              <option value="Dysarthria (General)" style={{ background: '#121214' }}>Dysarthria (General / TORGO Model)</option>
              <option value="Cerebral Palsy" style={{ background: '#121214' }}>Cerebral Palsy (Consonant Softening)</option>
              <option value="Post-Stroke Apraxia" style={{ background: '#121214' }}>Post-Stroke Apraxia / Expressive Aphasia</option>
              <option value="ALS / Motor Neuron" style={{ background: '#121214' }}>ALS / Motor Neuron (Breath Cadence)</option>
              <option value="Parkinson's Disease" style={{ background: '#121214' }}>Parkinson's (Hypophonia / Micro-voicing)</option>
              <option value="Severe Stuttering" style={{ background: '#121214' }}>Severe Stuttering & Cluttering</option>
            </select>
          </div>

          {/* Quirks & Phonetic Biases */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Pronunciation Patterns & Quirks
            </label>
            <input
              type="text"
              placeholder="e.g. Difficulty with 'R' and 'Th', consonant drop on word endings"
              value={formData.speechQuirks}
              onChange={(e) => setFormData({ ...formData, speechQuirks: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 14px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-main)',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', marginTop: '4px' }}>
              Directly injected into LLM prompt conditioning to resolve ambiguous phonemes.
            </span>
          </div>

          {/* Voice Model */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Neural TTS Voice Model
            </label>
            <select
              value={formData.voice}
              onChange={(e) => setFormData({ ...formData, voice: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 14px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-main)',
                fontSize: '13px',
                outline: 'none',
              }}
            >
              <option value="en-US-GuyNeural" style={{ background: '#121214' }}>Guy (Warm & Resonant Male, US)</option>
              <option value="en-US-JennyNeural" style={{ background: '#121214' }}>Jenny (Natural & Clear Female, US)</option>
              <option value="en-US-AriaNeural" style={{ background: '#121214' }}>Aria (Expressive Dynamic Female, US)</option>
              <option value="en-GB-RyanNeural" style={{ background: '#121214' }}>Ryan (Refined Male, UK)</option>
              <option value="en-GB-SoniaNeural" style={{ background: '#121214' }}>Sonia (Warm Female, UK)</option>
            </select>
          </div>

          {/* Modal Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                backgroundColor: 'transparent',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13px',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-lux"
              style={{
                padding: '10px 22px',
                fontSize: '13px',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check</span>
              <span>Save & Apply</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
