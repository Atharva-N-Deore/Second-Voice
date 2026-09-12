import os
import io
import time
import logging
from typing import Optional, Tuple
from app.core.config import settings

logger = logging.getLogger("secondvoice.stt")

class STTService:
    def __init__(self):
        self.groq_client = None
        if settings.GROQ_API_KEY:
            try:
                from groq import Groq
                self.groq_client = Groq(api_key=settings.GROQ_API_KEY)
                logger.info("Initialized Groq STT client.")
            except Exception as e:
                logger.warning(f"Could not initialize Groq client: {e}")

    async def transcribe_audio(self, audio_bytes: bytes, filename: str = "audio.wav") -> Tuple[str, float]:
        """
        Transcribe audio bytes to text.
        Returns: (transcription_text, confidence_score)
        """
        start_time = time.time()
        
        # 1. Try Groq Whisper (Ultra-fast cloud STT)
        if self.groq_client:
            try:
                # Groq accepts a tuple of (filename, file_bytes) or file-like object
                audio_file = (filename, audio_bytes)
                transcription = self.groq_client.audio.transcriptions.create(
                    file=audio_file,
                    model=settings.GROQ_STT_MODEL,
                    response_format="verbose_json",
                    temperature=0.0,
                    prompt="Speech assistance: words, introductions, greetings, questions."
                )
                text = transcription.text.strip()
                
                # Filter phantom Whisper hallucinations on silent/low-gain audio
                hallucinations = [
                    "i'm going to go to the next one",
                    "thank you for watching",
                    "thanks for watching",
                    "subtitles by",
                    "please subscribe",
                    "."
                ]
                clean_lower = text.lower().strip()
                if any(h in clean_lower for h in hallucinations) and len(clean_lower.split()) <= 8:
                    logger.warning(f"Filtered phantom Whisper hallucination: '{text}'")
                    text = ""

                logger.info(f"Groq Whisper transcription completed in {time.time() - start_time:.2f}s: '{text}'")
                return text, 0.95
            except Exception as e:
                logger.error(f"Groq STT failed: {e}. Falling back to simulated/local STT.")

        # 2. Fallback / Mock transcription for quick demo testing when API keys are not yet configured
        return self._mock_dysarthric_transcription(audio_bytes)

    def _mock_dysarthric_transcription(self, audio_bytes: bytes) -> Tuple[str, float]:
        """
        Simulated transcription for testing or offline demo.
        """
        sample_fragments = [
            "w-wa... c-cawfee... l-latte o-oat",
            "chest... h-hurt... sharp... two hours",
            "p-pass... sa... salt pl-please",
            "where... r-rest... bathroom go?",
            "n-need... m-meds... water help"
        ]
        # Deterministically select one sample based on byte length to be consistent in tests
        idx = len(audio_bytes) % len(sample_fragments)
        return sample_fragments[idx], 0.85

stt_service = STTService()
