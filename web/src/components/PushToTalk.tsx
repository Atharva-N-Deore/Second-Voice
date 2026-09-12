import React, { useState, useEffect } from 'react';
import { Mic, Square, Sparkles, Send, Loader2, Volume2 } from 'lucide-react';
import { AudioRecorder } from '../services/audioRecorder';

interface PushToTalkProps {
  onAudioRecorded: (audioBlob: Blob) => Promise<void>;
  onTextSubmitted: (text: string) => Promise<void>;
  isProcessing: boolean;
  selectedContext: string;
}

export const PushToTalk: React.FC<PushToTalkProps> = ({
  onAudioRecorded,
  onTextSubmitted,
  isProcessing,
  selectedContext,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [manualText, setManualText] = useState('');
  const [recorder, setRecorder] = useState<AudioRecorder | null>(null);

  useEffect(() => {
    const audioRec = new AudioRecorder();
    setRecorder(audioRec);
  }, []);

  const handleToggleRecord = async () => {
    if (!recorder || isProcessing) return;

    if (!isRecording) {
      try {
        setIsRecording(true);
        await recorder.start((vol) => setVolumeLevel(vol));
      } catch (err) {
        console.error('Microphone error:', err);
        alert('Microphone access denied or unavailable.');
        setIsRecording(false);
      }
    } else {
      setIsRecording(false);
      setVolumeLevel(0);
      try {
        const { blob: audioBlob } = await recorder.stop();
        if (audioBlob && audioBlob.size > 0) {
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
    <div className="glass-panel" style={{
      padding: '32px 24px',
      textAlign: 'center',
      marginBottom: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background ambient indicator */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '300px',
        height: '300px',
        background: isRecording
          ? 'radial-gradient(circle, rgba(244, 63, 94, 0.25) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
        transition: 'all 0.5s ease'
      }} />

      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '6px' }}>
        {isRecording ? 'Listening... Speak naturally' : isProcessing ? 'Reconstructing & Synthesizing...' : 'Push to Speak'}
      </h2>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
        {isRecording
          ? 'Press button again when finished. Even partial words will be reconstructed.'
          : isProcessing
          ? 'Whisper STT -> Context Reconstructor -> Neural Speech'
          : `Active Context: ${selectedContext}. Tap below to speak.`}
      </p>

      {/* Massive Tactile Button */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '20px 0' }}>
        <button
          onClick={handleToggleRecord}
          disabled={isProcessing}
          className={isRecording ? 'recording-pulse' : ''}
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            border: isRecording ? '3px solid #f43f5e' : '2px solid rgba(99, 102, 241, 0.5)',
            background: isRecording
              ? 'linear-gradient(135deg, #ef4444 0%, #f43f5e 100%)'
              : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            color: '#ffffff',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: isRecording
              ? '0 0 35px rgba(244, 63, 94, 0.6)'
              : '0 0 30px rgba(99, 102, 241, 0.45)',
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: isRecording ? `scale(${1 + volumeLevel * 0.2})` : 'scale(1)',
          }}
        >
          {isProcessing ? (
            <Loader2 size={44} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
          ) : isRecording ? (
            <Square size={38} fill="#ffffff" />
          ) : (
            <Mic size={44} />
          )}
          <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {isRecording ? 'STOP' : isProcessing ? 'AI BUSY' : 'TALK'}
          </span>
        </button>
      </div>

      {/* Audio Waveform Bars when recording */}
      {isRecording && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          height: '40px',
          marginTop: '12px'
        }}>
          {[...Array(16)].map((_, i) => (
            <div
              key={i}
              style={{
                width: '4px',
                borderRadius: '999px',
                background: '#f43f5e',
                height: `${Math.max(6, Math.sin(i + Date.now() / 200) * 30 * volumeLevel + 10)}px`,
                transition: 'height 0.1s ease',
              }}
            />
          ))}
        </div>
      )}

      {/* Manual Dysarthric Fragment Input (for typing/testing) */}
      <form onSubmit={handleManualSubmit} style={{ marginTop: '24px', display: 'flex', gap: '8px' }}>
        <input
          type="text"
          placeholder='Or type fragmented speech (e.g. "w-want... c-coff... latte o-oat")...'
          value={manualText}
          onChange={(e) => setManualText(e.target.value)}
          disabled={isProcessing}
          style={{
            flex: 1,
            padding: '12px 16px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-main)',
            fontSize: '0.9rem',
          }}
        />
        <button
          type="submit"
          disabled={isProcessing || !manualText.trim()}
          style={{
            padding: '12px 20px',
            background: 'var(--accent-indigo)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: isProcessing || !manualText.trim() ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600,
            fontSize: '0.9rem',
          }}
        >
          <Sparkles size={16} />
          <span>Fix & Speak</span>
        </button>
      </form>
    </div>
  );
};
