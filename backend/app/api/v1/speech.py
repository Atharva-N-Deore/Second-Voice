import time
import base64
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.services.stt_service import stt_service
from app.services.llm_service import llm_service
from app.services.tts_service import tts_service

router = APIRouter(prefix="/speech", tags=["Speech Processing"])

class ReconstructRequest(BaseModel):
    raw_transcript: str
    context: Optional[str] = "General"
    user_profile: Optional[Dict[str, Any]] = None
    conversation_history: Optional[List[Dict[str, str]]] = None
    generate_audio: Optional[bool] = True
    voice: Optional[str] = None

class ReconstructResponse(BaseModel):
    raw_transcript: str
    reconstructed_text: str
    confidence: float
    detected_intent: str
    alternative_suggestions: List[str]
    explanation: Optional[str] = None
    audio_base64: Optional[str] = None
    latency_ms: int
    provider: str

@router.post("/reconstruct", response_model=ReconstructResponse)
async def reconstruct_text_endpoint(req: ReconstructRequest):
    """
    Reconstruct raw text fragments into a full contextual sentence.
    """
    start_time = time.time()
    result = await llm_service.reconstruct_speech(
        raw_transcript=req.raw_transcript,
        context=req.context or "General",
        user_profile=req.user_profile,
        conversation_history=req.conversation_history
    )

    audio_base64 = None
    if req.generate_audio and result.get("reconstructed_text"):
        audio_bytes = await tts_service.synthesize(result["reconstructed_text"], voice=req.voice)
        audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")

    total_latency = int((time.time() - start_time) * 1000)

    return ReconstructResponse(
        raw_transcript=req.raw_transcript,
        reconstructed_text=result.get("reconstructed_text", req.raw_transcript),
        confidence=result.get("confidence", 0.9),
        detected_intent=result.get("detected_intent", "general"),
        alternative_suggestions=result.get("alternative_suggestions", []),
        explanation=result.get("explanation"),
        audio_base64=audio_base64,
        latency_ms=total_latency,
        provider=result.get("provider", "secondvoice-engine")
    )

@router.post("/process", response_model=ReconstructResponse)
async def process_speech_audio_endpoint(
    audio_file: UploadFile = File(...),
    context: Optional[str] = Form("General"),
    impairment_notes: Optional[str] = Form(""),
    speech_quirks: Optional[str] = Form(""),
    generate_audio: Optional[bool] = Form(True),
    voice: Optional[str] = Form(None)
):
    """
    Full end-to-end pipeline:
    Audio In -> STT (Whisper) -> Context Reconstructor (Llama 3) -> Neural TTS -> Structured Response + Audio Stream.
    """
    start_time = time.time()
    
    # Read audio bytes
    audio_bytes = await audio_file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio file provided.")

    # 1. Speech to Text
    raw_transcript, stt_confidence = await stt_service.transcribe_audio(
        audio_bytes=audio_bytes,
        filename=audio_file.filename or "recording.wav"
    )

    user_profile = {
        "notes": impairment_notes,
        "quirks": speech_quirks
    }

    # 2. Context Reconstruction via LLM
    result = await llm_service.reconstruct_speech(
        raw_transcript=raw_transcript,
        context=context or "General",
        user_profile=user_profile
    )

    # 3. Neural TTS synthesis
    audio_base64 = None
    if generate_audio and result.get("reconstructed_text"):
        synthesized_bytes = await tts_service.synthesize(result["reconstructed_text"], voice=voice)
        audio_base64 = base64.b64encode(synthesized_bytes).decode("utf-8")

    total_latency = int((time.time() - start_time) * 1000)

    return ReconstructResponse(
        raw_transcript=raw_transcript,
        reconstructed_text=result.get("reconstructed_text", raw_transcript),
        confidence=min(stt_confidence, result.get("confidence", 0.9)),
        detected_intent=result.get("detected_intent", "general"),
        alternative_suggestions=result.get("alternative_suggestions", []),
        explanation=result.get("explanation"),
        audio_base64=audio_base64,
        latency_ms=total_latency,
        provider=result.get("provider", "secondvoice-engine")
    )
