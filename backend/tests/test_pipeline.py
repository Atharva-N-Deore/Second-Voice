import pytest
import asyncio
from app.services.llm_service import llm_service
from app.services.stt_service import stt_service

@pytest.mark.asyncio
async def test_llm_reconstruction_coffee():
    result = await llm_service.reconstruct_speech(
        raw_transcript="w-wa... c-cawfee... l-latte o-oat",
        context="Cafe / Restaurant"
    )
    assert "latte" in result["reconstructed_text"].lower() or "coffee" in result["reconstructed_text"].lower()
    assert result["confidence"] > 0.8
    assert "coffee" in result["detected_intent"] or "drink" in result["detected_intent"] or "order" in result["detected_intent"]

@pytest.mark.asyncio
async def test_llm_reconstruction_medical():
    result = await llm_service.reconstruct_speech(
        raw_transcript="chest... h-hurt... sharp... two hours",
        context="Clinic & Doctor"
    )
    assert "chest" in result["reconstructed_text"].lower()
    assert "pain" in result["reconstructed_text"].lower() or "hurt" in result["reconstructed_text"].lower()

@pytest.mark.asyncio
async def test_stt_mock_fallback():
    text, score = await stt_service.transcribe_audio(b"fake-audio-bytes-for-test")
    assert len(text) > 0
    assert score > 0.5
