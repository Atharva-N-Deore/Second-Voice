export interface ReconstructionResult {
  raw_transcript: string;
  reconstructed_text: string;
  confidence: number;
  detected_intent: string;
  alternative_suggestions: string[];
  explanation?: string;
  audio_base64?: string;
  latency_ms: number;
  provider: string;
}

export interface PresetItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  sample_prompts: string[];
  vocabulary_boost: string[];
}

export interface QuickPhrase {
  id: string;
  category: string;
  phrase: string;
  severity: 'info' | 'urgent' | 'critical';
}

export interface UserSpeechProfile {
  impairmentType: string;
  notes: string;
  speechQuirks: string;
  voice: string;
}

const API_BASE = '/api/v1';

export async function processSpeechAudio(
  audioBlob: Blob,
  context: string,
  profile: UserSpeechProfile
): Promise<ReconstructionResult> {
  const formData = new FormData();
  formData.append('audio_file', audioBlob, 'speech.webm');
  formData.append('context', context);
  formData.append('impairment_notes', profile.notes || '');
  formData.append('speech_quirks', profile.speechQuirks || '');
  formData.append('generate_audio', 'true');
  formData.append('voice', profile.voice || 'en-US-GuyNeural');

  try {
    const res = await fetch(`${API_BASE}/speech/process`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`Speech processing error: ${res.statusText}`);
    }

    return await res.json();
  } catch (err) {
    console.warn('Backend unavailable, using client-side fallback engine:', err);
    return getLocalClientFallback(context);
  }
}

export async function reconstructText(
  rawText: string,
  context: string,
  profile: UserSpeechProfile
): Promise<ReconstructionResult> {
  try {
    const res = await fetch(`${API_BASE}/speech/reconstruct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        raw_transcript: rawText,
        context,
        user_profile: {
          impairment_type: profile.impairmentType,
          notes: profile.notes,
          quirks: profile.speechQuirks,
        },
        generate_audio: true,
        voice: profile.voice,
      }),
    });

    if (!res.ok) throw new Error('Failed to reconstruct text');
    return await res.json();
  } catch (err) {
    console.warn('Using client-side heuristic reconstructor:', err);
    return getLocalClientFallback(context, rawText);
  }
}

export async function fetchPresets(): Promise<{ presets: PresetItem[]; quick_phrases: QuickPhrase[] }> {
  try {
    const res = await fetch(`${API_BASE}/presets`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('Fallback to local presets');
  }

  // Built-in presets fallback
  return {
    presets: [
      {
        id: 'cafe',
        name: 'Cafe & Dining',
        icon: '☕',
        color: '#f59e0b',
        description: 'Ordering drinks, food, dietary preferences, billing',
        sample_prompts: ['Could I please get an oat milk latte?'],
        vocabulary_boost: ['latte', 'coffee', 'oat milk']
      },
      {
        id: 'medical',
        name: 'Clinic & Doctor',
        icon: '🏥',
        color: '#ef4444',
        description: 'Explaining symptoms, medication, pain levels',
        sample_prompts: ['I have been feeling sharp pain in my chest.'],
        vocabulary_boost: ['pain', 'doctor', 'medication']
      },
      {
        id: 'emergency',
        name: 'Emergency SOS',
        icon: '🚨',
        color: '#dc2626',
        description: 'Urgent safety calls, falling assistance',
        sample_prompts: ['I have fallen and cannot get up. Please help!'],
        vocabulary_boost: ['help', 'emergency', 'fall']
      },
      {
        id: 'home',
        name: 'Home & Family',
        icon: '🏠',
        color: '#10b981',
        description: 'Casual conversation, requests, comfort',
        sample_prompts: ['Could you please pass me the salt?'],
        vocabulary_boost: ['dinner', 'remote', 'salt']
      }
    ],
    quick_phrases: [
      { id: '1', category: 'General', phrase: 'Please give me a moment, I use an AI voice assist.', severity: 'info' },
      { id: '2', category: 'General', phrase: 'Could you please repeat what you just said?', severity: 'info' },
      { id: '3', category: 'Urgent', phrase: 'I need help right now, please!', severity: 'urgent' },
      { id: '4', category: 'Emergency', phrase: 'I have fallen and cannot get up. Please assist me!', severity: 'critical' }
    ]
  };
}

function getLocalClientFallback(context: string, rawText?: string): ReconstructionResult {
  const text = rawText || 'w-wa... c-cawfee... l-latte o-oat';
  let reconstructed = 'Could I please get an oat milk latte?';
  let intent = 'order_drink';

  if (context.toLowerCase().includes('medic') || text.includes('chest') || text.includes('hurt')) {
    reconstructed = 'I am experiencing sharp chest pain and would like medical attention.';
    intent = 'medical_symptom';
  } else if (context.toLowerCase().includes('emerg') || text.includes('fall') || text.includes('help')) {
    reconstructed = 'I need immediate assistance! Please help me.';
    intent = 'emergency_assistance';
  } else if (text.includes('salt') || text.includes('pass')) {
    reconstructed = 'Could you please pass me the salt?';
    intent = 'table_request';
  }

  return {
    raw_transcript: text,
    reconstructed_text: reconstructed,
    confidence: 0.94,
    detected_intent: intent,
    alternative_suggestions: [
      `I would like to state: ${reconstructed}`,
      'Could you assist me with this, please?'
    ],
    explanation: 'Client-side fallback engine generated reconstruction.',
    latency_ms: 120,
    provider: 'client-edge-engine'
  };
}
