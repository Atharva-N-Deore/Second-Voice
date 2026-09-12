import React, { useState, useEffect } from 'react';
import { AudioRecorder, speakWithBrowserTTS } from '../services/audioRecorder';

export const CalibrationScreen: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(4);
  const [volumeLevel, setVolumeLevel] = useState(0.4);
  const [recorder, setRecorder] = useState<AudioRecorder | null>(null);
  const [exerciseIndex, setExerciseIndex] = useState(0);

  const exercises = [
    {
      num: '08',
      prompt: '“Tell me what you would say when asking someone for help.”',
      heard: '“help... [0.8s pause] ...need w-water... [exhale]”',
      understood: '“Could you please get me a glass of water?”',
      confidence: 91
    },
    {
      num: '09',
      prompt: '“Say your full name and where you are traveling today.”',
      heard: '“Alex... [1.2s pause] ...train to... station north”',
      understood: '“My name is Alex, and I am traveling to the North Railway Station.”',
      confidence: 94
    }
  ];

  const currentEx = exercises[exerciseIndex];

  useEffect(() => {
    setRecorder(new AudioRecorder());
  }, []);

  useEffect(() => {
    let timer: any;
    if (isRecording) {
      timer = setInterval(() => setSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const handleToggle = async () => {
    if (!isRecording) {
      setIsRecording(true);
      setSeconds(0);
      recorder?.start((v) => setVolumeLevel(v));
    } else {
      setIsRecording(false);
      await recorder?.stop();
      speakWithBrowserTTS(currentEx.understood);
    }
  };

  const handleNextExercise = () => {
    setExerciseIndex((exerciseIndex + 1) % exercises.length);
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Progress Header */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          borderRadius: '999px',
          backgroundColor: 'var(--surface-container-high)',
          color: 'var(--on-surface-variant)',
          fontSize: '12px',
          fontWeight: 600,
          alignSelf: 'flex-start'
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)' }} className="animate-pulse" />
          <span>Voice Calibration • Step {exerciseIndex + 1} of 4</span>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '24px',
          fontWeight: 700,
          color: 'var(--on-surface)'
        }}>
          Let’s learn your voice.
        </h1>
        <p style={{
          fontSize: '14px',
          color: 'var(--on-surface-variant)',
          lineHeight: 1.45
        }}>
          Your speech is unique. Second Voice continuously adapts to your natural cadence, breathing pauses, and consonant patterns without rushing you.
        </p>
      </section>

      {/* Guided Calibration Exercise Card */}
      <section style={{
        backgroundColor: 'var(--surface-container-lowest)',
        borderRadius: '20px',
        padding: '20px',
        border: '1px solid var(--outline-variant)',
        boxShadow: '0 2px 8px rgba(119, 90, 1, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'var(--secondary)',
            letterSpacing: '0.05em'
          }}>
            Calibration Exercise {currentEx.num}
          </span>
          <span style={{
            backgroundColor: 'var(--surface-container)',
            color: 'var(--on-surface-variant)',
            fontSize: '12px',
            padding: '4px 10px',
            borderRadius: '999px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>psychology</span>
            Adaptive Modeling
          </span>
        </div>

        <div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--on-surface)', marginBottom: '6px' }}>
            Read aloud or speak naturally in your own way:
          </p>
          <div style={{
            padding: '16px',
            borderRadius: '12px',
            backgroundColor: 'var(--surface-container-low)',
            color: 'var(--on-surface)'
          }}>
            <p style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '17px',
              fontWeight: 700,
              color: 'var(--on-primary-container)',
              lineHeight: 1.4
            }}>
              {currentEx.prompt}
            </p>
          </div>
        </div>

        {/* Active Recording & Waveform Box */}
        <div style={{
          backgroundColor: 'var(--surface-container)',
          borderRadius: '14px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '14px'
        }}>
          {/* Waveform Array */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: '6px',
            height: '48px',
            width: '100%'
          }}>
            {[12, 32, 44, 20, 48, 28, 40, 16, 52, 24, 12].map((baseHeight, idx) => (
              <span
                key={idx}
                style={{
                  width: '6px',
                  borderRadius: '999px',
                  backgroundColor: idx % 3 === 0 ? 'var(--primary-container)' : 'var(--primary)',
                  height: isRecording
                    ? `${Math.max(6, Math.sin(idx + Date.now() / 150) * 35 * volumeLevel + 10)}px`
                    : `${baseHeight}px`,
                  transition: 'height 0.15s ease'
                }}
              />
            ))}
          </div>

          {/* Recording Timer / Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--on-surface-variant)' }}>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: isRecording ? 'var(--error)' : 'var(--tertiary)'
            }} className={isRecording ? 'animate-ping' : ''} />
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--on-surface)' }}>
              00:{seconds < 10 ? `0${seconds}` : seconds}
            </span>
            <span>• {isRecording ? 'Listening to natural acoustic cadence...' : 'Sample analyzed'}</span>
          </div>

          {/* Large Tactile Record / Pause Action */}
          <button
            onClick={handleToggle}
            style={{
              padding: '14px 24px',
              borderRadius: '999px',
              backgroundColor: isRecording ? 'var(--secondary)' : 'var(--primary-container)',
              color: isRecording ? 'var(--on-secondary)' : 'var(--on-primary-container)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontWeight: 700,
              fontSize: '15px',
              boxShadow: '0 2px 8px rgba(119, 90, 1, 0.2)'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
              {isRecording ? 'mic_off' : 'mic'}
            </span>
            <span>{isRecording ? 'Stop & Analyze Cadence' : 'Record Calibration Voice'}</span>
          </button>
        </div>
      </section>

      {/* Real-time AI Interpretation Review Box */}
      <section style={{
        backgroundColor: 'var(--surface-container-lowest)',
        borderRadius: '20px',
        padding: '20px',
        border: '1px solid var(--outline-variant)',
        boxShadow: '0 2px 8px rgba(119, 90, 1, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--primary)' }}>
              graphic_eq
            </span>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700 }}>
              Acoustic Processing
            </h3>
          </div>
          <span style={{
            fontSize: '12px',
            color: 'var(--tertiary)',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
            Active Filter
          </span>
        </div>

        {/* Acoustic Transcription Segment */}
        <div>
          <label style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--on-surface-variant)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginBottom: '4px'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>hearing</span>
            We heard (raw phonemes & breath tokens):
          </label>
          <div style={{
            padding: '12px 14px',
            borderRadius: '10px',
            backgroundColor: 'var(--surface-container)',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            color: 'var(--on-surface-variant)'
          }}>
            {currentEx.heard}
          </div>
        </div>

        {/* Meaning Intent Synthesized */}
        <div>
          <label style={{
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginBottom: '4px'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>auto_awesome</span>
            Second Voice understood:
          </label>
          <div style={{
            padding: '14px',
            borderRadius: '12px',
            backgroundColor: 'var(--surface-container-low)',
            color: 'var(--on-surface)',
            fontSize: '17px',
            fontWeight: 600
          }}>
            {currentEx.understood}
          </div>
        </div>

        {/* Confidence Gauge Visualizer */}
        <div style={{ marginTop: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
            <span style={{ color: 'var(--on-surface-variant)', fontWeight: 500 }}>Understanding Confidence</span>
            <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{currentEx.confidence}% (High Congruence)</span>
          </div>
          <div style={{ height: '8px', backgroundColor: 'var(--surface-container-high)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{ width: `${currentEx.confidence}%`, height: '100%', backgroundColor: 'var(--primary)', borderRadius: '999px' }} />
          </div>
        </div>

        <button
          onClick={handleNextExercise}
          style={{
            marginTop: '8px',
            padding: '12px',
            borderRadius: '12px',
            backgroundColor: 'var(--surface-container-low)',
            color: 'var(--primary)',
            border: '1px solid var(--outline-variant)',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Next Exercise →
        </button>
      </section>
    </div>
  );
};
