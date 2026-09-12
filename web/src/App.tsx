import React, { useState } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { EmergencyModal } from './components/EmergencyModal';
import { CommunicateScreen } from './screens/CommunicateScreen';
import { VocabularyScreen } from './screens/VocabularyScreen';
import { CalibrationScreen } from './screens/CalibrationScreen';
import { ProfileSettingsScreen } from './screens/ProfileSettingsScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { ReconstructionResult, UserSpeechProfile } from './services/api';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('communicate');
  const [isEmergencyOpen, setIsEmergencyOpen] = useState<boolean>(false);
  const [textScale, setTextScale] = useState<string>('Large (120%)');

  const [profile, setProfile] = useState<UserSpeechProfile>({
    impairmentType: 'Dysarthria (General)',
    notes: 'Soft volume, consonant reductions',
    speechQuirks: "Difficulty with 'R' and 'Th' sounds",
    voice: 'en-US-GuyNeural'
  });

  const [historyList, setHistoryList] = useState<ReconstructionResult[]>([
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
  ]);

  const handleFontScaleToggle = () => {
    const scales = ['Small (90%)', 'Medium (100%)', 'Large (120%)', 'Extra Large (140%)'];
    const currentIdx = scales.indexOf(textScale);
    const nextScale = scales[(currentIdx + 1) % scales.length];
    setTextScale(nextScale);
    
    // Set CSS scale variable
    let multiplier = '1';
    if (nextScale.includes('Small')) multiplier = '0.9';
    else if (nextScale.includes('Medium')) multiplier = '1.0';
    else if (nextScale.includes('Large')) multiplier = '1.15';
    else if (nextScale.includes('Extra Large')) multiplier = '1.3';
    
    document.documentElement.style.setProperty('--text-scale', multiplier);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--surface)',
      color: 'var(--on-surface)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Fixed Semi-Gold Header */}
      <Header
        currentTab={currentTab}
        onOpenFontScale={handleFontScaleToggle}
        onOpenCalibration={() => setCurrentTab('calibration')}
      />

      {/* Main Screen Content */}
      <main style={{
        flex: 1,
        paddingTop: '92px',
        paddingBottom: '100px',
        paddingLeft: '16px',
        paddingRight: '16px'
      }}>
        {currentTab === 'communicate' && (
          <CommunicateScreen
            profile={profile}
            onNavigateTab={(t) => setCurrentTab(t)}
            onOpenEmergency={() => setIsEmergencyOpen(true)}
          />
        )}

        {currentTab === 'vocabulary' && <VocabularyScreen />}

        {currentTab === 'calibration' && <CalibrationScreen />}

        {currentTab === 'history' && <HistoryScreen historyList={historyList} />}

        {currentTab === 'profile' && (
          <ProfileSettingsScreen
            profile={profile}
            onUpdateProfile={(p) => setProfile(p)}
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
      </main>

      {/* Emergency Modal Drawer */}
      <EmergencyModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
      />

      {/* Fixed Semi-Gold Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
      />
    </div>
  );
};
