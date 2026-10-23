import { SupportedLanguage, VoiceStatus } from '../types';

export const BCP47_LANGUAGE_MAP: Record<SupportedLanguage, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  pa: 'pa-IN',
  mr: 'mr-IN',
  te: 'te-IN',
  ta: 'ta-IN',
  kn: 'kn-IN',
  gu: 'gu-IN',
  bn: 'bn-IN',
};

export const LANGUAGE_DISPLAY_NAMES: Record<SupportedLanguage, { name: string; native: string }> = {
  en: { name: 'English (India)', native: 'English' },
  hi: { name: 'Hindi', native: 'हिन्दी' },
  pa: { name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  mr: { name: 'Marathi', native: 'मराठी' },
  te: { name: 'Telugu', native: 'తెలుగు' },
  ta: { name: 'Tamil', native: 'தமிழ்' },
  kn: { name: 'Kannada', native: 'ಕನ್ನಡ' },
  gu: { name: 'Gujarati', native: 'ગુજરાતી' },
  bn: { name: 'Bengali', native: 'বাংলা' },
};

export type VoiceState = 'idle' | 'requesting-permission' | 'listening' | 'processing' | 'review' | 'error';
export type RecognitionState = 'ready' | 'listening' | 'processing' | 'error';
export type TtsState = 'idle' | 'speaking' | 'paused';

export interface VoiceError {
  type: 'not-allowed' | 'no-speech' | 'network' | 'unsupported' | 'aborted' | 'unknown' | string;
  message: string;
  friendlyAdvice?: string;
  isPermissionDenied?: boolean;
}

export interface VoiceLanguageConfig {
  bcp47: string;
  langName: string;
  nativeName: string;
}

export const VOICE_LANGUAGE_MAP: Record<SupportedLanguage, VoiceLanguageConfig> = {
  en: { bcp47: 'en-IN', langName: 'English (India)', nativeName: 'English' },
  hi: { bcp47: 'hi-IN', langName: 'Hindi', nativeName: 'हिन्दी' },
  pa: { bcp47: 'pa-IN', langName: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  mr: { bcp47: 'mr-IN', langName: 'Marathi', nativeName: 'मराठी' },
  te: { bcp47: 'te-IN', langName: 'Telugu', nativeName: 'తెలుగు' },
  ta: { bcp47: 'ta-IN', langName: 'Tamil', nativeName: 'தமிழ்' },
  kn: { bcp47: 'kn-IN', langName: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  gu: { bcp47: 'gu-IN', langName: 'Gujarati', nativeName: 'ગુજરાતી' },
  bn: { bcp47: 'bn-IN', langName: 'Bengali', nativeName: 'বাংলা' },
};

export interface RecognitionCallbacks {
  onStart?: () => void;
  onInterim?: (transcript: string) => void;
  onFinal?: (transcript: string) => void;
  onError?: (errorMessage: string, isPermissionDenied: boolean) => void;
  onEnd?: () => void;
}

export class VoiceService {
  private currentRecognition: any = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private activeUtteranceId: string | null = null;
  private ttsState: TtsState = 'idle';
  private onTtsStateChange?: (state: TtsState) => void;
  private currentStatus: VoiceStatus = 'idle';
  private statusListeners: Set<(status: VoiceStatus) => void> = new Set();
  private statusTimer: any = null;

  getStatus(): VoiceStatus {
    return this.currentStatus;
  }

  setStatus(status: VoiceStatus, autoResetMs?: number): void {
    if (this.statusTimer) {
      clearTimeout(this.statusTimer);
      this.statusTimer = null;
    }
    this.currentStatus = status;
    this.statusListeners.forEach((fn) => {
      try {
        fn(status);
      } catch (err) {
        console.error('Error notifying voice status listener', err);
      }
    });

    if (autoResetMs && autoResetMs > 0 && status !== 'idle') {
      this.statusTimer = setTimeout(() => {
        this.setStatus('idle');
      }, autoResetMs);
    }
  }

  subscribeStatus(listener: (status: VoiceStatus) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.currentStatus);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  getActiveUtteranceId(): string | null {
    return this.activeUtteranceId;
  }

  isSpeaking(): boolean {
    if (typeof window !== 'undefined' && window.speechSynthesis?.speaking) {
      return true;
    }
    return this.ttsState === 'speaking';
  }

  stop(): void {
    this.stopSpeaking();
  }

  /**
   * Check if SpeechRecognition is available in the browser.
   */
  isRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
  }

  /**
   * Check if SpeechSynthesis is available in the browser.
   */
  isTtsSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
  }

  /**
   * Get BCP 47 code for SupportedLanguage.
   */
  getBcp47Code(lang: SupportedLanguage): string {
    return BCP47_LANGUAGE_MAP[lang] || 'en-IN';
  }

  /**
   * Explicitly check or request microphone permission via MediaDevices API.
   * This gives the user the clear browser permission prompt if not yet granted.
   */
  async requestMicrophonePermission(): Promise<{ granted: boolean; error?: string }> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      // Some browsers (or older Android webviews) do not support getUserMedia directly,
      // but their SpeechRecognition still works natively.
      return { granted: true };
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop all tracks immediately so the microphone is released for speech recognition
      stream.getTracks().forEach((track) => track.stop());
      return { granted: true };
    } catch (err: any) {
      let message = 'Microphone access was denied. Please allow microphone permissions in your browser address bar.';
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'No microphone device was detected on your phone or computer.';
      } else if (err.name === 'NotReadableError') {
        message = 'Your microphone is currently in use by another application.';
      }
      return { granted: false, error: message };
    }
  }

  /**
   * Start Speech Recognition with language and event callbacks or structured options.
   */
  startListening(
    langOrOptions:
      | SupportedLanguage
      | {
          language: SupportedLanguage;
          onStateChange?: (state: RecognitionState) => void;
          onInterimResult?: (text: string) => void;
          onFinalResult?: (finalText: string) => void;
          onError?: (err: VoiceError) => void;
        },
    legacyCallbacks?: RecognitionCallbacks
  ): { stop: () => void; cancel: () => void } {
    this.stopListening();

    let lang: SupportedLanguage;
    let callbacks: RecognitionCallbacks;

    if (typeof langOrOptions === 'object' && langOrOptions !== null) {
      lang = langOrOptions.language;
      callbacks = {
        onStart: () => langOrOptions.onStateChange?.('listening'),
        onInterim: (t) => langOrOptions.onInterimResult?.(t),
        onFinal: (t) => langOrOptions.onFinalResult?.(t),
        onError: (msg, isPerm) => {
          langOrOptions.onStateChange?.('error');
          langOrOptions.onError?.({
            type: isPerm ? 'not-allowed' : 'unknown',
            message: msg,
            isPermissionDenied: isPerm,
          });
        },
        onEnd: () => {
          langOrOptions.onStateChange?.('ready');
        },
      };
    } else {
      lang = langOrOptions;
      callbacks = legacyCallbacks || {};
    }

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      if (callbacks.onError) {
        callbacks.onError(
          'Your web browser does not support voice input. You can type your request directly or use Chrome, Edge, or Samsung Internet.',
          false
        );
      }
      return { stop: () => {}, cancel: () => {} };
    }

    try {
      const recognition = new SpeechRecognitionClass();
      this.currentRecognition = recognition;

      const langCode = this.getBcp47Code(lang);
      recognition.lang = langCode;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      let hasReceivedFinal = false;

      recognition.onstart = () => {
        this.setStatus('listening');
        if (callbacks.onStart) callbacks.onStart();
      };

      recognition.onresult = (event: any) => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          const transcript = result[0]?.transcript || '';
          if (result.isFinal) {
            finalText += transcript;
          } else {
            interimText += transcript;
          }
        }

        if (interimText && callbacks.onInterim) {
          this.setStatus('listening');
          callbacks.onInterim(interimText.trim());
        }

        if (finalText) {
          hasReceivedFinal = true;
          this.setStatus('success', 1800);
          if (callbacks.onFinal) {
            callbacks.onFinal(finalText.trim());
          }
        }
      };

      recognition.onerror = (event: any) => {
        const errorType = event.error;
        let isPermissionDenied = false;
        let message = 'Could not recognize speech. Please try again or type below.';

        switch (errorType) {
          case 'not-allowed':
          case 'permission-denied':
            isPermissionDenied = true;
            message = 'Microphone permission was blocked. Please enable microphone access in your browser settings to speak.';
            break;
          case 'no-speech':
            message = 'No speech was detected. Please tap the microphone and speak clearly into your device.';
            break;
          case 'audio-capture':
            message = 'No microphone was found. Please ensure a microphone is connected.';
            break;
          case 'network':
            message = 'Network error during speech recognition. Please check your internet connection.';
            break;
          case 'aborted':
            message = 'Voice listening was stopped.';
            break;
          default:
            message = `Speech recognition notice: ${event.message || errorType || 'Unable to capture speech'}.`;
            break;
        }

        if (errorType !== 'aborted') {
          this.setStatus('error', 3000);
        } else {
          this.setStatus('idle');
        }

        if (callbacks.onError) {
          callbacks.onError(message, isPermissionDenied);
        }
      };

      recognition.onend = () => {
        this.currentRecognition = null;
        if (!hasReceivedFinal && this.getStatus() === 'listening') {
          this.setStatus('idle');
        }
        if (callbacks.onEnd) {
          callbacks.onEnd();
        }
      };

      recognition.start();

      return {
        stop: () => {
          try {
            recognition.stop();
          } catch {
            // Ignore if already stopped
          }
          if (this.getStatus() === 'listening') {
            this.setStatus('processing');
          }
        },
        cancel: () => {
          try {
            recognition.abort();
          } catch {
            // Ignore if already aborted
          }
          this.setStatus('idle');
        },
      };
    } catch (err: any) {
      this.setStatus('error', 3000);
      if (callbacks.onError) {
        callbacks.onError(err.message || 'Failed to start microphone speech recognition.', false);
      }
      return { stop: () => {}, cancel: () => {} };
    }
  }

  /**
   * Stop any active SpeechRecognition.
   */
  stopListening(): void {
    if (this.currentRecognition) {
      try {
        this.currentRecognition.stop();
      } catch {
        // Ignore
      }
      this.currentRecognition = null;
    }
    if (this.getStatus() === 'listening') {
      this.setStatus('idle');
    }
  }

  /**
   * Cancel any active SpeechRecognition immediately without producing more results.
   */
  cancelListening(): void {
    if (this.currentRecognition) {
      try {
        this.currentRecognition.abort();
      } catch {
        // Ignore
      }
      this.currentRecognition = null;
    }
    this.setStatus('idle');
  }

  // ==================== TEXT TO SPEECH (TTS) ====================

  /**
   * Clean markdown and technical syntax for spoken natural reading.
   */
  cleanTextForSpeech(rawText: string): string {
    return rawText
      .replace(/[*_#`~]/g, '') // Remove markdown emphasis & headers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to anchor text
      .replace(/•|\-|\+/g, ', ') // Convert bullets to pauses
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/https?:\/\/\S+/g, '') // Remove raw URLs
      .trim();
  }

  /**
   * Find the most compatible voice for the user's selected language.
   */
  private getBestVoice(lang: SupportedLanguage): SpeechSynthesisVoice | null {
    if (!this.isTtsSupported()) return null;

    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    const bcp47 = this.getBcp47Code(lang).toLowerCase();
    const primaryCode = lang.toLowerCase();

    // 1. Exact BCP 47 match (e.g. kn-IN, hi-IN, etc.)
    const exactMatch = voices.find((v) => v.lang.toLowerCase() === bcp47 || v.lang.toLowerCase().replace('_', '-') === bcp47);
    if (exactMatch) return exactMatch;

    // 2. Prefix match (e.g. starts with 'hi', 'kn', 'ta', etc.)
    const prefixMatch = voices.find((v) => v.lang.toLowerCase().startsWith(primaryCode));
    if (prefixMatch) return prefixMatch;

    // 3. Indian English fallback
    const indianEnglish = voices.find((v) => v.lang.toLowerCase().includes('en-in') || v.name.toLowerCase().includes('india'));
    if (indianEnglish) return indianEnglish;

    // 4. Default voice
    const defaultVoice = voices.find((v) => v.default) || voices[0];
    return defaultVoice || null;
  }

  /**
   * Speak text aloud using browser SpeechSynthesis.
   */
  speakText(
    text: string,
    lang: SupportedLanguage,
    onStateChange?: (state: TtsState) => void
  ): boolean {
    if (!this.isTtsSupported()) {
      if (onStateChange) onStateChange('idle');
      return false;
    }

    this.stopSpeaking();
    this.onTtsStateChange = onStateChange;

    const spokenText = this.cleanTextForSpeech(text);
    if (!spokenText) {
      if (onStateChange) onStateChange('idle');
      return false;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(spokenText);
      const voice = this.getBestVoice(lang);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang = this.getBcp47Code(lang);
      }

      utterance.rate = 0.95; // Slightly slower, highly clear for agricultural guidance
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        this.ttsState = 'speaking';
        if (this.onTtsStateChange) this.onTtsStateChange('speaking');
      };

      utterance.onpause = () => {
        this.ttsState = 'paused';
        if (this.onTtsStateChange) this.onTtsStateChange('paused');
      };

      utterance.onresume = () => {
        this.ttsState = 'speaking';
        if (this.onTtsStateChange) this.onTtsStateChange('speaking');
      };

      utterance.onend = () => {
        this.ttsState = 'idle';
        this.currentUtterance = null;
        if (this.onTtsStateChange) this.onTtsStateChange('idle');
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        this.ttsState = 'idle';
        this.currentUtterance = null;
        if (this.onTtsStateChange) this.onTtsStateChange('idle');
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
      return true;
    } catch (err) {
      console.error('Failed to speak text:', err);
      this.ttsState = 'idle';
      if (onStateChange) onStateChange('idle');
      return false;
    }
  }

  /**
   * Pause current speech playback.
   */
  pauseSpeaking(): void {
    if (this.isTtsSupported() && window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      this.ttsState = 'paused';
      if (this.onTtsStateChange) this.onTtsStateChange('paused');
    }
  }

  /**
   * Resume paused speech playback.
   */
  resumeSpeaking(): void {
    if (this.isTtsSupported() && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      this.ttsState = 'speaking';
      if (this.onTtsStateChange) this.onTtsStateChange('speaking');
    }
  }

  /**
   * Stop current speech playback.
   */
  stopSpeaking(): void {
    if (this.isTtsSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    }
    this.ttsState = 'idle';
    this.currentUtterance = null;
    if (this.onTtsStateChange) this.onTtsStateChange('idle');
  }

  /**
   * Flexible speak helper supporting options object or parameters with callbacks.
   */
  speak(
    textOrOptions:
      | string
      | {
          text: string;
          language: SupportedLanguage;
          utteranceId?: string;
          onStart?: () => void;
          onEnd?: () => void;
          onError?: (err?: any) => void;
          onPause?: () => void;
          onResume?: () => void;
        },
    lang?: SupportedLanguage,
    callbacksOrStateChange?:
      | ((state: TtsState) => void)
      | {
          onStart?: () => void;
          onEnd?: () => void;
          onError?: (err?: any) => void;
          onPause?: () => void;
          onResume?: () => void;
        }
  ): any {
    if (typeof textOrOptions === 'object' && textOrOptions !== null) {
      const opts = textOrOptions;
      this.activeUtteranceId = opts.utteranceId || null;
      if (!this.isTtsSupported()) {
        opts.onError?.('TTS not supported');
        return Promise.resolve({
          success: false,
          notice: 'Audio playback is not supported in this browser. Please read the guidance on screen.',
        });
      }

      const spoke = this.speakText(opts.text, opts.language, (state) => {
        if (state === 'speaking') {
          opts.onStart?.();
        } else if (state === 'paused') {
          opts.onPause?.();
        } else if (state === 'idle') {
          if (this.activeUtteranceId === opts.utteranceId) {
            this.activeUtteranceId = null;
          }
          opts.onEnd?.();
        }
      });

      return Promise.resolve({
        success: spoke,
        notice: spoke ? undefined : 'Could not start audio reading.',
      });
    }

    const text = textOrOptions as string;
    const targetLang = lang || 'en';

    if (!callbacksOrStateChange || typeof callbacksOrStateChange === 'function') {
      return this.speakText(text, targetLang, callbacksOrStateChange);
    }

    return this.speakText(text, targetLang, (state) => {
      if (state === 'speaking') {
        callbacksOrStateChange.onStart?.();
        callbacksOrStateChange.onResume?.();
      } else if (state === 'paused') {
        callbacksOrStateChange.onPause?.();
      } else if (state === 'idle') {
        this.activeUtteranceId = null;
        callbacksOrStateChange.onEnd?.();
      }
    });
  }

  pause(): void {
    this.pauseSpeaking();
  }

  resume(): void {
    this.resumeSpeaking();
  }

  getTtsState(): TtsState {
    return this.ttsState;
  }
}

export const voiceService = new VoiceService();
