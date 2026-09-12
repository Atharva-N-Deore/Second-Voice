import React, { useState, useEffect, useRef } from 'react';
import { AudioRecorder } from '../services/audioRecorder';
import { AudioCanvasVisualizer } from './AudioCanvasVisualizer';

interface TactileMicHeroProps {
  onAudioRecorded: (audioBlob: Blob) => Promise<void>;
  onTextSubmitted: (text: string) => Promise<void>;
  isProcessing: boolean;
  selectedContext: string;
  volumeLevel: number;
  onVolumeChange: (vol: number) => void;
}

export const TactileMicHero: React.FC<TactileMicHeroProps> = ({
  onAudioRecorded,
  onTextSubmitted,
  isProcessing,
  selectedContext,
  volumeLevel,
  onVolumeChange,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [manualText, setManualText] = useState('');
  const [recorder, setRecorder] = useState<AudioRecorder | null>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    const audioRec = new AudioRecorder();
    setRecorder(audioRec);
  }, []);

  useEffect(() => {
    if (isRecording) {
      setRecordSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 0.1);
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordSeconds(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const handleToggleRecord = async () => {
    if (!recorder || isProcessing) return;

    if (!isRecording) {
      try {
        setIsRecording(true);
        await recorder.start((vol) => onVolumeChange(vol));
      } catch (err) {
        console.error('Microphone error:', err);
        alert('Microphone access denied or unavailable.');
        setIsRecording(false);
      }
    } else {
      setIsRecording(false);
      onVolumeChange(0);
      try {
        const audioBlob = await recorder.stop();
        if (audioBlob.size > 0) {
          await onAudioRecorded(audioBlob);
        }
      } catch (err) {
        console.error('Error stopping audio recorder:', err);
      }
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim() || isProcessing) return;
    const textToSend = manualText;
    setManualText('');
    await onTextSubmitted(textToSend);
  };

  return (
    <div className="lux-panel" style={{ padding: '32px 28px', position: 'relative', overflow: 'hidden' }}>
      {/* Background ambient gold/rose radiant glow */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '420px',
          height: '260px',
          background: isRecording
            ? 'radial-gradient(circle, rgba(244, 63, 94, 0.28) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(201, 164, 76, 0.2) 0%, transparent 70%)',
          filter: 'blur(30px)',
          pointerEvents: 'none',
          transition: 'all 0.5s ease',
          zIndex: 0,
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Status context pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '999px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-gold)',
            marginBottom: '16px',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isRecording ? 'var(--rose-alert)' : 'var(--gold-primary)',
              boxShadow: isRecording
                ? '0 0 8px var(--rose-alert)'
                : '0 0 8px var(--gold-primary)',
              animation: isRecording ? 'pulseGlow 1s infinite' : 'none',
            }}
          />
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
            Context: <strong style={{ color: 'var(--gold-bright)' }}>{selectedContext}</strong>
          </span>
          <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>•</span>
          <span style={{ fontSize: '11px', color: 'var(--emerald-accent)', fontFamily: 'var(--font-mono)' }}>
            Whisper LoRA + Neural TTS
          </span>
        </div>

        {/* Heading */}
        <h2
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '26px',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            margin: '0 0 6px 0',
            textAlign: 'center',
          }}
        >
          {isRecording ? (
            <span style={{ color: 'var(--rose-alert)' }}>Listening & Capturing...</span>
          ) : isProcessing ? (
            <span className="text-gold-gradient">Reconstructing Neural Voice...</span>
          ) : (
            <span>Direct Push-to-Voice</span>
          )}
        </h2>

        <p
          style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
            textAlign: 'center',
            maxWidth: '520px',
            margin: '0 0 20px 0',
            lineHeight: 1.5,
          }}
        >
          {isRecording
            ? `Speaking recorded: ${recordSeconds.toFixed(1)}s — Release or tap stop when finished.`
            : isProcessing
            ? 'Analyzing speech acoustic tokens, running context synthesis & generating speech audio...'
            : 'Tap the golden microphone or press and hold. Even stuttered, dysarthric or incomplete speech will be restored.'}
        </p>

        {/* Audio Wave Visualizer */}
        <div style={{ width: '100%', maxWidth: '440px', marginBottom: '16px' }}>
          <AudioCanvasVisualizer isRecording={isRecording} volumeLevel={volumeLevel} />
        </div>

        {/* Big Tactile Push-to-Talk Button */}
        <div style={{ position: 'relative', margin: '8px 0 24px 0' }}>
          {/* Outer Ripple Rings */}
          {isRecording && (
            <>
              <div
                style={{
                  position: 'absolute',
                  inset: '-16px',
                  borderRadius: '50%',
                  border: '2px solid rgba(244, 63, 94, 0.4)',
                  animation: 'pulseGlow 1.5s cubic-bezier(0.25, 1, 0.5, 1) infinite',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: '-32px',
                  borderRadius: '50%',
                  border: '1px solid rgba(244, 63, 94, 0.2)',
                  animation: 'pulseGlow 1.5s cubic-bezier(0.25, 1, 0.5, 1) infinite 0.4s',
                }}
              />
            </>
          )}

          <button
            onClick={handleToggleRecord}
            disabled={isProcessing}
            style={{
              width: '130px',
              height: '130px',
              borderRadius: '50%',
              border: isRecording ? '3px solid #f43f5e' : '2px solid var(--gold-bright)',
              background: isRecording
                ? 'linear-gradient(135deg, #ef4444 0%, #be123c 100%)'
                : 'linear-gradient(135deg, #dfb15b 0%, #9a7322 50%, #684a0d 100%)',
              color: '#ffffff',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: isRecording
                ? '0 0 45px rgba(244, 63, 94, 0.7)'
                : '0 10px 40px rgba(201, 164, 76, 0.45)',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              transform: isRecording ? `scale(${1 + volumeLevel * 0.15})` : 'scale(1)',
            }}
            onMouseDown={(e) => {
              if (!isProcessing) e.currentTarget.style.transform = 'scale(0.95)';
            }}
            onMouseUp={(e) => {
              if (!isProcessing) e.currentTarget.style.transform = isRecording ? `scale(${1 + volumeLevel * 0.15})` : 'scale(1)';
            }}
          >
            {isProcessing ? (
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '44px', animation: 'spin 1s linear infinite' }}
              >
                sync
              </span>
            ) : isRecording ? (
              <span className="material-symbols-outlined" style={{ fontSize: '44px' }}>
                stop_circle
              </span>
            ) : (
              <span className="material-symbols-outlined" style={{ fontSize: '46px', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                mic
              </span>
            )}
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '11px',
                fontWeight: 900,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                textShadow: '0 1px 4px rgba(0,0,0,0.6)',
              }}
            >
              {isRecording ? 'STOP' : isProcessing ? 'AI BUSY' : 'PUSH TO TALK'}
            </span>
          </button>
        </div>

        {/* Manual Fragment Input Bar */}
        <form
          onSubmit={handleManualSubmit}
          style={{
            width: '100%',
            maxWidth: '680px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '6px 8px 6px 16px',
            transition: 'border-color 0.2s ease',
          }}
        >
          <span className="material-symbols-outlined" style={{ color: 'var(--text-dim)', fontSize: '20px' }}>
            keyboard
          </span>
          <input
            type="text"
            placeholder='Or enter dysarthric fragment (e.g., "w-want... c-coff... latte o-oat")...'
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            disabled={isProcessing}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-main)',
              fontSize: '13px',
              fontFamily: 'var(--font-sans)',
            }}
          />
          <button
            type="submit"
            disabled={isProcessing || !manualText.trim()}
            className="btn-lux"
            style={{
              padding: '8px 18px',
              fontSize: '12px',
              borderRadius: 'var(--radius-md)',
              opacity: isProcessing || !manualText.trim() ? 0.5 : 1,
              cursor: isProcessing || !manualText.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              auto_awesome
            </span>
            <span>Reconstruct</span>
          </button>
        </form>
      </div>
    </div>
  );
};
