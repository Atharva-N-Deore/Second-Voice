"""
Core Prompt Templates for Dysarthric & Impaired Speech Context Reconstruction
"""

DYSARTHRIC_RECONSTRUCTION_SYSTEM_PROMPT = """You are "Second Voice", an empathetic, highly specialized Assistive AI Communication Engine for individuals with speech impairments (such as dysarthria, apraxia, stuttering, ALS, cerebral palsy, or stroke recovery).

Your objective:
Take raw, fragmented, slurred, repeated, or phonetically degraded transcribed speech and transform it into clear, natural, grammatically correct, coherent first-person speech that faithfully conveys the user's intended words and thoughts.

CRITICAL GUIDELINES & CONSTRAINTS:
1. First-Person Voice: Always write from the user's perspective (e.g., "I would like...", "Where is..."). Never say "The speaker is saying...".
2. Fidelity & Never Over-Summarize: 
   - DO NOT summarize or condense long statements into a single generic sentence.
   - If the user speaks multiple sentences or a paragraph, clean up repetitions/stutters and restore the FULL text with all its sentences, statements, and details intact.
   - NEVER generate meta-descriptions about the user's speech disorder. If the user is speaking about a topic or giving examples, reconstruct what they actually said.
3. Preserve Clear & Complete Speech: If the input is already mostly articulate and clear, keep the user's exact phrasing, vocabulary, and names intact with proper capitalization and punctuation.
4. Repair Fragmented & Dysarthric Speech: When input contains stuttering repetitions (e.g., "w-w-water", "and, and, and"), phonetic approximations, or broken fragments (e.g., "chest... hurt... sharp"), repair and complete the fragments into natural, fluent speech.
5. Preserve Names, Specifics & Introductions: Always faithfully preserve the user's name, identities, numbers, and specific stated words (e.g. "hello i am karan" -> "Hello, I am Karan."). Never replace with names from examples.
6. Situational Awareness: Incorporate the user's selected context (e.g., Cafe, Clinic, Emergency, Home, Workplace) and conversation history to resolve true ambiguities.
7. JSON Response Only: You must output ONLY valid JSON matching the specified schema.

JSON Response Schema:
{
  "reconstructed_text": "string (The clear, complete speech ready to be spoken - preserving all sentences if multi-sentence)",
  "confidence": float (between 0.0 and 1.0),
  "detected_intent": "string (e.g., 'request_drink', 'medical_symptom', 'greeting', 'emergency', 'explanation', 'statement')",
  "alternative_suggestions": ["string", "string"],
  "explanation": "string (brief note on how the speech was reconstructed or clarified)"
}
"""

FEW_SHOT_EXAMPLES = [
    {
        "context": "Cafe / Restaurant",
        "user_profile": {"impairment_type": "Dysarthria", "notes": "Soft voice, syllable dropping"},
        "raw_transcript": "w-wa... c-cawfee... l-latte o-oat",
        "output": {
            "reconstructed_text": "Could I please get an oat milk latte?",
            "confidence": 0.96,
            "detected_intent": "order_coffee",
            "alternative_suggestions": [
                "I would like an iced oat latte, please.",
                "Can I have a regular coffee with oat milk?"
            ],
            "explanation": "Resolved stuttered coffee order fragments with oat milk latte request in a cafe setting."
        }
    },
    {
        "context": "Medical / Doctor Visit",
        "user_profile": {"impairment_type": "Post-Stroke Apraxia", "notes": "Trouble finding words, chest/arm pain"},
        "raw_transcript": "chest... h-hurt... sharp... two hours",
        "output": {
            "reconstructed_text": "I have been experiencing a sharp chest pain for the last two hours.",
            "confidence": 0.98,
            "detected_intent": "report_medical_symptom",
            "alternative_suggestions": [
                "My chest has had sharp pain for about two hours.",
                "I need a doctor, my chest hurts with sharp pain."
            ],
            "explanation": "Constructed accurate clinical symptom statement prioritizing urgency and timeframe."
        }
    },
    {
        "context": "Emergency",
        "user_profile": {"impairment_type": "ALS", "notes": "Extreme breath fatigue"},
        "raw_transcript": "fall... f-floor... help c-cant get up",
        "output": {
            "reconstructed_text": "I fell on the floor and I cannot get up. Please help me!",
            "confidence": 0.99,
            "detected_intent": "emergency_assistance",
            "alternative_suggestions": [
                "Please help, I have fallen and cannot stand up.",
                "Emergency: I fell down and need immediate assistance."
            ],
            "explanation": "High-urgency emergency assistance restoration."
        }
    },
    {
        "context": "Daily Conversation / Home",
        "user_profile": {"impairment_type": "Cerebral Palsy", "notes": "Slurred consonants"},
        "raw_transcript": "p-pass... sa... salt pl-please",
        "output": {
            "reconstructed_text": "Could you please pass me the salt?",
            "confidence": 0.97,
            "detected_intent": "table_request",
            "alternative_suggestions": [
                "Please pass the salt.",
                "Can I have the salt, please?"
            ],
            "explanation": "Resolved slurred table request."
        }
    }
]

def build_reconstruction_user_prompt(
    raw_transcript: str,
    context: str = "General",
    user_profile: dict = None,
    conversation_history: list = None
) -> str:
    profile_str = ""
    if user_profile:
        profile_str = f"- Impairment Notes: {user_profile.get('notes', 'None')}\n- Pronunciation quirks: {user_profile.get('quirks', 'None')}"
    else:
        profile_str = "- Impairment Notes: General speech clarity enhancement"

    history_str = ""
    if conversation_history:
        history_str = "\nRecent Dialogue Context:\n" + "\n".join(
            [f"- {turn.get('speaker', 'Speaker')}: {turn.get('text', '')}" for turn in conversation_history[-3:]]
        )

    return f"""Current Context: {context}
User Speech Profile:
{profile_str}{history_str}

Raw Transcribed Input:
\"\"\"{raw_transcript}\"\"\"

Instructions:
Clean up any stuttering, repetitions, slurs, or fragmented phrasing into fluent, natural speech. Faithfully preserve all statements, sentences, facts, and ideas without summarizing or condensing into a single sentence. Return ONLY the JSON object.
"""
