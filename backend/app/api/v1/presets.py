from fastapi import APIRouter
from typing import List, Dict, Any

router = APIRouter(prefix="/presets", tags=["Situational Presets"])

SITUATIONAL_PRESETS = [
    {
        "id": "cafe",
        "name": "Cafe & Dining",
        "icon": "☕",
        "color": "#f59e0b",
        "description": "Ordering drinks, food, dietary preferences, billing",
        "sample_prompts": [
            "I would like an oat milk latte, please.",
            "Can I see the menu, please?",
            "May I have the check, please?",
            "Could I please get some water?"
        ],
        "vocabulary_boost": ["latte", "coffee", "cappuccino", "sugar", "oat milk", "check", "bill", "menu", "water", "vegan"]
    },
    {
        "id": "medical",
        "name": "Clinic & Doctor",
        "icon": "🏥",
        "color": "#ef4444",
        "description": "Explaining symptoms, medication, pain levels, appointments",
        "sample_prompts": [
            "I have been feeling sharp pain in my chest.",
            "I need my scheduled medication.",
            "I feel dizzy and short of breath.",
            "Can I speak with the attending doctor?"
        ],
        "vocabulary_boost": ["pain", "symptom", "doctor", "nurse", "prescription", "allergy", "dizzy", "headache", "chest", "breathe"]
    },
    {
        "id": "emergency",
        "name": "Emergency SOS",
        "icon": "🚨",
        "color": "#dc2626",
        "description": "Urgent safety calls, falling assistance, emergency medical response",
        "sample_prompts": [
            "Emergency: I need immediate assistance!",
            "I have fallen and cannot stand up. Please help!",
            "Please call 911 immediately.",
            "I am having difficulty breathing."
        ],
        "vocabulary_boost": ["help", "emergency", "fall", "911", "ambulance", "stuck", "danger", "police", "choking"]
    },
    {
        "id": "transit",
        "name": "Transit & Taxi",
        "icon": "🚕",
        "color": "#3b82f6",
        "description": "Giving directions, destination, payment, boarding assistance",
        "sample_prompts": [
            "Please take me to Central Station.",
            "Can you drop me off near the front entrance?",
            "How much is the fare?",
            "Could you please wait for me here?"
        ],
        "vocabulary_boost": ["station", "airport", "taxi", "uber", "destination", "stop", "ticket", "entrance", "turn left", "turn right"]
    },
    {
        "id": "work",
        "name": "Workplace & Meetings",
        "icon": "💼",
        "color": "#8b5cf6",
        "description": "Meeting participation, presentations, screen sharing, questions",
        "sample_prompts": [
            "I have a question regarding the current slide.",
            "Could you please give me a moment to respond?",
            "I agree with the proposed project timeline.",
            "Let's schedule a follow-up discussion."
        ],
        "vocabulary_boost": ["presentation", "agenda", "timeline", "question", "agree", "follow-up", "screen", "document", "deadline"]
    },
    {
        "id": "home",
        "name": "Home & Daily Life",
        "icon": "🏠",
        "color": "#10b981",
        "description": "Casual conversation, family requests, chores, comfort",
        "sample_prompts": [
            "Could you please pass me the TV remote?",
            "What time are we having dinner tonight?",
            "Can you turn off the lights, please?",
            "I'm going to rest in my room."
        ],
        "vocabulary_boost": ["dinner", "lights", "remote", "door", "window", "rest", "sleep", "family", "blanket", "phone"]
    }
]

QUICK_SOS_PHRASES = [
    {"id": "sos-wait", "category": "General", "phrase": "Please give me a moment, I use an AI voice assist.", "severity": "info"},
    {"id": "sos-repeat", "category": "General", "phrase": "Could you please repeat what you just said?", "severity": "info"},
    {"id": "sos-help", "category": "Urgent", "phrase": "I need help right now, please!", "severity": "urgent"},
    {"id": "sos-fall", "category": "Emergency", "phrase": "I have fallen and cannot get up. Please assist me!", "severity": "critical"},
    {"id": "sos-911", "category": "Emergency", "phrase": "Please call an ambulance immediately.", "severity": "critical"}
]

@router.get("")
async def get_presets():
    """
    Get all situational presets and fast SOS accessibility phrases.
    """
    return {
        "presets": SITUATIONAL_PRESETS,
        "quick_phrases": QUICK_SOS_PHRASES
    }
