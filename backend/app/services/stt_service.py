import os
import io
import time
import wave
import logging
import asyncio
from pathlib import Path
from typing import Optional, Tuple, Dict, Any

import numpy as np
from app.core.config import settings

logger = logging.getLogger("secondvoice.stt")

class STTService:
    def __init__(self):
        self.groq_client = None
        self.custom_whisper_model = None
        self.custom_whisper_processor = None
        self.custom_whisper_device = "cpu"
        self._load_lock = asyncio.Lock()
        self._custom_model_loaded = False
        self.last_provider = "uninitialized"

        # 1. Initialize Groq Cloud Client if key exists
        if settings.GROQ_API_KEY:
            try:
                from groq import Groq
                self.groq_client = Groq(api_key=settings.GROQ_API_KEY)
                logger.info("[STT] Initialized Groq STT client as cloud fallback.")
            except Exception as e:
                logger.warning(f"[STT] Could not initialize Groq client: {e}")

        # 2. Check Custom Fine-Tuned Whisper Weights presence
        self._weights_dir = self._resolve_weights_dir()
        if self._weights_dir:
            logger.info(f"[STT] Detected custom fine-tuned Whisper weights at: {self._weights_dir}")
        else:
            logger.info("[STT] No local custom Whisper weights found. Will use Groq/mock STT.")

    def _resolve_weights_dir(self) -> Optional[Path]:
        """Locate downloaded Whisper-Base LoRA adapter weights."""
        candidates = [
            Path(settings.CUSTOM_WHISPER_WEIGHTS_DIR),
            Path(__file__).resolve().parent.parent.parent.parent / "ai_experiments" / "second_voice_whisper_base_weights",
            Path(__file__).resolve().parent.parent.parent.parent / "ai_experiments" / "second_voice_torgo_lora_weights",
            Path.cwd() / "ai_experiments" / "second_voice_whisper_base_weights",
        ]
        for candidate in candidates:
            if candidate.is_dir() and (candidate / "adapter_config.json").is_file():
                return candidate.resolve()
        return None

    def is_custom_whisper_available(self) -> bool:
        """Check if local fine-tuned weights exist and are enabled."""
        return settings.USE_CUSTOM_WHISPER and (self._weights_dir is not None)

    async def _ensure_custom_whisper_loaded(self) -> bool:
        """Lazy-load custom Whisper-Base model and LoRA weights."""
        if self._custom_model_loaded:
            return True

        async with self._load_lock:
            if self._custom_model_loaded:
                return True

            if not self.is_custom_whisper_available():
                return False

            try:
                logger.info(f"[STT] Loading fine-tuned Whisper model from '{self._weights_dir}'...")
                start_t = time.time()

                import torch
                from transformers import WhisperProcessor, WhisperForConditionalGeneration
                from peft import PeftModel

                # Select optimal device (CUDA > MPS > CPU)
                if torch.cuda.is_available():
                    self.custom_whisper_device = "cuda"
                elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
                    self.custom_whisper_device = "mps"
                else:
                    self.custom_whisper_device = "cpu"

                base_model_name = settings.CUSTOM_WHISPER_BASE_MODEL
                logger.info(f"[STT] Instantiating base model '{base_model_name}' on device '{self.custom_whisper_device}'...")

                # Load processor & base model
                processor = WhisperProcessor.from_pretrained(base_model_name)
                base_model = WhisperForConditionalGeneration.from_pretrained(
                    base_model_name,
                    low_cpu_mem_usage=True
                )

                # Attach fine-tuned LoRA weights
                logger.info(f"[STT] Attaching LoRA multi-corpus adapter weights from '{self._weights_dir}'...")
                model = PeftModel.from_pretrained(base_model, str(self._weights_dir))
                model.to(self.custom_whisper_device)
                model.eval()

                self.custom_whisper_model = model
                self.custom_whisper_processor = processor
                self._custom_model_loaded = True

                logger.info(f"[STT] Custom Whisper-Base LoRA model successfully loaded in {time.time() - start_t:.2f}s.")
                return True

            except ImportError as e:
                logger.warning(
                    f"[STT] PyTorch/Transformers/PEFT not installed in local environment: {e}. "
                    "Install with: pip install torch transformers peft soundfile librosa"
                )
                return False
            except Exception as e:
                logger.error(f"[STT] Failed to load custom Whisper-Base model: {e}")
                return False

    def _decode_audio_bytes(self, audio_bytes: bytes) -> Optional[np.ndarray]:
        """Decode audio bytes (WAV, WebM, MP3) to 16kHz mono float32 numpy array."""
        # 1. Try soundfile
        try:
            import soundfile as sf
            with io.BytesIO(audio_bytes) as bio:
                audio, sr = sf.read(bio, dtype="float32")
                if audio.ndim > 1:
                    audio = np.mean(audio, axis=1)  # Stereo to mono
                if sr != 16000:
                    import librosa
                    audio = librosa.resample(audio, orig_sr=sr, target_sr=16000)
                return audio.astype(np.float32)
        except Exception:
            pass

        # 2. Try librosa
        try:
            import librosa
            with io.BytesIO(audio_bytes) as bio:
                audio, _ = librosa.load(bio, sr=16000, mono=True)
                return audio.astype(np.float32)
        except Exception:
            pass

        # 3. Fallback to standard library wave module for basic WAV headers
        try:
            with io.BytesIO(audio_bytes) as bio:
                with wave.open(bio, "rb") as wf:
                    channels = wf.getnchannels()
                    sr = wf.getframerate()
                    frames = wf.readframes(wf.getnframes())
                    sample_width = wf.getsampwidth()
                    if sample_width == 2:
                        dtype = np.int16
                    elif sample_width == 4:
                        dtype = np.int32
                    else:
                        dtype = np.int16
                    audio = np.frombuffer(frames, dtype=dtype).astype(np.float32) / np.iinfo(dtype).max
                    if channels > 1:
                        audio = audio.reshape(-1, channels).mean(axis=1)
                    if sr != 16000:
                        # Crude linear resample if librosa not available
                        new_len = int(len(audio) * 16000 / sr)
                        audio = np.interp(np.linspace(0, len(audio), new_len), np.arange(len(audio)), audio)
                    return audio.astype(np.float32)
        except Exception:
            pass

        return None

    async def _transcribe_with_custom_whisper(self, audio_bytes: bytes) -> Tuple[str, float]:
        """Run speech recognition through the fine-tuned Whisper-Base model."""
        import torch

        waveform = self._decode_audio_bytes(audio_bytes)
        if waveform is None or len(waveform) == 0:
            logger.warning("[STT] Failed to decode audio bytes into waveform.")
            return "", 0.0

        # Max 30 seconds (Whisper standard window)
        max_samples = 30 * 16000
        if len(waveform) > max_samples:
            waveform = waveform[:max_samples]

        # Extract features
        inputs = self.custom_whisper_processor(
            waveform,
            sampling_rate=16000,
            return_tensors="pt"
        )
        input_features = inputs.input_features.to(self.custom_whisper_device)

        with torch.no_grad():
            predicted_ids = self.custom_whisper_model.generate(
                input_features,
                max_length=128,
                language="english",
                task="transcribe"
            )

        transcription = self.custom_whisper_processor.batch_decode(
            predicted_ids,
            skip_special_tokens=True
        )[0].strip()

        return transcription, 0.95

    async def transcribe_audio(
        self,
        audio_bytes: bytes,
        filename: str = "audio.wav",
        client_transcript: Optional[str] = None
    ) -> Tuple[str, float]:
        """
        Transcribe audio bytes to text with intelligent provider selection:
        1. Custom Fine-Tuned Whisper-Base (Dysarthria LoRA)
        2. Groq Cloud Whisper
        3. Real Client Web Speech API transcript
        4. Clean fallback (no hallucinated mock phrases)
        """
        start_time = time.time()

        # -------------------------------------------------------------
        # 1. Try Custom Fine-Tuned Whisper-Base (LoRA)
        # -------------------------------------------------------------
        if self.is_custom_whisper_available():
            is_loaded = await self._ensure_custom_whisper_loaded()
            if is_loaded and self.custom_whisper_model is not None:
                try:
                    text, conf = await self._transcribe_with_custom_whisper(audio_bytes)
                    cleaned = self._filter_hallucinations(text)
                    if cleaned:
                        self.last_provider = "whisper-base-lora-multicorpus"
                        elapsed = time.time() - start_time
                        logger.info(f"[STT] Fine-tuned Whisper transcribed in {elapsed:.2f}s: '{cleaned}' (conf={conf})")
                        return cleaned, conf
                except Exception as e:
                    logger.warning(f"[STT] Custom Whisper inference error: {e}. Falling back to cloud/client STT.")

        # -------------------------------------------------------------
        # 2. Try Groq Whisper (Fast cloud STT fallback)
        # -------------------------------------------------------------
        if self.groq_client:
            try:
                audio_file = (filename, audio_bytes)
                transcription = self.groq_client.audio.transcriptions.create(
                    file=audio_file,
                    model=settings.GROQ_STT_MODEL,
                    response_format="verbose_json",
                    temperature=0.0,
                    prompt="Speech assistance: words, introductions, greetings, questions."
                )
                text = transcription.text.strip()
                cleaned = self._filter_hallucinations(text)
                if cleaned:
                    self.last_provider = "groq-whisper-cloud"
                    elapsed = time.time() - start_time
                    logger.info(f"[STT] Groq Whisper transcribed in {elapsed:.2f}s: '{cleaned}'")
                    return cleaned, 0.92
            except Exception as e:
                logger.error(f"[STT] Groq STT failed: {e}. Falling back to client transcript.")

        # -------------------------------------------------------------
        # 3. Prioritize Client Web Speech Transcript (User's real voice)
        # -------------------------------------------------------------
        if client_transcript and client_transcript.strip():
            self.last_provider = "client-web-speech"
            logger.info(f"[STT] Preserving real client speech transcript: '{client_transcript.strip()}'")
            return client_transcript.strip(), 0.95

        # -------------------------------------------------------------
        # 4. Clean silence fallback (NEVER hallucinate fake words)
        # -------------------------------------------------------------
        self.last_provider = "silence"
        return "", 0.0

    def _filter_hallucinations(self, text: str) -> str:
        """Filter phantom Whisper hallucinations on low-gain or silent audio."""
        hallucinations = [
            "i'm going to go to the next one",
            "thank you for watching",
            "thanks for watching",
            "subtitles by",
            "please subscribe",
            "you",
            "."
        ]
        clean_lower = text.lower().strip()
        if any(h in clean_lower for h in hallucinations) and len(clean_lower.split()) <= 6:
            logger.warning(f"[STT] Filtered phantom Whisper hallucination: '{text}'")
            return ""
        return text

    def get_provider_info(self) -> Dict[str, Any]:
        """Diagnostic metadata on the active STT engine."""
        return {
            "custom_whisper_configured": self.is_custom_whisper_available(),
            "custom_whisper_loaded": self._custom_model_loaded,
            "custom_weights_path": str(self._weights_dir) if self._weights_dir else None,
            "base_model": settings.CUSTOM_WHISPER_BASE_MODEL,
            "device": self.custom_whisper_device,
            "last_active_provider": self.last_provider
        }

stt_service = STTService()
