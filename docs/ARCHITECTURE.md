# Second Voice: System Architecture & Data Flow

## 1. High-Level Architecture

```text
[ User Audio Input / Fragments ]
              │
              ▼
┌───────────────────────────────┐
│     Speech-to-Text (STT)      │ ──> (Whisper-Large-v3 via Groq / TORGO Fine-tuned)
└──────────────┬────────────────┘
               │ Raw Transcribed Fragments (e.g. "w-wa... c-cawfee... l-latte o-oat")
               ▼
┌───────────────────────────────┐
│   Context-Aware Reconstructor │ <── [ Active Situational Context (Cafe/Doctor/SOS) ]
│      (Llama 3.3 / Gemini)     │ <── [ User Speech Impairment Profile & Quirks ]
└──────────────┬────────────────┘
               │ Clear, Restored 1st-Person Sentence ("Could I please get an oat milk latte?")
               ▼
┌───────────────────────────────┐
│       Neural Voice TTS        │ ──> (Edge-TTS / Web Speech / Neural Voices)
└──────────────┬────────────────┘
               │
               ▼
   [ Natural Voice Spoken Out ]
```

## 2. Key Differentiators for Hackathons

1. **Context-Aware Completion over Direct STT**: Standard STT fails when consonants are slurred or speech is dysarthric. Second Voice uses conversational context to deduce intended meaning.
2. **Sub-second Response Time**: Powered by Groq's LPU inference engine for Whisper & Llama-3.
3. **Multi-Platform Access**: Available as a high-accessibility Web PWA and React Native mobile app.
4. **Adaptive Personalization**: Incorporates specific speech impairment traits (e.g. difficulty with 'R' sounds, stutter repetitions).
