import React, { useState } from 'react';
import { ReconstructionResult } from '../services/api';
import { speakWithBrowserTTS, playAudioBase64 } from '../services/audioRecorder';

interface HistoryScreenProps {
  historyList: ReconstructionResult[];
  onClearHistory?: () => void;
  onDeleteItem?: (index: number) => void;
  onUseItem?: (item: ReconstructionResult) => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  historyList,
  onClearHistory,
  onDeleteItem,
  onUseItem,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handlePlay = (item: ReconstructionResult) => {
    if (item.audio_base64) {
      playAudioBase64(item.audio_base64).catch(() => speakWithBrowserTTS(item.reconstructed_text));
    } else {
      speakWithBrowserTTS(item.reconstructed_text);
    }
    showToast('Playing neural voice audio...');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied sentence to clipboard!');
  };

  const filteredHistory = historyList.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      (item.raw_transcript && item.raw_transcript.toLowerCase().includes(q)) ||
      (item.reconstructed_text && item.reconstructed_text.toLowerCase().includes(q)) ||
      (item.detected_intent && item.detected_intent.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Header & Stat Summary */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', fontWeight: 800, color: '#1a1a19' }}>
            Conversation History & Logs
          </h1>
          <p style={{ fontSize: '14px', color: '#706a60', marginTop: '3px' }}>
            Complete audit trail of all real-time speech reconstructions and voice output
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              backgroundColor: '#f5efe4',
              padding: '6px 14px',
              borderRadius: '999px',
              fontSize: '13px',
              fontWeight: 700,
              color: '#6e550e',
              border: '1px solid #ede7df',
            }}
          >
            {historyList.length} Utterances Logged
          </span>

          {historyList.length > 0 && onClearHistory && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear your conversation history?')) {
                  onClearHistory();
                  showToast('History cleared.');
                }
              }}
              style={{
                backgroundColor: '#fee2e2',
                color: '#b91c1c',
                border: '1px solid #fecaca',
                borderRadius: '999px',
                padding: '6px 14px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Clear Log
            </button>
          )}
        </div>
      </div>

      {/* Search Input Bar */}
      <div style={{ position: 'relative' }}>
        <span
          className="material-symbols-outlined"
          style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#827c71',
            fontSize: '20px',
          }}
        >
          search
        </span>
        <input
          type="text"
          placeholder="Search past utterances, spoken words, or intents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            height: '46px',
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            padding: '0 16px 0 42px',
            border: '1px solid #ede7df',
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            color: '#1a1a19',
            outline: 'none',
          }}
        />
      </div>

      {/* Empty State */}
      {filteredHistory.length === 0 ? (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '48px 24px',
            textAlign: 'center',
            border: '1px dashed #ede7df',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: '#f5efe4',
              color: '#93721b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>
              history
            </span>
          </div>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 800, color: '#1a1a19' }}>
            {searchQuery ? 'No matching logs found' : 'No recorded utterances yet'}
          </h3>
          <p style={{ fontSize: '13px', color: '#706a60', marginTop: '4px', maxWidth: '380px', margin: '4px auto 0' }}>
            {searchQuery
              ? 'Try searching for a different keyword or phrasing.'
              : 'Every time you speak or type in the Communicate tab, the reconstructed sentence is logged here.'}
          </p>
        </div>
      ) : (
        /* History Feed Cards */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredHistory.map((item, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                padding: '20px 22px',
                border: '1px solid #ede7df',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {/* Header Badges */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      backgroundColor: '#fef3c7',
                      color: '#92400e',
                      padding: '3px 10px',
                      borderRadius: '999px',
                      fontWeight: 700,
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                      chat_bubble_outline
                    </span>
                    Intent: {item.detected_intent || 'General'}
                  </span>

                  <span
                    style={{
                      backgroundColor: '#e6f4ea',
                      color: '#137333',
                      padding: '3px 10px',
                      borderRadius: '999px',
                      fontWeight: 700,
                      fontSize: '12px',
                    }}
                  >
                    Confidence: {Math.round((item.confidence || 0.95) * 100)}%
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#7a7368' }}>
                  <span>{item.latency_ms || 180}ms</span>
                  <span>•</span>
                  <span>{item.provider || 'Second Voice Core'}</span>
                  {onDeleteItem && (
                    <button
                      onClick={() => onDeleteItem(idx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#9ca3af',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '2px',
                        marginLeft: '4px',
                      }}
                      title="Delete entry"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                        close
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Raw Spoken Utterance */}
              <div
                style={{
                  backgroundColor: '#faf7f2',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid #ede7df',
                  fontSize: '13px',
                  color: '#4f4a41',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ fontWeight: 800, color: '#dc2626', fontSize: '11px', textTransform: 'uppercase' }}>
                  RAW PHONEMES:
                </span>
                <span style={{ fontStyle: 'italic', fontWeight: 600 }}>“{item.raw_transcript}”</span>
              </div>

              {/* Reconstructed Sentence */}
              <div
                style={{
                  backgroundColor: '#fcf6e9',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  border: '1px solid #f2e2be',
                  fontSize: '17px',
                  fontWeight: 700,
                  color: '#1a1a19',
                  lineHeight: 1.4,
                }}
              >
                “{item.reconstructed_text}”
              </div>

              {/* Action Controls */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '4px' }}>
                {onUseItem && (
                  <button
                    onClick={() => onUseItem(item)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '10px',
                      backgroundColor: '#fbf8f4',
                      color: '#2a2723',
                      border: '1px solid #ede7df',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '17px', color: '#93721b' }}>
                      replay
                    </span>
                    <span>Use Again</span>
                  </button>
                )}

                <button
                  onClick={() => handleCopy(item.reconstructed_text)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    backgroundColor: '#fbf8f4',
                    color: '#2a2723',
                    border: '1px solid #ede7df',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '17px', color: '#736d62' }}>
                    content_copy
                  </span>
                  <span>Copy</span>
                </button>

                <button
                  onClick={() => handlePlay(item)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '10px',
                    backgroundColor: '#775a01',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 6px rgba(119, 90, 1, 0.2)',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    volume_up
                  </span>
                  <span>Re-Speak</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '32px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            backgroundColor: '#1c1b1a',
            color: '#fdf8f5',
            padding: '12px 24px',
            borderRadius: '14px',
            boxShadow: '0 6px 24px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#c9a44c' }}>
            info
          </span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
