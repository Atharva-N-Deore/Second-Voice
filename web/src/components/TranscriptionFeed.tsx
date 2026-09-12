import React from 'react';
import { Volume2, Sparkles, CheckCircle2, ArrowRight, Zap, RefreshCw } from 'lucide-react';
import { ReconstructionResult } from '../services/api';
import { playAudioBase64, speakWithBrowserTTS } from '../services/audioRecorder';

interface TranscriptionFeedProps {
  history: ReconstructionResult[];
  onSelectAlternative: (text: string) => void;
}

export const TranscriptionFeed: React.FC<TranscriptionFeedProps> = ({
  history,
  onSelectAlternative,
}) => {
  const handlePlayAudio = async (item: ReconstructionResult) => {
    if (item.audio_base64) {
      try {
        await playAudioBase64(item.audio_base64);
        return;
      } catch (e) {
        console.warn('Audio base64 playback failed, using browser synthesis:', e);
      }
    }
    await speakWithBrowserTTS(item.reconstructed_text);
  };

  if (history.length === 0) {
    return (
      <div className="glass-panel" style={{
        padding: '36px 24px',
        textAlign: 'center',
        marginBottom: '24px',
        borderStyle: 'dashed'
      }}>
        <Sparkles size={32} color="var(--accent-indigo)" style={{ margin: '0 auto 12px' }} />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
          No Utterances Yet
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Push the microphone button above or type a phrase to see the AI reconstruct fragmented speech in real-time.
        </p>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '14px'
      }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="var(--accent-emerald)" />
          Speech Transformations (Before & After)
        </h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {history.length} reconstructed {history.length === 1 ? 'sentence' : 'sentences'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {history.map((item, idx) => (
          <div key={idx} className="glass-panel" style={{
            padding: '20px',
            borderLeft: idx === 0 ? '4px solid var(--accent-emerald)' : '1px solid var(--border-color)',
            background: idx === 0 ? 'rgba(22, 30, 49, 0.9)' : 'var(--bg-card)',
          }}>
            {/* Metadata Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
              fontSize: '0.75rem',
              color: 'var(--text-muted)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-emerald">
                  <CheckCircle2 size={12} /> {item.detected_intent}
                </span>
                <span>Confidence: <strong>{Math.round(item.confidence * 100)}%</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={13} color="var(--accent-amber)" />
                <span>{item.latency_ms}ms</span>
                <span>• {item.provider}</span>
              </div>
            </div>

            {/* Before / Raw Fragment */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '10px 14px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '12px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              color: '#cbd5e1'
            }}>
              <span style={{ color: 'var(--accent-rose)', fontWeight: 600, minWidth: '40px' }}>RAW:</span>
              <span>"{item.raw_transcript}"</span>
            </div>

            {/* After / Reconstructed Output */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
              padding: '14px 16px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 'var(--radius-md)',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                  Second Voice Spoken Output:
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.4 }}>
                  "{item.reconstructed_text}"
                </div>
              </div>

              {/* Replay TTS Audio Button */}
              <button
                onClick={() => handlePlayAudio(item)}
                aria-label="Play Voice"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 14px',
                  background: 'var(--accent-emerald)',
                  color: '#0a0d14',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  boxShadow: '0 0 16px rgba(16, 185, 129, 0.4)',
                  flexShrink: 0
                }}
              >
                <Volume2 size={18} />
                <span>Speak</span>
              </button>
            </div>

            {/* Alternative Suggestions */}
            {item.alternative_suggestions && item.alternative_suggestions.length > 0 && (
              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Quick Alternatives:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {item.alternative_suggestions.map((alt, aIdx) => (
                    <button
                      key={aIdx}
                      onClick={() => onSelectAlternative(alt)}
                      style={{
                        padding: '6px 10px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-muted)',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#ffffff';
                        e.currentTarget.style.borderColor = 'var(--accent-indigo)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--text-muted)';
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                      }}
                    >
                      {alt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
