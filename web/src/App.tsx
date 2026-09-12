import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { EmergencyModal } from './components/EmergencyModal';
import { CommunicateScreen } from './screens/CommunicateScreen';
import { VocabularyScreen } from './screens/VocabularyScreen';
import { CalibrationScreen } from './screens/CalibrationScreen';
import { ProfileSettingsScreen } from './screens/ProfileSettingsScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { ReconstructionResult, UserSpeechProfile } from './services/api';

const DEFAULT_HISTORY: ReconstructionResult[] = [
  {
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
  },
  {
    raw_transcript: 'meeting... late... tell Rahul...',
    reconstructed_text: 'Please tell Rahul that I will be 10 minutes late to our morning sync.',
    confidence: 0.96,
    detected_intent: 'Send Message',
    alternative_suggestions: [
      'I am running a few minutes late for the sync with Rahul.'
    ],
    explanation: 'Mapped meeting tardiness fragments to active work colleague Rahul.',
    latency_ms: 280,
    provider: 'Second Voice Neural Core'
  }
];

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('communicate');
  const [isEmergencyOpen, setIsEmergencyOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [textScale, setTextScale] = useState<string>('Large (120%)');

  const [profile, setProfile] = useState<UserSpeechProfile>(() => {
    try {
      const saved = localStorage.getItem('second_voice_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      impairmentType: 'Dysarthria (General)',
      notes: 'Soft volume, consonant reductions',
      speechQuirks: "Difficulty with 'R' and 'Th' sounds",
      voice: 'en-US-GuyNeural'
    };
  });

  const [historyList, setHistoryList] = useState<ReconstructionResult[]>(() => {
    try {
      const saved = localStorage.getItem('second_voice_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_HISTORY;
  });

  const handleAddToHistory = (item: ReconstructionResult) => {
    setHistoryList((prev) => {
      // Don't add duplicate if identical to the latest entry
      if (prev.length > 0 && prev[0].reconstructed_text === item.reconstructed_text) {
        return prev;
      }
      const updated = [item, ...prev];
      try {
        localStorage.setItem('second_voice_history', JSON.stringify(updated.slice(0, 100)));
      } catch (e) {}
      return updated;
    });
  };

  const handleClearHistory = () => {
    setHistoryList([]);
    try {
      localStorage.removeItem('second_voice_history');
    } catch (e) {}
  };

  const handleDeleteHistoryItem = (idx: number) => {
    setHistoryList((prev) => {
      const updated = prev.filter((_, i) => i !== idx);
      try {
        localStorage.setItem('second_voice_history', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleUpdateProfile = (newProfile: UserSpeechProfile) => {
    setProfile(newProfile);
    try {
      localStorage.setItem('second_voice_profile', JSON.stringify(newProfile));
    } catch (e) {}
  };

  return (
    <div className="dashboard-container">
      {/* Left Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenEmergency={() => setIsEmergencyOpen(true)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main App Content Viewport */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        {/* Mobile Top Header (Hidden on Desktop) */}
        <header
          className="mobile-top-bar"
          style={{
            height: '64px',
            backgroundColor: '#faf7f2',
            borderBottom: '1px solid #ede7df',
            padding: '0 16px',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 40,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#1a1a19',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
              }}
              aria-label="Open Navigation Menu"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>
                menu
              </span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: '#1f1e1d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f3e5c8',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  graphic_eq
                </span>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '15px',
                  fontWeight: 800,
                  letterSpacing: '0.02em',
                  color: '#1a1a19',
                }}
              >
                SECOND VOICE
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsEmergencyOpen(true)}
            style={{
              padding: '6px 12px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '999px',
              color: '#b91c1c',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#dc2626',
              }}
              className="animate-pulse"
            />
            <span>HELP</span>
          </button>
        </header>

        {/* Dashboard Main Workspace Content */}
        <main className="dashboard-main-content">
          <div style={{ maxWidth: '1360px', width: '100%', margin: '0 auto' }}>
            {currentTab === 'communicate' && (
              <CommunicateScreen
                profile={profile}
                onNavigateTab={(t) => setCurrentTab(t)}
                onOpenEmergency={() => setIsEmergencyOpen(true)}
                onAddToHistory={handleAddToHistory}
              />
            )}

            {currentTab === 'vocabulary' && <VocabularyScreen />}

            {currentTab === 'calibration' && <CalibrationScreen />}

            {currentTab === 'history' && (
              <HistoryScreen
                historyList={historyList}
                onClearHistory={handleClearHistory}
                onDeleteItem={handleDeleteHistoryItem}
                onUseItem={(item) => {
                  setCurrentTab('communicate');
                }}
              />
            )}

            {currentTab === 'profile' && (
              <ProfileSettingsScreen
                profile={profile}
                onUpdateProfile={handleUpdateProfile}
                textScale={textScale}
                onChangeTextScale={(s) => {
                  setTextScale(s);
                  let multiplier = '1';
                  if (s.includes('Small')) multiplier = '0.9';
                  else if (s.includes('Medium')) multiplier = '1.0';
                  else if (s.includes('Large')) multiplier = '1.15';
                  else if (s.includes('Extra Large')) multiplier = '1.3';
                  document.documentElement.style.setProperty('--text-scale', multiplier);
                }}
              />
            )}
          </div>
        </main>
      </div>

      {/* Emergency Modal Drawer */}
      <EmergencyModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
      />

      {/* Mobile Bottom Navigation */}
      <div className="mobile-bottom-nav">
        <BottomNav
          currentTab={currentTab}
          onTabChange={(tab) => setCurrentTab(tab)}
        />
      </div>
    </div>
  );
};
