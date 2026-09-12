import React, { useState, useEffect } from 'react';
import { DesktopHeader } from './components/DesktopHeader';
import { SidebarContext } from './components/SidebarContext';
import { TactileMicHero } from './components/TactileMicHero';
import { LiveTransformationTheatre, TranscriptionItem } from './components/LiveTransformationTheatre';
import { QuickAssistMatrix } from './components/QuickAssistMatrix';
import { StatsTelemetryBar } from './components/StatsTelemetryBar';
import { EmergencyModal } from './components/EmergencyModal';
import { UserSettingsModal } from './components/UserSettingsModal';

import { VocabularyScreen } from './screens/VocabularyScreen';
import { CalibrationScreen } from './screens/CalibrationScreen';
import { ProfileSettingsScreen } from './screens/ProfileSettingsScreen';
import { HistoryScreen } from './screens/HistoryScreen';

import {
  processSpeechAudio,
  reconstructText,
  fetchPresets,
  PresetItem,
  UserSpeechProfile,
  ReconstructionResult,
} from './services/api';
import { speakWithBrowserTTS, playAudioBase64 } from './services/audioRecorder';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('communicate');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [fontScale, setFontScale] = useState<string>('Medium (100%)');
  const [voiceVolume, setVoiceVolume] = useState<number>(85);
  const [selectedContext, setSelectedContext] = useState<string>('Workplace & Meetings');
  const [volumeLevel, setVolumeLevel] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [latencyMs, setLatencyMs] = useState<number>(240);
  const [confidenceScore, setConfidenceScore] = useState<number>(0.97);

  const [profile, setProfile] = useState<UserSpeechProfile>({
    impairmentType: 'Dysarthria (General)',
    notes: 'Soft volume, consonant softening',
    speechQuirks: "Difficulty with 'R' and 'Th' sounds, partial word endings",
    voice: 'en-US-GuyNeural',
  });

  const [presets, setPresets] = useState<PresetItem[]>([
    {
      id: 'workplace',
      name: 'Workplace & Meetings',
      icon: '💼',
      color: '#c9a44c',
      description: 'Professional discussions, status syncs, screen share requests',
      sample_prompts: ['Could you please share your screen?', 'I will send the notes shortly.'],
      vocabulary_boost: ['meeting', 'sync', 'deadline', 'slides'],
    },
    {
      id: 'cafe',
      name: 'Cafe & Dining',
      icon: '☕',
      color: '#f59e0b',
      description: 'Ordering food, drink customizations, dietary preferences, billing',
      sample_prompts: ['Could I please get an oat milk cappuccino?'],
      vocabulary_boost: ['latte', 'coffee', 'oat milk', 'bill', 'receipt'],
    },
    {
      id: 'medical',
      name: 'Clinic & Doctor',
      icon: '🏥',
      color: '#ef4444',
      description: 'Describing physical sensations, pain intensity, medication timings',
      sample_prompts: ['I have a sharp pain in my left shoulder.'],
      vocabulary_boost: ['pain', 'doctor', 'medication', 'prescription', 'dose'],
    },
    {
      id: 'transit',
      name: 'Transit & Travel',
      icon: '🚕',
      color: '#3b82f6',
      description: 'Ride hailing, train stations, airport navigation, baggage assistance',
      sample_prompts: ['Please pull over near the main lobby.'],
      vocabulary_boost: ['driver', 'terminal', 'ticket', 'station'],
    },
    {
      id: 'home',
      name: 'Home & Social',
      icon: '🏡',
      color: '#10b981',
      description: 'Casual conversation with family and friends',
      sample_prompts: ['Could someone please pass the water pitcher?'],
      vocabulary_boost: ['family', 'dinner', 'tv', 'couch', 'relax'],
    },
  ]);

  const [historyItems, setHistoryItems] = useState<TranscriptionItem[]>([
    {
      id: 'init-1',
      timestamp: '12:14 PM',
      originalText: 'meeting... late... tell Rahul ten min...',
      cleaned_text: 'meeting late tell Rahul ten min',
      reconstructed_text: 'Please let Rahul know that I will be approximately 10 minutes late to our sync.',
      confidence: 0.98,
      detected_intent: 'Professional Communication',
      alternatives: [
        'I am running about 10 minutes late for the sync with Rahul.',
        'Could someone notify Rahul I will join the meeting shortly?',
      ],
      latency_ms: 240,
    },
  ]);

  useEffect(() => {
    fetchPresets().then((res) => {
      if (res && res.presets && res.presets.length > 0) {
        setPresets(res.presets);
      }
    });
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (next === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.classList.add('light-theme');
    } else {
      document.documentElement.removeAttribute('data-theme');
      document.body.classList.remove('light-theme');
    }
  };

  const handleFontScaleToggle = () => {
    const scales = ['Small (90%)', 'Medium (100%)', 'Large (120%)', 'Extra Large (140%)'];
    const currentIdx = scales.indexOf(fontScale);
    const nextScale = scales[(currentIdx + 1) % scales.length];
    setFontScale(nextScale);

    let multiplier = '1';
    if (nextScale.includes('Small')) multiplier = '0.9';
    else if (nextScale.includes('Medium')) multiplier = '1.0';
    else if (nextScale.includes('Large')) multiplier = '1.15';
    else if (nextScale.includes('Extra Large')) multiplier = '1.3';
    document.documentElement.style.setProperty('--text-scale', multiplier);
  };

  const handlePlayAudio = (base64Audio: string, textFallback?: string) => {
    if (base64Audio) {
      playAudioBase64(base64Audio).catch(() => {
        if (textFallback) speakWithBrowserTTS(textFallback, voiceVolume);
      });
    } else if (textFallback) {
      speakWithBrowserTTS(textFallback, voiceVolume);
    }
  };

  const handleAudioRecorded = async (blob: Blob) => {
    setIsProcessing(true);
    const start = performance.now();
    try {
      const result = await processSpeechAudio(blob, selectedContext, profile);
      const elapsed = Math.round(performance.now() - start);
      setLatencyMs(elapsed);
      setConfidenceScore(result.confidence || 0.96);

      const newItem: TranscriptionItem = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        originalText: result.raw_transcript,
        cleaned_text: result.raw_transcript,
        reconstructed_text: result.reconstructed_text,
        confidence: result.confidence,
        detected_intent: result.detected_intent,
        alternatives: result.alternative_suggestions,
        audio_base64: result.audio_base64,
        latency_ms: elapsed,
      };

      setHistoryItems((prev) => [newItem, ...prev]);

      if (result.reconstructed_text) {
        handlePlayAudio(result.audio_base64 || '', result.reconstructed_text);
      }
    } catch (err) {
      console.error('Audio processing failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextSubmitted = async (text: string) => {
    setIsProcessing(true);
    const start = performance.now();
    try {
      const result = await reconstructText(text, selectedContext, profile);
      const elapsed = Math.round(performance.now() - start);
      setLatencyMs(elapsed);
      setConfidenceScore(result.confidence || 0.96);

      const newItem: TranscriptionItem = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        originalText: text,
        cleaned_text: text,
        reconstructed_text: result.reconstructed_text,
        confidence: result.confidence,
        detected_intent: result.detected_intent,
        alternatives: result.alternative_suggestions,
        audio_base64: result.audio_base64,
        latency_ms: elapsed,
      };

      setHistoryItems((prev) => [newItem, ...prev]);

      if (result.reconstructed_text) {
        handlePlayAudio(result.audio_base64 || '', result.reconstructed_text);
      }
    } catch (err) {
      console.error('Text reconstruction failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSpeakPhrase = (text: string) => {
    speakWithBrowserTTS(text, voiceVolume);
  };

  const fullHistoryResults: ReconstructionResult[] = historyItems.map((item) => ({
    raw_transcript: item.originalText,
    reconstructed_text: item.reconstructed_text,
    confidence: item.confidence,
    detected_intent: item.detected_intent || 'Speech Reconstruction',
    alternative_suggestions: item.alternatives || [],
    audio_base64: item.audio_base64,
    latency_ms: item.latency_ms || 240,
    provider: 'Second Voice Neural Core',
  }));

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-dark)',
        color: 'var(--text-main)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Luxury Obsidian & Warm Gold Desktop Header */}
      <DesktopHeader
        currentView={currentTab}
        onSelectView={(view) => setCurrentTab(view)}
        theme={theme}
        onToggleTheme={toggleTheme}
        profile={profile}
        textScale={fontScale}
        onToggleTextScale={handleFontScaleToggle}
        latencyMs={latencyMs}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Screen Router */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {currentTab === 'communicate' && (
          <main
            style={{
              flex: 1,
              padding: '24px',
              maxWidth: '1600px',
              width: '100%',
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: 'minmax(280px, 320px) minmax(0, 1fr) minmax(300px, 340px)',
              gap: '24px',
              alignItems: 'start',
            }}
            className="dashboard-grid-layout"
          >
            {/* Left Column: Contexts & Acoustic VU Decibel Meter */}
            <SidebarContext
              presets={presets}
              selectedContext={selectedContext}
              onSelectContext={(ctx) => setSelectedContext(ctx)}
              volumeLevel={volumeLevel}
              onOpenEmergency={() => setIsEmergencyOpen(true)}
            />

            {/* Center Column: Tactile Mic Studio Hub & Live Transformation Theatre */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <TactileMicHero
                onAudioRecorded={handleAudioRecorded}
                onTextSubmitted={handleTextSubmitted}
                isProcessing={isProcessing}
                selectedContext={selectedContext}
                volumeLevel={volumeLevel}
                onVolumeChange={(vol) => setVolumeLevel(vol)}
              />

              <LiveTransformationTheatre
                items={historyItems}
                onPlayAudio={(audioBase64, text) => handlePlayAudio(audioBase64, text)}
                onClearHistory={() => setHistoryItems([])}
              />
            </div>

            {/* Right Column: Quick Assist Matrix & Hardware Engine Vitals */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <QuickAssistMatrix
                onSpeakPhrase={handleSpeakPhrase}
                selectedContext={selectedContext}
              />

              {/* Neural Pipeline Telemetry Card */}
              <div className="lux-panel" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--gold-primary)', fontSize: '20px' }}>
                    memory
                  </span>
                  <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 800, margin: 0 }}>
                    Neural Inference Pipeline
                  </h4>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-dim)' }}>STT Acoustic Core</span>
                    <span style={{ fontWeight: 600, color: 'var(--gold-bright)' }}>Whisper Large v3 (TORGO LoRA)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Context LLM Synthesizer</span>
                    <span style={{ fontWeight: 600, color: 'var(--emerald-accent)' }}>Groq GPT-OSS-120B</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Acoustic Decoder</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>48kHz Neural WaveNet</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Edge Fallback</span>
                    <span style={{ fontWeight: 600, color: 'var(--emerald-accent)' }}>Active (Zero-Network Resilient)</span>
                  </div>
                </div>
              </div>
            </div>
          </main>
        )}

        {currentTab === 'vocabulary' && (
          <div style={{ maxWidth: '900px', width: '100%', margin: '0 auto', padding: '32px 16px' }}>
            <VocabularyScreen />
          </div>
        )}

        {currentTab === 'calibration' && (
          <div style={{ maxWidth: '900px', width: '100%', margin: '0 auto', padding: '32px 16px' }}>
            <CalibrationScreen />
          </div>
        )}

        {currentTab === 'history' && (
          <div style={{ maxWidth: '900px', width: '100%', margin: '0 auto', padding: '32px 16px' }}>
            <HistoryScreen historyList={fullHistoryResults} />
          </div>
        )}

        {currentTab === 'profile' && (
          <div style={{ maxWidth: '900px', width: '100%', margin: '0 auto', padding: '32px 16px' }}>
            <ProfileSettingsScreen
              profile={profile}
              onUpdateProfile={(p) => setProfile(p)}
              textScale={fontScale}
              onChangeTextScale={(s) => setFontScale(s)}
            />
          </div>
        )}
      </div>

      {/* Bottom Telemetry & Status Bar */}
      <StatsTelemetryBar
        latencyMs={latencyMs}
        confidenceScore={confidenceScore}
        totalPhrases={historyItems.length}
        activeContext={selectedContext}
      />

      {/* Emergency Drawer / Modal */}
      <EmergencyModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
      />

      {/* Personal Speech Profile Modal */}
      <UserSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        onSaveProfile={(p) => setProfile(p)}
      />
    </div>
  );
};
export default App;
