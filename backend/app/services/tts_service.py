import io
import os
import logging
import asyncio
from typing import Optional
from app.core.config import settings

logger = logging.getLogger("secondvoice.tts")

class TTSService:
    def __init__(self):
        self.default_voice = settings.DEFAULT_TTS_VOICE

    async def synthesize(self, text: str, voice: Optional[str] = None) -> bytes:
        """
        Synthesize text into high-quality neural speech audio (MP3 bytes).
        Uses edge-tts (free, ultra-high quality, multi-voice).
        """
        selected_voice = voice or self.default_voice
        try:
            import edge_tts
            communicate = edge_tts.Communicate(text, selected_voice)
            audio_buffer = io.BytesIO()
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_buffer.write(chunk["data"])
            
            audio_bytes = audio_buffer.getvalue()
            logger.info(f"Generated {len(audio_bytes)} bytes of neural speech for text: '{text[:30]}...'")
            return audio_bytes
        except Exception as e:
            logger.warning(f"Edge TTS synthesis failed or not installed: {e}. Generating silent/placeholder WAV.")
            return self._generate_fallback_wav()

    def _generate_fallback_wav(self) -> bytes:
        """
        Generate a valid small WAV header so frontend doesn't crash if offline.
        """
        import struct
        sample_rate = 16000
        num_samples = 8000  # 0.5s of audio
        data = b"\x00\x00" * num_samples
        byte_rate = sample_rate * 2
        block_align = 2
        wav_header = struct.pack(
            "<4sI4s4sIHHIIHH4sI",
            b"RIFF",
            36 + len(data),
            b"WAVE",
            b"fmt ",
            16,
            1,  # PCM
            1,  # Mono
            sample_rate,
            byte_rate,
            block_align,
            16,  # Bits per sample
            b"data",
            len(data),
        )
        return wav_header + data

tts_service = TTSService()
