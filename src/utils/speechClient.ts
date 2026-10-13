// Speech Recognition and TTS Integration for Accessible Video Call
import { speakText } from './sound';

export interface SpeechClientCallbacks {
  onTranscript?: (text: string, isFinal: boolean) => void;
  onListeningStateChange?: (isListening: boolean) => void;
  onError?: (err: string) => void;
}

export class SpeechClient {
  private recognition: any = null;
  private isListening: boolean = false;
  private callbacks: SpeechClientCallbacks = {};

  constructor(callbacks: SpeechClientCallbacks = {}) {
    this.callbacks = callbacks;
    this.initRecognition();
  }

  private initRecognition() {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      console.warn('[SpeechClient] SpeechRecognition API not supported in this browser.');
      return;
    }

    try {
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
        this.callbacks.onListeningStateChange?.(true);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.callbacks.onListeningStateChange?.(false);
      };

      this.recognition.onerror = (event: any) => {
        console.warn('[SpeechClient] Recognition error:', event.error);
        this.callbacks.onError?.(event.error);
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript.trim()) {
          this.callbacks.onTranscript?.(finalTranscript.trim(), true);
        } else if (interimTranscript.trim()) {
          this.callbacks.onTranscript?.(interimTranscript.trim(), false);
        }
      };
    } catch (e) {
      console.warn('[SpeechClient] Initialization error:', e);
    }
  }

  public isSupported(): boolean {
    return !!this.recognition;
  }

  public startListening() {
    if (!this.recognition || this.isListening) return;
    try {
      this.recognition.start();
    } catch (err: any) {
      console.warn('[SpeechClient] Failed to start recognition:', err);
    }
  }

  public stopListening() {
    if (!this.recognition || !this.isListening) return;
    try {
      this.recognition.stop();
    } catch (err: any) {
      console.warn('[SpeechClient] Failed to stop recognition:', err);
    }
  }

  public toggleListening(): boolean {
    if (this.isListening) {
      this.stopListening();
      return false;
    } else {
      this.startListening();
      return true;
    }
  }

  public speak(text: string, rate = 1.0) {
    if (!text.trim()) return;
    speakText(text, undefined, rate);
  }

  public stopSpeaking() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}
