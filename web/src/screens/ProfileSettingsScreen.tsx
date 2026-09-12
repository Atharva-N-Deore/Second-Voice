import React, { useState } from 'react';
import { UserSpeechProfile } from '../services/api';
import { speakWithBrowserTTS } from '../services/audioRecorder';

interface ProfileSettingsScreenProps {
  profile: UserSpeechProfile;
  onUpdateProfile: (profile: UserSpeechProfile) => void;
  textScale: string;
  onChangeTextScale: (scale: string) => void;
}

export const ProfileSettingsScreen: React.FC<ProfileSettingsScreenProps> = ({
  profile,
  onUpdateProfile,
  textScale,
  onChangeTextScale,
}) => {
  const [contrastMode, setContrastMode] = useState<'standard' | 'high'>('standard');
  const [motionMode, setMotionMode] = useState<'reduced' | 'natural'>('reduced');
  const [targetSize, setTargetSize] = useState<'standard' | 'tremor'>('tremor');
  const [speechRate, setSpeechRate] = useState<number>(95);
  const [breathPauses, setBreathPauses] = useState<boolean>(true);

  const [formData, setFormData] = useState<UserSpeechProfile>(profile);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(formData);
    alert('Accessibility & voice profile updated!');
  };

  const handlePreviewVoice = () => {
    speakWithBrowserTTS('Hello, I am Second Voice. I speak clearly with your personalized neural profile.');
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '20px' }}>
      {/* Intro Hero */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          borderRadius: '999px',
          backgroundColor: 'rgba(253, 209, 127, 0.4)',
          color: 'var(--on-secondary-container)',
          fontSize: '11px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          alignSelf: 'flex-start'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>tune</span>
          Ergonomic Precision
        </div>

        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '24px',
          fontWeight: 700,
          color: 'var(--on-surface)'
        }}>
          Accessibility & Voice Settings
        </h1>
        <p style={{
          fontSize: '14px',
          color: 'var(--on-surface-variant)',
          lineHeight: 1.45
        }}>
          Fine-tune interface ergonomics and speech output to your exact physical and sensory needs.
        </p>
      </section>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Physical & Visual Accommodations Section */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--primary)' }}>
              touch_app
            </span>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 700 }}>
              Physical & Visual Accommodations
            </h2>
          </div>

          {/* Text Scaling Card */}
          <div style={{
            backgroundColor: 'var(--surface-container-lowest)',
            borderRadius: '16px',
            padding: '16px',
            border: '1px solid var(--outline-variant)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--on-surface)' }}>Text Scaling</span>
                <span style={{ display: 'block', fontSize: '12px', color: 'var(--on-surface-variant)' }}>
                  Scales all conversational buttons and cards
                </span>
              </div>
              <span style={{
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--primary)',
                backgroundColor: 'rgba(201, 164, 76, 0.2)',
                padding: '4px 10px',
                borderRadius: '999px'
              }}>
                {textScale}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {['Small', 'Medium', 'Large', 'Extra Large'].map((s) => {
                const isActive = textScale === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onChangeTextScale(s)}
                    style={{
                      height: '46px',
                      borderRadius: '10px',
                      backgroundColor: isActive ? 'var(--primary)' : 'var(--surface-container-low)',
                      color: isActive ? 'var(--on-primary)' : 'var(--on-surface-variant)',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '14px',
                      boxShadow: isActive ? '0 2px 6px rgba(119, 90, 1, 0.2)' : 'none'
                    }}
                  >
                    {s === 'Small' ? 'A-S' : s === 'Medium' ? 'A-M' : s === 'Large' ? 'A-L' : 'A-XL'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contrast Mode */}
          <div style={{
            backgroundColor: 'var(--surface-container-lowest)',
            borderRadius: '16px',
            padding: '16px',
            border: '1px solid var(--outline-variant)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--on-surface)' }}>Visual Contrast</span>
                <span style={{ display: 'block', fontSize: '12px', color: 'var(--on-surface-variant)' }}>
                  Optimal luminance calibration
                </span>
              </div>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--secondary)' }}>
                contrast
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setContrastMode('standard')}
                style={{
                  height: '48px',
                  borderRadius: '10px',
                  backgroundColor: contrastMode === 'standard' ? 'var(--primary)' : 'var(--surface-container-low)',
                  color: contrastMode === 'standard' ? 'var(--on-primary)' : 'var(--on-surface-variant)',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>wb_sunny</span>
                <span>Warm Standard</span>
              </button>

              <button
                type="button"
                onClick={() => setContrastMode('high')}
                style={{
                  height: '48px',
                  borderRadius: '10px',
                  backgroundColor: contrastMode === 'high' ? 'var(--primary)' : 'var(--surface-container-low)',
                  color: contrastMode === 'high' ? 'var(--on-primary)' : 'var(--on-surface-variant)',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>tonality</span>
                <span>High Contrast Gold</span>
              </button>
            </div>
          </div>
        </section>

        {/* Section 2: Speech Synthesis & Neural Voice */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--primary)' }}>
              record_voice_over
            </span>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 700 }}>
              Neural Voice & Acoustic Delivery
            </h2>
          </div>

          <div style={{
            backgroundColor: 'var(--surface-container-lowest)',
            borderRadius: '16px',
            padding: '16px',
            border: '1px solid var(--outline-variant)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Assigned Neural Voice
              </label>
              <select
                value={formData.voice}
                onChange={(e) => setFormData({ ...formData, voice: e.target.value })}
                style={{
                  width: '100%',
                  height: '44px',
                  borderRadius: '10px',
                  padding: '0 12px',
                  border: '1px solid var(--outline-variant)',
                  backgroundColor: 'var(--surface-container-low)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px'
                }}
              >
                <option value="en-US-GuyNeural">Guy (Natural Male, US)</option>
                <option value="en-US-JennyNeural">Jenny (Natural Female, US)</option>
                <option value="en-US-AriaNeural">Aria (Expressive Female, US)</option>
                <option value="en-GB-RyanNeural">Ryan (Natural Male, UK)</option>
                <option value="en-GB-SoniaNeural">Sonia (Natural Female, UK)</option>
              </select>
            </div>

            {/* Speech Rate Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                <span>Speech Pace & Cadence</span>
                <span style={{ color: 'var(--primary)' }}>{speechRate}%</span>
              </div>
              <input
                type="range"
                min="70"
                max="130"
                value={speechRate}
                onChange={(e) => setSpeechRate(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)' }}
              />
            </div>

            {/* Test Voice Button */}
            <button
              type="button"
              onClick={handlePreviewVoice}
              style={{
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'var(--surface-container-low)',
                color: 'var(--primary)',
                border: '1px solid var(--outline-variant)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>volume_up</span>
              <span>Test Neural Voice Sample</span>
            </button>
          </div>
        </section>

        {/* Section 3: Speech Impairment Tuning */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--primary)' }}>
              medical_information
            </span>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 700 }}>
              Speech Impairment Profile
            </h2>
          </div>

          <div style={{
            backgroundColor: 'var(--surface-container-lowest)',
            borderRadius: '16px',
            padding: '16px',
            border: '1px solid var(--outline-variant)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Speech Condition / Profile
              </label>
              <select
                value={formData.impairmentType}
                onChange={(e) => setFormData({ ...formData, impairmentType: e.target.value })}
                style={{
                  width: '100%',
                  height: '44px',
                  borderRadius: '10px',
                  padding: '0 12px',
                  border: '1px solid var(--outline-variant)',
                  backgroundColor: 'var(--surface-container-low)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px'
                }}
              >
                <option value="Dysarthria (General)">Dysarthria (General)</option>
                <option value="Cerebral Palsy">Cerebral Palsy (Slurred Consonants)</option>
                <option value="Post-Stroke Apraxia">Post-Stroke Apraxia</option>
                <option value="ALS / Motor Neuron">ALS / Motor Neuron (Breath Fatigue)</option>
                <option value="Parkinson's Disease">Parkinson's (Hypophonia / Soft Voice)</option>
                <option value="Severe Stuttering">Severe Stuttering / Repetitions</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Pronunciation Quirks & Shorthands
              </label>
              <input
                type="text"
                placeholder="e.g. Difficulty with 'R' and 'Th' sounds, soft voice"
                value={formData.speechQuirks}
                onChange={(e) => setFormData({ ...formData, speechQuirks: e.target.value })}
                style={{
                  width: '100%',
                  height: '44px',
                  borderRadius: '10px',
                  padding: '0 12px',
                  border: '1px solid var(--outline-variant)',
                  backgroundColor: 'var(--surface-container-low)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
        </section>

        {/* Save Changes Button */}
        <button
          type="submit"
          style={{
            height: '52px',
            borderRadius: '14px',
            backgroundColor: 'var(--primary)',
            color: 'var(--on-primary)',
            border: 'none',
            fontWeight: 700,
            fontSize: '16px',
            fontFamily: 'var(--font-heading)',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(119, 90, 1, 0.25)'
          }}
        >
          Save Accommodations & Profile
        </button>
      </form>
    </div>
  );
};
