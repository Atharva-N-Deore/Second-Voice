import io
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
from app.services.tts_service import tts_service

router = APIRouter(prefix="/tts", tags=["Text-to-Speech"])

class SynthesizeRequest(BaseModel):
    text: str
    voice: Optional[str] = None

@router.post("/synthesize")
async def synthesize_text(req: SynthesizeRequest):
    """
    Synthesize text to audio stream (MP3).
    """
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
        
    audio_bytes = await tts_service.synthesize(req.text, voice=req.voice)
    return StreamingResponse(
        io.BytesIO(audio_bytes),
        media_type="audio/mpeg",
        headers={"Content-Disposition": "inline; filename=speech.mp3"}
    )

@router.get("/voices")
async def get_available_voices():
    """
    List supported high quality neural voices.
    """
    return {
        "voices": [
            {"id": "en-US-GuyNeural", "name": "Guy (Natural Male, US)", "gender": "Male", "lang": "en-US"},
            {"id": "en-US-JennyNeural", "name": "Jenny (Natural Female, US)", "gender": "Female", "lang": "en-US"},
            {"id": "en-US-AriaNeural", "name": "Aria (Expressive Female, US)", "gender": "Female", "lang": "en-US"},
            {"id": "en-GB-RyanNeural", "name": "Ryan (Natural Male, UK)", "gender": "Male", "lang": "en-GB"},
            {"id": "en-GB-SoniaNeural", "name": "Sonia (Natural Female, UK)", "gender": "Female", "lang": "en-GB"},
            {"id": "en-AU-WilliamNeural", "name": "William (Natural Male, AU)", "gender": "Male", "lang": "en-AU"}
        ]
    }
