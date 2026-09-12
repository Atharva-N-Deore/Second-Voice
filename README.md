# Second Voice: AI for Speech Disabilities

> **Empowering independence through context-aware speech reconstruction.**

Second Voice transforms fragmented, slurred, or dysarthric speech into natural, fluent sentences and speaks them aloud in real-time.

---

## 🚀 Repository Overview

```text
SecondVoice/
├── backend/          # FastAPI AI Backend (Whisper STT + Llama 3 Reconstructor + Neural TTS)
├── web/              # React + Vite Web Application (Microphone PTT, Audio Visualizer, PWA)
├── mobile/           # React Native (Expo) Mobile App (Cross-platform iOS & Android)
├── ai_experiments/   # TORGO dataset Whisper LoRA fine-tuning notebook
└── docs/             # Architecture, system flow, and pitch deck notes
```

---

## 🛠️ Quick Start Guide

### 1. Run the Backend API (Python FastAPI)

```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python run.py
```
Backend will be live at `http://localhost:8000` (Interactive API documentation at `http://localhost:8000/docs`).

### 2. Run the Web App (React + Vite)

```bash
cd web
npm install
npm run dev
```
Web app will be available at `http://localhost:5173`.

### 3. Run the Mobile App (React Native / Expo)

```bash
cd mobile
npm install
npx expo start
```

---

## 🔑 Environment Variables & AI Keys (Optional)

Configure in `backend/.env` (or run with built-in intelligent fallback mode out-of-the-box):
```env
GROQ_API_KEY=your_groq_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```
