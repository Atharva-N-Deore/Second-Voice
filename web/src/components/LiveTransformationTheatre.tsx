import React, { useState } from 'react';

export interface TranscriptionItem {
  id: string;
  timestamp: string;
  originalText: string;
  cleaned_text?: string;
  reconstructed_text: string;
  confidence: number;
  detected_intent?: string;
  alternatives?: string[];
  audio_base64?: string;
  latency_ms?: number;
}

interface LiveTransformationTheatreProps {
  items: TranscriptionItem[];
  onPlayAudio: (base64Audio: string, textFallback?: string) => void;
  onClearHistory: () => void;
}

export const LiveTransformationTheatre: React.FC<LiveTransformationTheatreProps> = ({
  items,
  onPlayAudio,
  onClearHistory,
}) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handlePlay = (item: TranscriptionItem) => {
    setPlayingId(item.id);
    if (item.audio_base64) {
      onPlayAudio(item.audio_base64, item.reconstructed_text);
    } else {
      onPlayAudio('', item.reconstructed_text);
    }
    setTimeout(() => {
      setPlayingId(null);
    }, 3000);
  };

  const handleCopy = (item: TranscriptionItem) => {
    navigator.clipboard.writeText(item.reconstructed_text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const latestItem = items.length > 0 ? items[0] : null;
  const historyItems = items.length > 1 ? items.slice(1) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Theatre Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--gold-primary)', fontSize: '22px' }}>
            record_voice_over
          </span>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 800, margin: 0 }}>
            Live Transformation Theatre
          </h3>
        </div>
        {items.length > 0 && (
          <button
            onClick={onClearHistory}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-dim)',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--rose-alert)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-dim)')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Latest Live Transformation Spotlight Card */}
      {latestItem ? (
        <div
          className="lux-panel"
          style={{
            padding: '24px',
            border: '1px solid var(--border-gold)',
            boxShadow: '0 8px 32px rgba(201, 164, 76, 0.12)',
            position: 'relative',
          }}
        >
          {/* Top Badge Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  padding: '3px 8px',
                  borderRadius: '999px',
                  backgroundColor: 'var(--gold-surface)',
                  color: 'var(--gold-bright)',
                  border: '1px solid var(--border-gold)',
                }}
              >
                Active Broadcast
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                {latestItem.timestamp}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--emerald-accent)',
                  backgroundColor: 'var(--emerald-surface)',
                  padding: '3px 8px',
                  borderRadius: '999px',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                {Math.round(latestItem.confidence * 100)}% Confidence
              </span>
              {latestItem.latency_ms && (
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-dim)',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    padding: '3px 8px',
                    borderRadius: '999px',
                  }}
                >
                  {Math.round(latestItem.latency_ms)}ms
                </span>
              )}
            </div>
          </div>

          {/* Before & After Transformation Layout */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
              marginBottom: '18px',
            }}
          >
            {/* Raw Phoneme / Input */}
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--rose-alert)' }}>
                  graphic_eq
                </span>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.04em' }}>
                  Raw Speech / Fragment
                </span>
              </div>
              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--text-muted)',
                  fontStyle: 'italic',
                  margin: 0,
                  lineHeight: 1.5,
                  wordBreak: 'break-word',
                }}
              >
                "{latestItem.originalText || latestItem.cleaned_text}"
              </p>
            </div>

            {/* Reconstructed Natural Voice Output */}
            <div
              style={{
                backgroundColor: 'var(--gold-surface)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                border: '1px solid var(--border-gold)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--gold-bright)' }}>
                    auto_awesome
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--gold-bright)', letterSpacing: '0.04em' }}>
                    Neural Reconstructed Voice
                  </span>
                </div>
                <p
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-heading)',
                    color: 'var(--text-main)',
                    margin: 0,
                    lineHeight: 1.4,
                    wordBreak: 'break-word',
                  }}
                >
                  "{latestItem.reconstructed_text}"
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
                <button
                  onClick={() => handlePlay(latestItem)}
                  className="btn-lux"
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    {playingId === latestItem.id ? 'graphic_eq' : 'volume_up'}
                  </span>
                  <span>{playingId === latestItem.id ? 'Speaking...' : 'Speak Audio'}</span>
                </button>

                <button
                  onClick={() => handleCopy(latestItem)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    {copiedId === latestItem.id ? 'check' : 'content_copy'}
                  </span>
                  <span>{copiedId === latestItem.id ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Alternatives row if available */}
          {latestItem.alternatives && latestItem.alternatives.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', marginBottom: '6px' }}>
                Alternative Interpretations:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {latestItem.alternatives.map((alt, i) => (
                  <button
                    key={i}
                    onClick={() => onPlayAudio('', alt)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-muted)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--gold-primary)';
                      e.currentTarget.style.color = 'var(--gold-bright)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                      e.currentTarget.style.color = 'var(--text-muted)';
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>volume_up</span>
                    <span>"{alt}"</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div
          className="lux-panel"
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--gold-surface)',
              border: '1px solid var(--border-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--gold-bright)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>
              graphic_eq
            </span>
          </div>
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, margin: 0 }}>
            Awaiting Speech Stream
          </h4>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '380px', margin: 0, lineHeight: 1.5 }}>
            Press the push-to-talk button or type any phrase above. The AI will reconstruct natural acoustic cadence and neural audio in real-time.
          </p>
        </div>
      )}

      {/* History Log */}
      {historyItems.length > 0 && (
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
            Previous Exchanges ({historyItems.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {historyItems.map((item) => (
              <div
                key={item.id}
                className="lux-panel"
                style={{
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{item.timestamp}</span>
                    <span style={{ fontSize: '11px', color: 'var(--emerald-accent)', fontFamily: 'var(--font-mono)' }}>
                      {Math.round(item.confidence * 100)}%
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '2px' }}>
                    "{item.reconstructed_text}"
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                    Raw: "{item.originalText || item.cleaned_text}"
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => handlePlay(item)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--gold-surface)',
                      border: '1px solid var(--border-gold)',
                      color: 'var(--gold-bright)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      {playingId === item.id ? 'graphic_eq' : 'volume_up'}
                    </span>
                  </button>
                  <button
                    onClick={() => handleCopy(item)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      {copiedId === item.id ? 'check' : 'content_copy'}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
