import React from 'react';
import { ReconstructionResult } from '../services/api';
import { speakWithBrowserTTS, playAudioBase64 } from '../services/audioRecorder';

interface HistoryScreenProps {
  historyList: ReconstructionResult[];
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ historyList }) => {
  const handlePlay = (item: ReconstructionResult) => {
    if (item.audio_base64) {
      playAudioBase64(item.audio_base64).catch(() => speakWithBrowserTTS(item.reconstructed_text));
    } else {
      speakWithBrowserTTS(item.reconstructed_text);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 700, color: 'var(--on-surface)' }}>
            Conversation History
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>
            Logged real-time speech transformations
          </p>
        </div>
        <span style={{
          backgroundColor: 'var(--surface-container-low)',
          padding: '4px 12px',
          borderRadius: '999px',
          fontSize: '12px',
          fontWeight: 600,
          border: '1px solid var(--outline-variant)'
        }}>
          {historyList.length} Sessions
        </span>
      </div>

      {historyList.length === 0 ? (
        <div style={{
          backgroundColor: 'var(--surface-container-lowest)',
          borderRadius: '16px',
          padding: '40px 20px',
          textAlign: 'center',
          border: '1px dashed var(--outline-variant)'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'var(--primary)', marginBottom: '8px' }}>
            schedule
          </span>
          <p style={{ fontWeight: 600, color: 'var(--on-surface)' }}>No recorded utterances yet</p>
          <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', marginTop: '4px' }}>
            Transformations from the Communicate tab will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {historyList.map((item, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: 'var(--surface-container-lowest)',
                borderRadius: '16px',
                padding: '16px',
                border: '1px solid var(--outline-variant)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{
                  backgroundColor: 'var(--secondary-fixed)',
                  color: 'var(--on-secondary-fixed)',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  fontWeight: 600
                }}>
                  {item.detected_intent}
                </span>
                <span style={{ color: 'var(--on-surface-variant)' }}>
                  {item.latency_ms}ms • {Math.round(item.confidence * 100)}% Confidence
                </span>
              </div>

              {/* Raw vs Reconstructed */}
              <div style={{
                backgroundColor: 'var(--surface-container-low)',
                padding: '8px 12px',
                borderRadius: '8px',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                color: 'var(--on-surface-variant)'
              }}>
                <strong style={{ color: 'var(--error)' }}>RAW:</strong> "{item.raw_transcript}"
              </div>

              <div style={{
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--on-surface)',
                lineHeight: 1.4
              }}>
                "{item.reconstructed_text}"
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '4px' }}>
                <button
                  onClick={() => handleCopy(item.reconstructed_text)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--surface-container-low)',
                    color: 'var(--on-surface)',
                    border: '1px solid var(--outline-variant)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 600
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>content_copy</span>
                  <span>Copy</span>
                </button>

                <button
                  onClick={() => handlePlay(item)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--primary)',
                    color: 'var(--on-primary)',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 700
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>volume_up</span>
                  <span>Play</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
