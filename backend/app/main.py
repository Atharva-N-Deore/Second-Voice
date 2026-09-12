import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.speech import router as speech_router
from app.api.v1.tts import router as tts_router
from app.api.v1.presets import router as presets_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("secondvoice")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Intelligent context-aware speech reconstruction and accessibility engine for individuals with speech impairments."
)

# Enable CORS for Web and Mobile development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, refine to specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(speech_router, prefix=settings.API_V1_STR)
app.include_router(tts_router, prefix=settings.API_V1_STR)
app.include_router(presets_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs_url": "/docs",
        "endpoints": {
            "process_speech": f"{settings.API_V1_STR}/speech/process",
            "reconstruct_text": f"{settings.API_V1_STR}/speech/reconstruct",
            "tts_synthesize": f"{settings.API_V1_STR}/tts/synthesize",
            "presets": f"{settings.API_V1_STR}/presets"
        }
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "groq_configured": bool(settings.GROQ_API_KEY),
        "gemini_configured": bool(settings.GEMINI_API_KEY),
        "version": settings.VERSION
    }
