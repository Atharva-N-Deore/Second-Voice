export interface StopResult {
  blob: Blob;
  transcript: string;
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private recognition: any = null;
  private liveTranscript: string = '';
  private isRecordingActive: boolean = false;

  async start(
    onVolumeChange?: (volume: number) => void,
    onLiveTranscript?: (text: string) => void
  ): Promise<void> {
    this.audioChunks = [];
    this.liveTranscript = '';
    this.isRecordingActive = true;

    // High quality audio capture with noise suppression and auto gain
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    // Web Speech API for real-time live transcription
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event: any) => {
          let fullText = '';
          for (let i = 0; i < event.results.length; i++) {
            fullText += event.results[i][0].transcript;
          }
          this.liveTranscript = fullText.trim();
          if (onLiveTranscript && this.liveTranscript) {
            onLiveTranscript(this.liveTranscript);
          }
        };

        this.recognition.onerror = (e: any) => {
          console.warn('Speech recognition status:', e?.error || e);
        };

        this.recognition.onend = () => {
          if (this.isRecordingActive && this.recognition) {
            try {
              this.recognition.start();
            } catch (err) {
              // ignore
            }
          }
        };

        this.recognition.start();
      } catch (err) {
        console.warn('Speech recognition init error:', err);
      }
    }

    // Web Audio Analyser for real-time visualizer
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      this.microphone = this.audioContext.createMediaStreamSource(this.stream);
      this.microphone.connect(this.analyser);

      if (onVolumeChange) {
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        const updateVolume = () => {
          if (!this.analyser || !this.isRecordingActive) return;
          this.analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const normalized = Math.min(1, avg / 128);
          onVolumeChange(normalized);
          requestAnimationFrame(updateVolume);
        };
        requestAnimationFrame(updateVolume);
      }
    } catch (e) {
      console.warn('Audio analyser notice:', e);
    }

    // MediaRecorder for raw audio blob
    let mimeType = 'audio/webm;codecs=opus';
    if (!MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
    }

    this.mediaRecorder = new MediaRecorder(this.stream, mimeType ? { mimeType } : undefined);
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        this.audioChunks.push(e.data);
      }
    };

    this.mediaRecorder.start(200); // 200ms slice
  }

  stop(): Promise<StopResult> {
    this.isRecordingActive = false;

    return new Promise((resolve) => {
      if (this.recognition) {
        try {
          this.recognition.stop();
        } catch (e) {
          // ignore
        }
      }

      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        const capturedTranscript = this.liveTranscript;
        const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.cleanup();
        resolve({ blob, transcript: capturedTranscript });
        return;
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const blob = new Blob(this.audioChunks, { type: mimeType });
        const capturedTranscript = this.liveTranscript;
        this.cleanup();
        resolve({ blob, transcript: capturedTranscript });
      };

      try {
        this.mediaRecorder.stop();
      } catch (e) {
        const capturedTranscript = this.liveTranscript;
        const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.cleanup();
        resolve({ blob, transcript: capturedTranscript });
      }
    });
  }

  private cleanup() {
    this.isRecordingActive = false;
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch (e) {
        // ignore
      }
    }
    this.audioContext = null;
    this.analyser = null;
    this.microphone = null;
    this.recognition = null;
  }
}

let activeAudioElement: HTMLAudioElement | null = null;

export function playAudioBase64(base64Data: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      if (activeAudioElement) {
        activeAudioElement.pause();
        activeAudioElement.currentTime = 0;
        activeAudioElement = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }

      const audio = new Audio(`data:audio/mpeg;base64,${base64Data}`);
      activeAudioElement = audio;

      audio.onended = () => {
        activeAudioElement = null;
        resolve();
      };
      audio.onerror = (e) => {
        activeAudioElement = null;
        reject(e);
      };

      audio.play().catch((err) => {
        activeAudioElement = null;
        reject(err);
      });
    } catch (e) {
      reject(e);
    }
  });
}

export function speakWithBrowserTTS(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (activeAudioElement) {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
      activeAudioElement = null;
    }
    if (!('speechSynthesis' in window)) {
      resolve();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}
