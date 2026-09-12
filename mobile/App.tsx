import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import * as Speech from 'expo-speech';
import { theme } from './src/theme';
import { reconstructTextMobile, MobileReconstructionResult } from './src/services/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'communicate' | 'history' | 'vocabulary' | 'profile'>('communicate');
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceVolume, setVoiceVolume] = useState(80);

  // Active utterance transformation
  const [activeItem, setActiveItem] = useState<MobileReconstructionResult>({
    raw_transcript: 'meeting... late... tell Rahul...',
    reconstructed_text: 'Please tell Rahul that I will be 10 minutes late to our morning sync.',
    confidence: 0.96,
    detected_intent: 'Send Message',
    alternative_suggestions: ['I am running a few minutes late for the sync with Rahul.'],
    latency_ms: 280,
    provider: 'Second Voice Neural Core'
  });

  const [historyList, setHistoryList] = useState<MobileReconstructionResult[]>([
    {
      raw_transcript: 'meeting... late... tell Rahul...',
      reconstructed_text: 'Please tell Rahul that I will be 10 minutes late to our morning sync.',
      confidence: 0.96,
      detected_intent: 'Send Message',
      alternative_suggestions: ['I am running a few minutes late for the sync with Rahul.'],
      latency_ms: 280,
      provider: 'Second Voice Neural Core'
    }
  ]);

  const speakText = (text: string) => {
    try {
      Speech.stop();
      Speech.speak(text, {
        rate: 0.95,
        pitch: 1.0,
        language: 'en-US'
      });
    } catch (e) {
      console.warn('Expo speech fallback:', e);
    }
  };

  const handleProcess = async (text: string) => {
    if (!text.trim() || isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await reconstructTextMobile(text, 'Workplace & Meetings', 'Dysarthria');
      setActiveItem(res);
      setHistoryList([res, ...historyList]);
      speakText(res.reconstructed_text);
      setInputText('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    Alert.alert('Copied', 'Sentence copied to clipboard!');
  };

  const handleEmergency = () => {
    speakText('Emergency: I need immediate assistance! Please help me right now.');
    Alert.alert('Emergency Alert', 'Emergency sentence broadcast at maximum volume.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface} />
      
      {/* Top Semi-Gold Header */}
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>🎙️</Text>
          </View>
          <View>
            <Text style={styles.headerSub}>SECOND VOICE</Text>
            <Text style={styles.headerTitle}>
              {currentTab === 'communicate' ? 'Communicate' :
               currentTab === 'history' ? 'History' :
               currentTab === 'vocabulary' ? 'Vocabulary' : 'User Profile'}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.fontScaleBtn} onPress={() => Alert.alert('Font Scale', 'Text scaling set to Large (120%)')}>
            <Text style={styles.fontScaleText}>A±</Text>
          </TouchableOpacity>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>A</Text>
            <View style={styles.presenceDot} />
          </View>
        </View>
      </View>

      {/* Main Content Area based on active tab */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {currentTab === 'communicate' && (
          <View style={styles.tabContent}>
            {/* Greeting Banner */}
            <View style={styles.greetingRow}>
              <View>
                <Text style={styles.greetingTitle}>Good morning, Alex</Text>
                <Text style={styles.greetingSub}>Your voice assistant is ready • Calibration: 87%</Text>
              </View>
              <View style={styles.engineBadge}>
                <View style={styles.engineDot} />
                <Text style={styles.engineText}>Engine Active</Text>
              </View>
            </View>

            {/* Quick Access Utility Bar (Emergency + Voice Level) */}
            <View style={styles.utilityBar}>
              <TouchableOpacity style={styles.helpButton} onPress={handleEmergency}>
                <View style={styles.helpDot} />
                <Text style={styles.helpText}>I NEED HELP</Text>
                <Text style={styles.helpArrow}>Emergency →</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.voiceLevelButton}
                onPress={() => setVoiceVolume(voiceVolume >= 100 ? 50 : voiceVolume + 25)}
              >
                <Text style={styles.voiceLevelText}>🔊 {voiceVolume}%</Text>
              </TouchableOpacity>
            </View>

            {/* Primary Speech Zone with Tactile Mic */}
            <View style={styles.micZoneCard}>
              <View style={styles.micButtonWrapper}>
                <View style={styles.micGlowRing} />
                <TouchableOpacity
                  style={styles.micButton}
                  onPress={() => handleProcess(inputText || 'w-wa... c-cawfee... l-latte o-oat')}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="large" color={theme.colors.onPrimaryContainer} />
                  ) : (
                    <Text style={styles.micButtonIcon}>🎙️</Text>
                  )}
                </TouchableOpacity>
              </View>

              <Text style={styles.micCardTitle}>
                {isProcessing ? 'Reconstructing Sentence...' : 'Tap to Speak'}
              </Text>
              <Text style={styles.micCardSub}>or hold for continuous acoustic tracking</Text>

              {/* Dynamic Waveform Visualizer */}
              <View style={styles.waveformContainer}>
                {[10, 24, 38, 18, 42, 22, 34, 14, 20].map((h, idx) => (
                  <View key={idx} style={[styles.waveformBar, { height: h }]} />
                ))}
              </View>

              {/* Text Fallback Input */}
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.textInput}
                  placeholder="or type fragmented thoughts..."
                  placeholderTextColor={theme.colors.outline}
                  value={inputText}
                  onChangeText={setInputText}
                />
                <TouchableOpacity
                  style={styles.submitInputBtn}
                  onPress={() => handleProcess(inputText)}
                  disabled={isProcessing || !inputText.trim()}
                >
                  <Text style={styles.submitInputBtnText}>➔</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Live AI Interpretation Card */}
            {activeItem && (
              <View style={styles.liveCard}>
                <View style={styles.liveHeader}>
                  <Text style={styles.liveHeaderTitle}>📊 Live Speech Detected</Text>
                  <View style={styles.confBadge}>
                    <Text style={styles.confBadgeText}>
                      AI Confidence {Math.round(activeItem.confidence * 100)}%
                    </Text>
                  </View>
                </View>

                {/* Raw Speech Box */}
                <View style={styles.rawSpeechBox}>
                  <Text style={styles.rawSpeechLabel}>RAW SPEECH INPUT:</Text>
                  <Text style={styles.rawSpeechText}>“{activeItem.raw_transcript}”</Text>
                </View>

                {/* Down Arrow */}
                <View style={styles.arrowCenter}>
                  <View style={styles.arrowCircle}>
                    <Text style={styles.arrowIcon}>↓</Text>
                  </View>
                </View>

                {/* Reconstructed Sentence */}
                <View style={styles.reconstructedBox}>
                  <View style={styles.reconstructedHeader}>
                    <Text style={styles.reconstructedTag}>RECONSTRUCTED SENTENCE</Text>
                    <Text style={styles.verifiedIcon}>✓</Text>
                  </View>
                  <Text style={styles.reconstructedText}>“{activeItem.reconstructed_text}”</Text>

                  {/* Metadata Chips */}
                  <View style={styles.chipsRow}>
                    <View style={styles.chip}>
                      <Text style={styles.chipText}>💬 Intent: {activeItem.detected_intent}</Text>
                    </View>
                    <View style={styles.chip}>
                      <Text style={styles.chipText}>👤 Context: Work → Rahul</Text>
                    </View>
                  </View>
                </View>

                {/* Protocol Notice */}
                <View style={styles.protocolBox}>
                  <Text style={styles.protocolText}>
                    🛡️ Protocol: AI Proposes • You Confirm • Second Voice Executes
                  </Text>
                </View>

                {/* Speak Out Loud Primary Button */}
                <TouchableOpacity
                  style={styles.speakPrimaryBtn}
                  onPress={() => speakText(activeItem.reconstructed_text)}
                >
                  <Text style={styles.speakPrimaryBtnText}>🔊 Speak Out Loud</Text>
                </TouchableOpacity>

                {/* 2x2 Action Grid */}
                <View style={styles.actionGrid}>
                  <TouchableOpacity
                    style={styles.actionGridBtn}
                    onPress={() => Alert.alert('Sent', 'Dispatched to Rahul!')}
                  >
                    <Text style={styles.actionGridBtnText}>📤 Send to Rahul</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionGridBtn} onPress={handleCopy}>
                    <Text style={styles.actionGridBtnText}>📋 Copy Text</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionGridBtn}
                    onPress={() => setInputText(activeItem.reconstructed_text)}
                  >
                    <Text style={styles.actionGridBtnText}>✏️ Refine / Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionGridBtn}
                    onPress={() => handleProcess('meeting... late... tell Rahul...')}
                  >
                    <Text style={styles.actionGridBtnText}>🔄 Try Again</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Quick Express Phrases */}
            <View style={styles.quickSection}>
              <View style={styles.quickHeader}>
                <Text style={styles.quickTitle}>Quick Express</Text>
                <TouchableOpacity onPress={() => setCurrentTab('vocabulary')}>
                  <Text style={styles.manageVocabText}>Manage Vocabulary</Text>
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickScroll}>
                {[
                  { text: 'Doctor appointment', icon: '🏥' },
                  { text: 'Please repeat that', icon: '🔁' },
                  { text: 'Need water', icon: '💧' },
                  { text: 'Thank you', icon: '❤️' },
                ].map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.quickPill}
                    onPress={() => speakText(item.text)}
                  >
                    <Text style={styles.quickPillIcon}>{item.icon}</Text>
                    <Text style={styles.quickPillText}>{item.text}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {currentTab === 'history' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionHeading}>Conversation History</Text>
            {historyList.map((item, idx) => (
              <View key={idx} style={styles.historyCard}>
                <Text style={styles.historyIntent}>{item.detected_intent}</Text>
                <Text style={styles.historyRaw}>RAW: "{item.raw_transcript}"</Text>
                <Text style={styles.historyReconstructed}>"{item.reconstructed_text}"</Text>
                <TouchableOpacity
                  style={styles.historySpeakBtn}
                  onPress={() => speakText(item.reconstructed_text)}
                >
                  <Text style={styles.historySpeakBtnText}>🔊 Speak</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {currentTab === 'vocabulary' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionHeading}>My Vocabulary (142 Tuned Words)</Text>
            {[
              { word: 'Amma', category: 'Family & People', exp: 'My mother, Lakshmi.' },
              { word: 'Rahul', category: 'Work', exp: 'Rahul Sharma, Lead Engineer on my team.' },
              { word: 'Need BiPAP adjust', category: 'Medical', exp: 'My respiratory BiPAP mask pressure needs adjustment.' },
              { word: 'Chai Low Sugar', category: 'Everyday', exp: 'Could I please get a hot cup of masala chai with half sugar?' }
            ].map((v, i) => (
              <View key={i} style={styles.vocabCard}>
                <View style={styles.vocabCardHeader}>
                  <Text style={styles.vocabWord}>"{v.word}"</Text>
                  <Text style={styles.vocabCat}>{v.category}</Text>
                </View>
                <Text style={styles.vocabExp}>{v.exp}</Text>
                <TouchableOpacity
                  style={styles.vocabPlayBtn}
                  onPress={() => speakText(v.exp)}
                >
                  <Text style={styles.vocabPlayBtnText}>🔊 Preview Spoken</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {currentTab === 'profile' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionHeading}>Accessibility & Voice Profile</Text>
            <View style={styles.profileCard}>
              <Text style={styles.profileCardLabel}>Assigned Neural Voice</Text>
              <Text style={styles.profileCardVal}>Guy (Natural Male, US) • Rate: 95%</Text>
              
              <Text style={styles.profileCardLabel}>Speech Profile</Text>
              <Text style={styles.profileCardVal}>Dysarthria (General) • Tremor Resilient Hit Targets</Text>
              
              <Text style={styles.profileCardLabel}>Visual Theme</Text>
              <Text style={styles.profileCardVal}>Second Voice Semi-Gold Standard</Text>

              <TouchableOpacity
                style={styles.testVoiceBtn}
                onPress={() => speakText('Hello, I am Second Voice. Your personalized voice engine is calibrated and active.')}
              >
                <Text style={styles.testVoiceBtnText}>🔊 Test Neural Speech</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Fixed Semi-Gold Bottom Navigation */}
      <View style={styles.bottomNav}>
        {[
          { id: 'communicate', label: 'Communicate', icon: '🎙️' },
          { id: 'history', label: 'History', icon: '⏱️' },
          { id: 'vocabulary', label: 'Vocabulary', icon: '📖' },
          { id: 'profile', label: 'Profile', icon: '⚙️' },
        ].map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.navTab}
              onPress={() => setCurrentTab(tab.id as any)}
            >
              <View style={[styles.navIconCircle, isActive && styles.navIconCircleActive]}>
                <Text style={styles.navIconText}>{tab.icon}</Text>
              </View>
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(253, 248, 245, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: theme.colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBadgeText: {
    fontSize: 20,
  },
  headerSub: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fontScaleBtn: {
    backgroundColor: theme.colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  fontScaleText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.onSurfaceVariant,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.secondaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarText: {
    fontWeight: '800',
    color: theme.colors.onSecondaryContainer,
  },
  presenceDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.tertiary,
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },
  tabContent: {
    gap: 14,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.onSurface,
  },
  greetingSub: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  engineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.tertiaryFixed,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 6,
  },
  engineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.tertiary,
  },
  engineText: {
    color: theme.colors.onTertiaryFixedVariant,
    fontSize: 11,
    fontWeight: '700',
  },
  utilityBar: {
    flexDirection: 'row',
    gap: 10,
  },
  helpButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceContainerLowest,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  helpDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.error,
  },
  helpText: {
    color: theme.colors.error,
    fontWeight: '800',
    fontSize: 13,
  },
  helpArrow: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
  },
  voiceLevelButton: {
    flex: 1,
    backgroundColor: theme.colors.surfaceContainerLowest,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  voiceLevelText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  micZoneCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  micButtonWrapper: {
    position: 'relative',
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 6,
  },
  micGlowRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(253, 209, 127, 0.4)',
  },
  micButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: theme.colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  micButtonIcon: {
    fontSize: 38,
  },
  micCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.onSurface,
    marginTop: 6,
  },
  micCardSub: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 10,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 44,
    marginVertical: 6,
  },
  waveformBar: {
    width: 5,
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
  },
  inputRow: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    marginTop: 8,
  },
  textInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: theme.colors.onSurface,
  },
  submitInputBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitInputBtnText: {
    color: theme.colors.onPrimaryContainer,
    fontWeight: '800',
  },
  liveCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    gap: 10,
  },
  liveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  confBadge: {
    backgroundColor: theme.colors.secondaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  confBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.onSecondaryFixed,
  },
  rawSpeechBox: {
    backgroundColor: theme.colors.surfaceContainerLow,
    padding: 10,
    borderRadius: 10,
  },
  rawSpeechLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.onSurfaceVariant,
    marginBottom: 2,
  },
  rawSpeechText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: theme.colors.onSurfaceVariant,
  },
  arrowCenter: {
    alignItems: 'center',
  },
  arrowCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(201, 164, 76, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowIcon: {
    color: theme.colors.primary,
    fontWeight: '800',
  },
  reconstructedBox: {
    backgroundColor: 'rgba(255, 223, 154, 0.35)',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(201, 164, 76, 0.3)',
  },
  reconstructedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  reconstructedTag: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  verifiedIcon: {
    color: theme.colors.primary,
    fontWeight: '800',
  },
  reconstructedText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.onSurface,
    lineHeight: 22,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  chip: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  protocolBox: {
    backgroundColor: theme.colors.surfaceContainer,
    padding: 8,
    borderRadius: 8,
  },
  protocolText: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
  },
  speakPrimaryBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  speakPrimaryBtnText: {
    color: theme.colors.onPrimary,
    fontWeight: '800',
    fontSize: 15,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionGridBtn: {
    width: '48%',
    backgroundColor: theme.colors.surfaceContainerLow,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  actionGridBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  quickSection: {
    gap: 8,
  },
  quickHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  manageVocabText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  quickScroll: {
    flexDirection: 'row',
  },
  quickPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainerLowest,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    gap: 6,
  },
  quickPillIcon: {
    fontSize: 14,
  },
  quickPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 76,
    backgroundColor: 'rgba(253, 248, 245, 0.96)',
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navTab: {
    alignItems: 'center',
  },
  navIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navIconCircleActive: {
    backgroundColor: 'rgba(201, 164, 76, 0.25)',
  },
  navIconText: {
    fontSize: 18,
  },
  navLabel: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '500',
    marginTop: 2,
  },
  navLabelActive: {
    color: theme.colors.primary,
    fontWeight: '800',
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.onSurface,
    marginBottom: 8,
  },
  historyCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    gap: 6,
    marginBottom: 10,
  },
  historyIntent: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  historyRaw: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  historyReconstructed: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  historySpeakBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  historySpeakBtnText: {
    color: theme.colors.onPrimary,
    fontWeight: '700',
  },
  vocabCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    gap: 6,
    marginBottom: 10,
  },
  vocabCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vocabWord: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.onSurface,
  },
  vocabCat: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.tertiary,
  },
  vocabExp: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
  },
  vocabPlayBtn: {
    backgroundColor: theme.colors.surfaceContainerLow,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  vocabPlayBtnText: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  profileCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    gap: 6,
  },
  profileCardLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.primary,
    marginTop: 6,
  },
  profileCardVal: {
    fontSize: 14,
    color: theme.colors.onSurface,
    fontWeight: '600',
  },
  testVoiceBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  testVoiceBtnText: {
    color: theme.colors.onPrimary,
    fontWeight: '700',
  }
});
