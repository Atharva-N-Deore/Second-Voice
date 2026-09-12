import React, { useState } from 'react';
import { X, Save, UserCheck, Sparkles, Volume2 } from 'lucide-react';
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
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '16px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '520px',
        padding: '28px',
        position: 'relative',
        boxShadow: '0 0 40px rgba(99, 102, 241, 0.3)',
        background: '#111726'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UserCheck size={22} color="var(--accent-indigo)" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Personal Speech Profile</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Impairment Type */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              Condition / Impairment Classification
            </label>
            <select
              value={formData.impairmentType}
              onChange={(e) => setFormData({ ...formData, impairmentType: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-main)',
                fontSize: '0.9rem'
              }}
            >
              <option value="Dysarthria (General)" style={{ background: '#111726' }}>Dysarthria (General)</option>
              <option value="Cerebral Palsy" style={{ background: '#111726' }}>Cerebral Palsy (Slurred Consonants)</option>
              <option value="Post-Stroke Apraxia" style={{ background: '#111726' }}>Post-Stroke Apraxia / Aphasia</option>
              <option value="ALS / Motor Neuron" style={{ background: '#111726' }}>ALS / Motor Neuron (Breath Fatigue)</option>
              <option value="Parkinson's Disease" style={{ background: '#111726' }}>Parkinson's (Hypophonia / Soft Voice)</option>
              <option value="Severe Stuttering" style={{ background: '#111726' }}>Severe Stuttering / Repetitions</option>
            </select>
          </div>

          {/* Pronunciation Quirks */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              Pronunciation Patterns & Specific Quirks
            </label>
            <input
              type="text"
              placeholder="e.g. Difficulty pronouncing 'R', 'Th' replaced with 'F', syllable drops"
              value={formData.speechQuirks}
              onChange={(e) => setFormData({ ...formData, speechQuirks: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-main)',
                fontSize: '0.9rem'
              }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Injected into the context-aware LLM to resolve phonetic ambiguities.
            </span>
          </div>

          {/* Preferred TTS Voice */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              Neural Voice Model
            </label>
            <select
              value={formData.voice}
              onChange={(e) => setFormData({ ...formData, voice: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-main)',
                fontSize: '0.9rem'
              }}
            >
              <option value="en-US-GuyNeural" style={{ background: '#111726' }}>Guy (Natural Male, US)</option>
              <option value="en-US-JennyNeural" style={{ background: '#111726' }}>Jenny (Natural Female, US)</option>
              <option value="en-US-AriaNeural" style={{ background: '#111726' }}>Aria (Expressive Female, US)</option>
              <option value="en-GB-RyanNeural" style={{ background: '#111726' }}>Ryan (Natural Male, UK)</option>
              <option value="en-GB-SoniaNeural" style={{ background: '#111726' }}>Sonia (Natural Female, UK)</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                background: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: 'var(--accent-indigo)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: '#ffffff',
                cursor: 'pointer',
                fontWeight: 700,
                boxShadow: '0 0 16px rgba(99, 102, 241, 0.4)'
              }}
            >
              <Save size={16} />
              <span>Save Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
