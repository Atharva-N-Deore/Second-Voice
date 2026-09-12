import React, { useState, useEffect } from 'react';
import { AudioRecorder, speakWithBrowserTTS, playAudioBase64 } from '../services/audioRecorder';
import { processSpeechAudio, reconstructText, ReconstructionResult, UserSpeechProfile } from '../services/api';

interface CommunicateScreenProps {
  profile: UserSpeechProfile;
  onNavigateTab: (tab: string) => void;
  onOpenEmergency: () => void;
  onAddToHistory?: (item: ReconstructionResult) => void;
}

export const CommunicateScreen: React.FC<CommunicateScreenProps> = ({
  profile,
  onNavigateTab,
  onOpenEmergency,
  onAddToHistory,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recorder, setRecorder] = useState<AudioRecorder | null>(null);
  const [fragmentInput, setFragmentInput] = useState('');
  const [voiceVolume, setVoiceVolume] = useState(80);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeContext, setActiveContext] = useState<string>('General');
  const [inputSource, setInputSource] = useState<'voice' | 'keyboard'>('voice');

  // Active reconstructed utterance state
  const [activeItem, setActiveItem] = useState<ReconstructionResult>({
    raw_transcript: 'hello i am karan',
    reconstructed_text: 'Hello, I am Karan.',
    confidence: 0.98,
    detected_intent: 'Greeting & Introduction',
    alternative_suggestions: [
      'Hi, my name is Karan.',
      'Hello everyone, I am Karan.'
    ],
    explanation: 'Recognized speaker introduction and formatted polite greeting.',
    latency_ms: 180,
    provider: 'Second Voice Neural Core'
  });

  useEffect(() => {
    setRecorder(new AudioRecorder());
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  const handleToggleRecord = async () => {
    if (!recorder || isProcessing) return;

    if (!isRecording) {
      try {
        setIsRecording(true);
        setInputSource('voice');
        setFragmentInput('');
        setActiveItem((prev) => ({
          ...prev,
          raw_transcript: 'Listening... speak now',
        }));
        showToast('Listening... Speak naturally or in fragments.');

        await recorder.start(
          (vol) => setVolumeLevel(vol),
          (liveText) => {
            if (liveText && liveText.trim()) {
              setActiveItem((prev) => ({
                ...prev,
                raw_transcript: liveText,
              }));
            }
          }
        );
      } catch (err) {
        console.error('Microphone error:', err);
        setIsRecording(false);
        showToast('Microphone access denied. You can type words directly below.');
      }
    } else {
      setIsRecording(false);
      setVolumeLevel(0);
      setIsProcessing(true);
      setInputSource('voice');
      showToast('Processing speech & constructing sentence...');

      try {
        const { blob, transcript } = await recorder.stop();
        const spokenFromLive = (activeItem.raw_transcript && activeItem.raw_transcript !== 'Listening... speak now') ? activeItem.raw_transcript.trim() : '';
        const rawSpoken = transcript.trim() || spokenFromLive || fragmentInput.trim();

        let result: ReconstructionResult;

        // Try backend audio processing with speech transcript forwarded
        if (blob && blob.size > 2000) {
          result = await processSpeechAudio(blob, activeContext, profile, rawSpoken);
          // If backend STT did not recognize speech, but browser speech recognition caught real words, reconstruct real spoken words!
          const isSTTUnrecognized = !result.raw_transcript || result.raw_transcript === 'No speech detected' || result.raw_transcript === '.' || result.raw_transcript.trim() === '';
          if (isSTTUnrecognized && rawSpoken.length > 0) {
            result = await reconstructText(rawSpoken, activeContext, profile);
          }
        } else if (rawSpoken.length > 0) {
          result = await reconstructText(rawSpoken, activeContext, profile);
        } else {
          result = {
            raw_transcript: 'No speech detected',
            reconstructed_text: 'Could you please repeat that? I did not hear clearly.',
            confidence: 0.5,
            detected_intent: 'clarification',
            alternative_suggestions: ['Please say that again.'],
            latency_ms: 100,
            provider: 'secondvoice-core'
          };
        }

        if ((!result.raw_transcript || result.raw_transcript === 'No speech detected') && rawSpoken.length > 0) {
          result.raw_transcript = rawSpoken;
        }

        setActiveItem(result);
        setFragmentInput('');
        if (onAddToHistory && result.reconstructed_text && result.raw_transcript !== 'No speech detected') {
          onAddToHistory(result);
        }
        showToast('Utterance reconstructed!');
        if (result.reconstructed_text) {
          handleSpeak(result.reconstructed_text, result.audio_base64);
        }
      } catch (e) {
        console.error('Reconstruction error:', e);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleFragmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fragmentInput.trim() || isProcessing) return;
    const text = fragmentInput.trim();
    setIsProcessing(true);
    setInputSource('keyboard');
    showToast('Reconstructing sentence with AI...');
    try {
      const res = await reconstructText(text, activeContext, profile);
      setActiveItem(res);
      if (onAddToHistory && res.reconstructed_text) {
        onAddToHistory(res);
      }
      showToast('Sentence ready!');
      if (res.reconstructed_text) {
        handleSpeak(res.reconstructed_text, res.audio_base64);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (val: string) => {
    setFragmentInput(val);
  };

  const handleSpeak = (text: string, customAudioBase64?: string) => {
    const audioToPlay = customAudioBase64 !== undefined ? customAudioBase64 : activeItem.audio_base64;
    if (audioToPlay) {
      playAudioBase64(audioToPlay).catch(() => {
        speakWithBrowserTTS(text);
      });
    } else {
      speakWithBrowserTTS(text);
    }
    showToast('Speaking aloud through neural voice...');
  };

  const handleCopy = () => {
    if (activeItem?.reconstructed_text) {
      navigator.clipboard.writeText(activeItem.reconstructed_text);
      showToast('Sentence copied to clipboard!');
    }
  };

  const handleRefine = () => {
    if (activeItem?.reconstructed_text) {
      setFragmentInput(activeItem.reconstructed_text);
      showToast('Loaded into input box for editing.');
    }
  };

  const handleRegenerate = async () => {
    if (!activeItem?.raw_transcript || isProcessing) return;
    setIsProcessing(true);
    showToast('Regenerating alternative phrasing...');
    try {
      const res = await reconstructText(activeItem.raw_transcript, activeContext, profile);
      setActiveItem(res);
      showToast('New phrasing generated!');
      handleSpeak(res.reconstructed_text, res.audio_base64);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Top Greeting & Status Bar */}
      <section style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '28px',
              fontWeight: 800,
              color: '#1a1a19',
              lineHeight: 1.15,
            }}
          >
            Good morning, Alex
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              color: '#706a60',
              marginTop: '4px',
            }}
          >
            Your personalized neural voice assistant is active • Ambient calibration at 87%
          </p>
        </div>

        {/* Right Status Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Engine Active Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#d8eedc',
              color: '#1a6428',
              padding: '6px 14px',
              borderRadius: '999px',
              fontWeight: 700,
              fontSize: '13px',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#16a34a',
                display: 'inline-block',
              }}
              className="animate-pulse"
            />
            <span>Engine Active</span>
          </div>

          {/* Voice Volume Pill */}
          <button
            onClick={() => setVoiceVolume(voiceVolume >= 100 ? 50 : voiceVolume + 20)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#ffffff',
              color: '#1a1a19',
              padding: '6px 14px',
              borderRadius: '999px',
              border: '1px solid #ede7df',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
            }}
            title="Adjust Neural Voice Volume"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#655e54' }}>
              volume_up
            </span>
            <span>Voice: {voiceVolume}%</span>
          </button>
        </div>
      </section>

      {/* Main Responsive 2-Column Grid */}
      <div className="communicate-workspace-grid">
        
        {/* LEFT COLUMN: Acoustic Tracking Zone + Quick Express */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Card 1: ACOUSTIC TRACKING ZONE */}
          <section
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              padding: '28px 24px',
              border: '1px solid #ede7df',
              boxShadow: '0 2px 12px rgba(119, 90, 1, 0.03)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
              textAlign: 'center',
            }}
          >
            {/* Header with Tracking tag & Matrix badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: isRecording ? '#dc2626' : '#c49a2c',
                    display: 'inline-block',
                  }}
                  className={isRecording ? 'animate-ping' : ''}
                />
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    color: '#49443c',
                    textTransform: 'uppercase',
                  }}
                >
                  {isRecording ? 'RECORDING VOICE PHONEMES' : 'ACOUSTIC TRACKING ZONE'}
                </span>
              </div>

              <span
                style={{
                  backgroundColor: '#f5efe4',
                  color: '#5b5449',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '999px',
                }}
              >
                Dual-Mic Matrix
              </span>
            </div>

            {/* Central Glowing Listening Orb */}
            <div
              style={{
                position: 'relative',
                margin: '12px auto 16px',
                width: '160px',
                height: '160px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Outer Golden Ambient Halo */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  background: isRecording
                    ? 'radial-gradient(circle, rgba(254, 202, 202, 0.7) 0%, rgba(254, 226, 226, 0.3) 65%, transparent 100%)'
                    : 'radial-gradient(circle, rgba(247, 219, 149, 0.6) 0%, rgba(253, 241, 209, 0.2) 65%, transparent 100%)',
                  pointerEvents: 'none',
                }}
                className={isRecording ? 'animate-ping' : ''}
              />

              <div
                style={{
                  position: 'absolute',
                  width: '140px',
                  height: '140px',
                  borderRadius: '50%',
                  background: isRecording
                    ? 'radial-gradient(circle, rgba(252, 165, 165, 0.5) 0%, rgba(254, 202, 202, 0.3) 70%, transparent 100%)'
                    : 'radial-gradient(circle, rgba(235, 196, 105, 0.4) 0%, rgba(253, 236, 196, 0.2) 70%, transparent 100%)',
                  pointerEvents: 'none',
                }}
              />

              {/* Main Circular Microphone Orb */}
              <button
                id="mainMicOrb"
                onClick={handleToggleRecord}
                disabled={isProcessing}
                style={{
                  position: 'relative',
                  zIndex: 10,
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  backgroundColor: isRecording ? '#dc2626' : '#93721b',
                  color: '#ffffff',
                  border: 'none',
                  cursor: isProcessing ? 'wait' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  boxShadow: isRecording
                    ? '0 8px 30px rgba(220, 38, 38, 0.45)'
                    : '0 8px 26px rgba(147, 114, 27, 0.35)',
                  transition: 'transform 0.15s ease, background-color 0.2s ease',
                  transform: isRecording ? `scale(${1.06 + volumeLevel * 0.16})` : 'scale(1)',
                }}
                aria-label="Tap to speak"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>
                  {isRecording ? 'stop' : 'mic'}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '9px',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'rgba(255, 255, 255, 0.95)',
                  }}
                >
                  {isRecording ? 'STOP & PROCESS' : 'LISTENING'}
                </span>
              </button>
            </div>

            {/* Title & Description */}
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '20px',
                fontWeight: 800,
                color: '#1a1a19',
                marginBottom: '6px',
              }}
            >
              {isRecording ? 'Listening to your voice...' : isProcessing ? 'Constructing Sentence with AI...' : 'Tap to Speak'}
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                color: '#6e685e',
                maxWidth: '420px',
                lineHeight: 1.45,
                marginBottom: '16px',
              }}
            >
              Speak fragments, dysarthric syllables, or natural voice. The engine synthesizes intended sentences automatically.
            </p>

            {/* Audio Waveform Equalizer Bars */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                height: '24px',
                marginBottom: '20px',
              }}
            >
              {[12, 18, 24, 16, 22, 14, 20, 12, 16].map((h, i) => (
                <span
                  key={i}
                  style={{
                    width: '4px',
                    borderRadius: '999px',
                    backgroundColor: isRecording ? '#dc2626' : i % 2 === 0 ? '#93721b' : '#c9a44c',
                    height: isRecording
                      ? `${Math.max(8, Math.sin(i * 1.5 + Date.now() / 120) * 18 * (volumeLevel + 0.4) + 10)}px`
                      : `${h * 0.7}px`,
                    transition: 'height 0.1s ease',
                  }}
                />
              ))}
            </div>

            {/* Bottom Keyboard Input - Synchronized live */}
            <form
              onSubmit={handleFragmentSubmit}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: isRecording ? '#fff7ed' : '#faf7f2',
                borderRadius: '14px',
                padding: '5px 6px 5px 14px',
                border: isRecording ? '1.5px solid #fdba74' : '1px solid #e7e1d6',
                transition: 'all 0.2s ease',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: '20px',
                  color: isRecording ? '#ea580c' : '#827c71',
                  marginRight: '8px',
                }}
              >
                {isRecording ? 'graphic_eq' : 'keyboard'}
              </span>
              <input
                type="text"
                placeholder={isRecording ? 'Hearing your voice live...' : "Type words or fragments to reconstruct (e.g. 'cold water please')..."}
                value={fragmentInput}
                onChange={(e) => handleInputChange(e.target.value)}
                disabled={isProcessing}
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  fontWeight: isRecording ? 600 : 400,
                  color: '#1a1a19',
                  minHeight: '38px',
                }}
              />
              <button
                type="submit"
                disabled={isProcessing || !fragmentInput.trim()}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: '#93721b',
                  color: '#ffffff',
                  border: 'none',
                  cursor: isProcessing || !fragmentInput.trim() ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  opacity: fragmentInput.trim() ? 1 : 0.6,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  arrow_forward
                </span>
              </button>
            </form>
          </section>

          {/* Card 2: Quick Express */}
          <section
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              padding: '20px 24px',
              border: '1px solid #ede7df',
              boxShadow: '0 2px 12px rgba(119, 90, 1, 0.03)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#93721b' }}>
                  bolt
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '15px',
                    fontWeight: 800,
                    color: '#1a1a19',
                  }}
                >
                  Quick Express
                </span>
              </div>

              <button
                onClick={() => onNavigateTab('vocabulary')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#93721b',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>Manage Phrases</span>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  arrow_forward
                </span>
              </button>
            </div>

            {/* Quick Phrase Pills */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '8px',
              }}
            >
              {[
                { icon: 'medical_services', label: 'Doctor ...', phrase: 'I have a doctor appointment scheduled.' },
                { icon: 'replay', label: 'Please r...', phrase: 'Could you please repeat what you just said?' },
                { icon: 'edit_note', label: 'I am typ...', phrase: 'Please give me a moment, I am typing a response.' },
                { icon: 'hourglass_empty', label: 'Need a ...', phrase: 'I need a moment to formulate my response.' },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={async () => {
                    setFragmentInput(item.phrase);
                    setIsProcessing(true);
                    showToast('Playing quick express phrase...');
                    try {
                      const res = await reconstructText(item.phrase, activeContext, profile);
                      setActiveItem(res);
                      handleSpeak(res.reconstructed_text, res.audio_base64);
                    } catch (e) {
                      handleSpeak(item.phrase);
                    } finally {
                      setIsProcessing(false);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px 12px',
                    backgroundColor: '#fbf8f4',
                    borderRadius: '12px',
                    border: '1px solid #ede7df',
                    color: '#2a2723',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '17px', color: '#736d62' }}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Live Reconstruction Card + Ambient Noise Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Card 1: Live Reconstruction Card */}
          <section
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              padding: '24px',
              border: '1px solid #ede7df',
              boxShadow: '0 2px 12px rgba(119, 90, 1, 0.03)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {/* Header with Title & AI Confidence */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#93721b' }}>
                  graphic_eq
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '16px',
                    fontWeight: 800,
                    color: '#1a1a19',
                  }}
                >
                  Live Reconstruction
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  backgroundColor: '#fef3c7',
                  color: '#92400e',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#b45309',
                    display: 'inline-block',
                  }}
                />
                <span>AI Confidence {Math.round((activeItem?.confidence || 0.96) * 100)}%</span>
              </div>
            </div>

            {/* Acoustic Input Phonemes Box */}
            <div
              style={{
                backgroundColor: isRecording ? '#fff7ed' : '#faf7f2',
                borderRadius: '16px',
                padding: '14px 16px',
                border: isRecording ? '1.5px solid #fdba74' : '1px solid #ede7df',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    color: '#7a7368',
                    textTransform: 'uppercase',
                  }}
                >
                  {isRecording ? '● LISTENING TO SPEECH:' : inputSource === 'keyboard' ? '⌨️ TYPED INPUT WORDS:' : '🎤 ACOUSTIC SPEECH INPUT:'}
                </span>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: '18px', color: isRecording ? '#dc2626' : '#93721b' }}
                >
                  {inputSource === 'keyboard' ? 'keyboard' : 'mic'}
                </span>
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '15px',
                  fontWeight: 600,
                  fontStyle: 'italic',
                  color: isRecording ? '#9a3412' : '#38332a',
                  wordBreak: 'break-word',
                }}
              >
                “{activeItem?.raw_transcript || 'Type or speak words...'}”
                {isRecording && <span className="animate-pulse" style={{ fontWeight: 800, color: '#dc2626' }}>|</span>}
              </p>
            </div>

            {/* Downward Transformation Indicator */}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '-4px 0' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: '#f4ede2',
                  color: '#93721b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  arrow_downward
                </span>
              </div>
            </div>

            {/* Reconstructed Sentence Box */}
            <div
              style={{
                backgroundColor: '#fcf6e9',
                borderRadius: '18px',
                padding: '18px',
                border: '1px solid #f2e2be',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    color: '#8c6913',
                    textTransform: 'uppercase',
                  }}
                >
                  RECONSTRUCTED SENTENCE
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      backgroundColor: '#ebdcb6',
                      color: '#6e550e',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '999px',
                    }}
                  >
                    Neural v3.4
                  </span>
                  <button
                    onClick={handleRegenerate}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#8c6913',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '2px',
                    }}
                    title="Regenerate sentence"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      refresh
                    </span>
                  </button>
                </div>
              </div>

              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '17px',
                  fontWeight: 700,
                  color: '#1a1a19',
                  lineHeight: 1.45,
                  marginBottom: '14px',
                }}
              >
                “{activeItem?.reconstructed_text || 'Ready to reconstruct your speech.'}”
              </p>

              {/* Tags: Intent & Context */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <span
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#2a2723',
                    padding: '4px 12px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    border: '1px solid #ede7df',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#3c6847' }}>
                    chat_bubble_outline
                  </span>
                  Intent: {activeItem?.detected_intent || 'General'}
                </span>

                <span
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#2a2723',
                    padding: '4px 12px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    border: '1px solid #ede7df',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#93721b' }}>
                    category
                  </span>
                  Context: {activeContext}
                </span>
              </div>
            </div>

            {/* Autonomy Protocol Box */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                backgroundColor: '#f6f1e8',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#4f4a41',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#736d62' }}>
                shield
              </span>
              <span>Protocol: AI Proposes • You Confirm • Second Voice Executes</span>
            </div>

            {/* Primary Action Button: Speak Out Loud */}
            <button
              id="mainSpeakBtn"
              onClick={() => handleSpeak(activeItem?.reconstructed_text || '', activeItem?.audio_base64)}
              style={{
                width: '100%',
                height: '52px',
                backgroundColor: '#775a01',
                color: '#ffffff',
                borderRadius: '14px',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-heading)',
                fontSize: '15px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(119, 90, 1, 0.25)',
                transition: 'all 0.15s ease',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                volume_up
              </span>
              <span>Speak Out Loud</span>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', marginLeft: '2px' }}>
                arrow_forward
              </span>
            </button>

            {/* Secondary Action Grid (2x2) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              <button
                onClick={() => showToast('Dispatched sentence to audience!')}
                style={{
                  height: '44px',
                  backgroundColor: '#fbf8f4',
                  borderRadius: '12px',
                  border: '1px solid #ede7df',
                  color: '#2a2723',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#3c6847' }}>
                  send
                </span>
                <span>Send Message</span>
              </button>

              <button
                onClick={handleCopy}
                style={{
                  height: '44px',
                  backgroundColor: '#fbf8f4',
                  borderRadius: '12px',
                  border: '1px solid #ede7df',
                  color: '#2a2723',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#736d62' }}>
                  content_copy
                </span>
                <span>Copy Text</span>
              </button>

              <button
                onClick={handleRefine}
                style={{
                  height: '44px',
                  backgroundColor: '#fbf8f4',
                  borderRadius: '12px',
                  border: '1px solid #ede7df',
                  color: '#2a2723',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#736d62' }}>
                  edit
                </span>
                <span>Refine / Edit</span>
              </button>

              <button
                onClick={handleToggleRecord}
                style={{
                  height: '44px',
                  backgroundColor: '#fbf8f4',
                  borderRadius: '12px',
                  border: '1px solid #ede7df',
                  color: '#2a2723',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#736d62' }}>
                  restart_alt
                </span>
                <span>Try Again</span>
              </button>
            </div>
          </section>

          {/* Card 2: Ambient Noise Card (Bottom Right) */}
          <section
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              padding: '16px 20px',
              border: '1px solid #ede7df',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: '#eaf6ec',
                  color: '#246b33',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                  hearing
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#1a1a19',
                  }}
                >
                  Ambient Noise: Low
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '12px',
                    color: '#706a60',
                  }}
                >
                  Speech signal-to-noise ratio: Optimal
                </span>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('calibration')}
              style={{
                background: 'none',
                border: 'none',
                color: '#775a01',
                fontFamily: 'var(--font-heading)',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                padding: '6px 10px',
                borderRadius: '8px',
              }}
            >
              Recalibrate
            </button>
          </section>
        </div>
      </div>

      {/* Floating Toast Alert */}
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
