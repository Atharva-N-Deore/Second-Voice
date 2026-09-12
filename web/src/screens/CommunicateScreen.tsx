import React, { useState, useEffect } from 'react';
import { AudioRecorder, speakWithBrowserTTS, playAudioBase64 } from '../services/audioRecorder';
import { processSpeechAudio, reconstructText, ReconstructionResult, UserSpeechProfile } from '../services/api';

interface CommunicateScreenProps {
  profile: UserSpeechProfile;
  onNavigateTab: (tab: string) => void;
  onOpenEmergency: () => void;
}

export const CommunicateScreen: React.FC<CommunicateScreenProps> = ({
  profile,
  onNavigateTab,
  onOpenEmergency,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recorder, setRecorder] = useState<AudioRecorder | null>(null);
  const [fragmentInput, setFragmentInput] = useState('');
  
  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active reconstructed item state
  const [activeItem, setActiveItem] = useState<ReconstructionResult>({
    raw_transcript: 'meeting... late... tell Rahul...',
    reconstructed_text: 'Please tell Rahul that I will be 10 minutes late to our morning sync.',
    confidence: 0.96,
    detected_intent: 'Send Message',
    alternative_suggestions: [
      'I am running a few minutes late for the sync with Rahul.',
      'Can you please let Rahul know I will join shortly?'
    ],
    explanation: 'Mapped meeting tardiness fragments to active work colleague Rahul.',
    latency_ms: 280,
    provider: 'Second Voice Neural Core'
  });

  const [voiceVolume, setVoiceVolume] = useState(80);

  useEffect(() => {
    setRecorder(new AudioRecorder());
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleToggleRecord = async () => {
    if (!recorder || isProcessing) return;

    if (!isRecording) {
      try {
        setIsRecording(true);
        showToast('Acoustic sensor calibrated. Listening...');
        await recorder.start((vol) => setVolumeLevel(vol));
      } catch (err) {
        console.error('Mic error:', err);
        setIsRecording(false);
        showToast('Microphone access denied or unavailable.');
      }
    } else {
      setIsRecording(false);
      setVolumeLevel(0);
      setIsProcessing(true);
      showToast('Analyzing phonemes & constructing sentence...');
      try {
        const audioBlob = await recorder.stop();
        if (audioBlob.size > 0) {
          const result = await processSpeechAudio(audioBlob, 'Workplace & Meetings', profile);
          setActiveItem(result);
          showToast('Utterance reconstructed successfully!');
          // Auto speak
          if (result.reconstructed_text) {
            handleSpeak(result.reconstructed_text);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleFragmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fragmentInput.trim() || isProcessing) return;
    const text = fragmentInput;
    setFragmentInput('');
    setIsProcessing(true);
    showToast('Reconstructing sentence from fragments...');
    try {
      const res = await reconstructText(text, 'General', profile);
      setActiveItem(res);
      showToast('Sentence ready!');
      handleSpeak(res.reconstructed_text);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSpeak = (text: string) => {
    if (activeItem.audio_base64) {
      playAudioBase64(activeItem.audio_base64).catch(() => {
        speakWithBrowserTTS(text);
      });
    } else {
      speakWithBrowserTTS(text);
    }
    showToast('Speaking aloud through high-fidelity speaker...');
  };

  const handleCopy = () => {
    if (activeItem?.reconstructed_text) {
      navigator.clipboard.writeText(activeItem.reconstructed_text);
      showToast('Sentence copied to clipboard!');
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Greeting & Status Banner */}
      <section style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '24px',
            fontWeight: 700,
            color: 'var(--on-surface)',
            lineHeight: 1.2
          }}>
            Good morning, Alex
          </h1>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            color: 'var(--on-surface-variant)',
            marginTop: '2px'
          }}>
            Your voice assistant is ready • Calibration: 87%
          </p>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: 'var(--tertiary-fixed)',
          color: 'var(--on-tertiary-fixed-variant)',
          padding: '4px 12px',
          borderRadius: '999px',
          fontWeight: 600,
          fontSize: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'var(--tertiary)',
            display: 'inline-block'
          }} className="animate-pulse" />
          <span>Engine Active</span>
        </div>
      </section>

      {/* Top Quick Access Utility Bar (Emergency + Voice Level) */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '10px' }}>
        <button
          onClick={onOpenEmergency}
          aria-label="Emergency Mode"
          style={{
            gridColumn: 'span 8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            backgroundColor: 'var(--surface-container-lowest)',
            borderRadius: '16px',
            border: '1px solid var(--outline-variant)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: 'var(--error)',
              display: 'inline-block'
            }} className="animate-ping" />
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--error)',
              letterSpacing: '-0.01em'
            }}>
              I NEED HELP
            </span>
          </div>
          <span style={{ fontSize: '13px', color: 'var(--on-surface-variant)' }}>
            Emergency Menu →
          </span>
        </button>

        <button
          onClick={() => setVoiceVolume(voiceVolume >= 100 ? 50 : voiceVolume + 25)}
          aria-label="Speech Output Level"
          style={{
            gridColumn: 'span 4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '12px 10px',
            backgroundColor: 'var(--surface-container-lowest)',
            borderRadius: '16px',
            border: '1px solid var(--outline-variant)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--on-surface)'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--primary)' }}>
            volume_up
          </span>
          <span>Voice: {voiceVolume}%</span>
        </button>
      </section>

      {/* Primary Speech Activation Zone */}
      <section style={{
        position: 'relative',
        backgroundColor: 'var(--surface-container-lowest)',
        borderRadius: '20px',
        padding: '28px 20px',
        textAlign: 'center',
        boxShadow: '0 4px 16px rgba(119, 90, 1, 0.05)',
        border: '1px solid var(--outline-variant)',
        overflow: 'hidden'
      }}>
        {/* Ambient Gold Glows */}
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '140px',
          height: '140px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 223, 154, 0.35)',
          filter: 'blur(30px)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-40px',
          left: '-40px',
          width: '140px',
          height: '140px',
          borderRadius: '50%',
          backgroundColor: 'rgba(253, 209, 127, 0.35)',
          filter: 'blur(30px)',
          pointerEvents: 'none'
        }} />

        {/* Microphone Button with Glow Rings */}
        <div style={{
          position: 'relative',
          margin: '12px auto 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '130px',
          height: '130px'
        }}>
          {isRecording && (
            <div style={{
              position: 'absolute',
              width: '130px',
              height: '130px',
              borderRadius: '50%',
              backgroundColor: 'rgba(201, 164, 76, 0.35)',
            }} className="animate-ping" />
          )}

          <div style={{
            position: 'absolute',
            width: '115px',
            height: '115px',
            borderRadius: '50%',
            backgroundColor: 'rgba(253, 209, 127, 0.5)',
          }} />

          <button
            id="micButton"
            onClick={handleToggleRecord}
            disabled={isProcessing}
            aria-label="Tap to speak or hold for continuous listening"
            style={{
              position: 'relative',
              zIndex: 10,
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              backgroundColor: isRecording ? 'var(--error)' : 'var(--primary-container)',
              color: isRecording ? '#ffffff' : 'var(--on-primary-container)',
              border: 'none',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isRecording
                ? '0 6px 24px rgba(186, 26, 26, 0.4)'
                : '0 6px 20px rgba(119, 90, 1, 0.25)',
              transition: 'transform 0.15s ease',
              transform: isRecording ? `scale(${1 + volumeLevel * 0.2})` : 'scale(1)'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '42px', lineHeight: 1 }}>
              {isRecording ? 'stop' : 'mic'}
            </span>
          </button>
        </div>

        <h2 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '20px',
          fontWeight: 700,
          color: 'var(--on-surface)',
          marginBottom: '4px'
        }}>
          {isRecording ? 'Listening to speech...' : isProcessing ? 'Reconstructing...' : 'Tap to Speak'}
        </h2>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
          color: 'var(--on-surface-variant)',
          marginBottom: '14px'
        }}>
          or hold for continuous acoustic tracking
        </p>

        {/* Dynamic Waveform Visualizer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '5px',
          height: '28px',
          maxWidth: '220px',
          margin: '0 auto 16px'
        }}>
          {[...Array(9)].map((_, i) => (
            <span
              key={i}
              style={{
                width: '6px',
                borderRadius: '999px',
                backgroundColor: i % 2 === 0 ? 'var(--primary)' : 'var(--primary-container)',
                height: isRecording
                  ? `${Math.max(6, Math.sin(i + Date.now() / 150) * 22 * (volumeLevel + 0.3) + 8)}px`
                  : `${(i % 3 + 1) * 6}px`,
                transition: 'height 0.1s ease'
              }}
            />
          ))}
        </div>

        {/* Text Fallback Field */}
        <form onSubmit={handleFragmentSubmit} style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'var(--surface-container-low)',
          borderRadius: '12px',
          padding: '4px 8px 4px 14px',
          border: '1px solid var(--outline-variant)'
        }}>
          <input
            type="text"
            placeholder="or type fragmented thoughts..."
            value={fragmentInput}
            onChange={(e) => setFragmentInput(e.target.value)}
            disabled={isProcessing}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              fontFamily: 'var(--font-body)',
              fontSize: '15px',
              color: 'var(--on-surface)',
              minHeight: '40px'
            }}
          />
          <button
            type="submit"
            disabled={isProcessing || !fragmentInput.trim()}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'var(--primary-container)',
              color: 'var(--on-primary-container)',
              border: 'none',
              cursor: isProcessing || !fragmentInput.trim() ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_forward</span>
          </button>
        </form>
      </section>

      {/* Live AI Interpretation Card */}
      {activeItem && (
        <section style={{
          backgroundColor: 'var(--surface-container-lowest)',
          borderRadius: '20px',
          padding: '18px',
          boxShadow: '0 4px 16px rgba(119, 90, 1, 0.05)',
          border: '1px solid var(--outline-variant)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {/* Header with Badges */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--primary)' }}>
                graphic_eq
              </span>
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--on-surface)'
              }}>
                Live Speech Detected
              </span>
            </div>
            <span style={{
              backgroundColor: 'var(--secondary-fixed)',
              color: 'var(--on-secondary-fixed)',
              fontSize: '12px',
              fontWeight: 600,
              padding: '2px 10px',
              borderRadius: '999px'
            }}>
              AI Confidence {Math.round(activeItem.confidence * 100)}%
            </span>
          </div>

          {/* Detected Fragmented Speech */}
          <div style={{
            backgroundColor: 'var(--surface-container-low)',
            padding: '12px 14px',
            borderRadius: '12px'
          }}>
            <span style={{ fontSize: '11px', color: 'var(--on-surface-variant)', fontWeight: 600, textTransform: 'uppercase' }}>
              Raw Speech Input:
            </span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: '15px',
                fontStyle: 'italic',
                color: 'var(--on-surface-variant)'
              }}>
                “{activeItem.raw_transcript}”
              </span>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>
                mic_none
              </span>
            </div>
          </div>

          {/* Transformation Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'rgba(201, 164, 76, 0.2)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span className="material-symbols-outlined animate-bounce" style={{ fontSize: '18px' }}>
                arrow_downward
              </span>
            </div>
          </div>

          {/* Reconstructed Natural Sentence Display */}
          <div style={{
            backgroundColor: 'rgba(255, 223, 154, 0.3)',
            padding: '16px',
            borderRadius: '14px',
            border: '1px solid rgba(201, 164, 76, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--on-primary-fixed-variant)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Reconstructed Sentence
              </span>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>
                verified
              </span>
            </div>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--on-surface)',
              lineHeight: 1.45
            }}>
              “{activeItem.reconstructed_text}”
            </p>

            {/* Context & Metadata Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
              <span style={{
                backgroundColor: 'var(--surface-container-lowest)',
                color: 'var(--on-surface)',
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--tertiary)' }}>chat</span>
                Intent: {activeItem.detected_intent}
              </span>
              <span style={{
                backgroundColor: 'var(--surface-container-lowest)',
                color: 'var(--on-surface)',
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--primary)' }}>person</span>
                Context: Work → Rahul
              </span>
            </div>
          </div>

          {/* Autonomy Protocol Notice */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            backgroundColor: 'var(--surface-container)',
            borderRadius: '8px',
            fontSize: '12px',
            color: 'var(--on-surface-variant)'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>shield</span>
            <span>Protocol: AI Proposes • You Confirm • Second Voice Executes</span>
          </div>

          {/* Action Execution Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Primary Speak Button */}
            <button
              id="speakBtn"
              onClick={() => handleSpeak(activeItem.reconstructed_text)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '14px 18px',
                backgroundColor: 'var(--primary)',
                color: 'var(--on-primary)',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-heading)',
                fontSize: '16px',
                fontWeight: 700,
                boxShadow: '0 2px 8px rgba(119, 90, 1, 0.2)',
                minHeight: '52px'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>volume_up</span>
              <span>Speak Out Loud</span>
            </button>

            {/* Secondary Actions 2x2 Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              <button
                onClick={() => showToast('Dispatched to Rahul via Slack/Email!')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px 8px',
                  backgroundColor: 'var(--surface-container-low)',
                  color: 'var(--on-surface)',
                  borderRadius: '10px',
                  border: '1px solid var(--outline-variant)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--tertiary)' }}>send</span>
                <span>Send to Rahul</span>
              </button>

              <button
                id="copyBtn"
                onClick={handleCopy}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px 8px',
                  backgroundColor: 'var(--surface-container-low)',
                  color: 'var(--on-surface)',
                  borderRadius: '10px',
                  border: '1px solid var(--outline-variant)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>content_copy</span>
                <span>Copy Text</span>
              </button>

              <button
                onClick={() => setFragmentInput(activeItem.reconstructed_text)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px 8px',
                  backgroundColor: 'var(--surface-container-low)',
                  color: 'var(--on-surface)',
                  borderRadius: '10px',
                  border: '1px solid var(--outline-variant)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                <span>Refine / Edit</span>
              </button>

              <button
                onClick={handleToggleRecord}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px 8px',
                  backgroundColor: 'var(--surface-container-low)',
                  color: 'var(--on-surface)',
                  borderRadius: '10px',
                  border: '1px solid var(--outline-variant)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>restart_alt</span>
                <span>Try Again</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Quick Express Phrases */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '16px',
            fontWeight: 700,
            color: 'var(--on-surface)'
          }}>
            Quick Express
          </span>
          <button
            onClick={() => onNavigateTab('vocabulary')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              fontFamily: 'var(--font-heading)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Manage Vocabulary
          </button>
        </div>

        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px'
        }}>
          {[
            { icon: 'medical_services', color: 'var(--tertiary)', text: 'Doctor appointment' },
            { icon: 'replay', color: 'var(--primary)', text: 'Please repeat that' },
            { icon: 'local_drink', color: 'var(--primary)', text: 'Need water' },
            { icon: 'favorite', color: 'var(--tertiary)', text: 'Thank you' },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => handleSpeak(item.text)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 16px',
                backgroundColor: 'var(--surface-container-lowest)',
                color: 'var(--on-surface)',
                borderRadius: '999px',
                border: '1px solid var(--outline-variant)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontWeight: 600,
                fontSize: '14px',
                flexShrink: 0
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: item.color }}>
                {item.icon}
              </span>
              <span>{item.text}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Floating Toast Alert */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '96px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 60,
          backgroundColor: 'var(--inverse-surface)',
          color: 'var(--inverse-on-surface)',
          padding: '10px 20px',
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          transition: 'all 0.2s ease'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--tertiary-fixed)' }}>
            check_circle
          </span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
