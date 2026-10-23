import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Square, AlertCircle, RefreshCw, Sparkles, Check, X } from 'lucide-react';
import { SupportedLanguage } from '../types';
import { voiceService, RecognitionState, VoiceError, VOICE_LANGUAGE_MAP } from '../services/voiceService';
import { TRANSLATIONS } from '../constants/translations';

interface VoiceMicButtonProps {
  language: SupportedLanguage;
  onTranscript: (text: string) => void;
  onInterimText?: (text: string) => void;
  onSubmitImmediately?: (text: string) => void;
  placeholderText?: string;
  className?: string;
  size?: 'md' | 'lg';
}

export const VoiceMicButton: React.FC<VoiceMicButtonProps> = ({
  language,
  onTranscript,
  onInterimText,
  onSubmitImmediately,
  className = '',
  size = 'md',
}) => {
  const [recState, setRecState] = useState<RecognitionState>('ready');
  const [interimSpeech, setInterimSpeech] = useState<string>('');
  const [capturedText, setCapturedText] = useState<string>('');
  const [errorDetails, setErrorDetails] = useState<VoiceError | null>(null);
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false);

  const tVoice = TRANSLATIONS[language]?.voice || TRANSLATIONS.en.voice;
  const langConfig = VOICE_LANGUAGE_MAP[language] || VOICE_LANGUAGE_MAP.en;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      voiceService.stopListening();
    };
  }, []);

  const handleStartListening = () => {
    setErrorDetails(null);
    setInterimSpeech('');
    setCapturedText('');
    setShowStatusModal(true);

    voiceService.startListening({
      language,
      onStateChange: (state) => {
        setRecState(state);
      },
      onInterimResult: (text) => {
        setInterimSpeech(text);
        onInterimText?.(text);
      },
      onFinalResult: (finalText) => {
        setCapturedText(finalText);
        setRecState('processing');
        onTranscript(finalText);

        // Keep modal briefly visible to show confirmed transcription, then close
        setTimeout(() => {
          setShowStatusModal(false);
          setRecState('ready');
        }, 1200);
      },
      onError: (err) => {
        setErrorDetails(err);
        setRecState('error');
      },
    });
  };

  const handleStopListening = () => {
    voiceService.stopListening();
    setRecState('ready');
    setShowStatusModal(false);
  };

  const handleRetry = () => {
    handleStartListening();
  };

  const isListening = recState === 'listening';
  const isProcessing = recState === 'processing';
  const isError = recState === 'error';

  return (
    <>
      {/* Primary Accessible Mic Button (Min 44x44px for Android Accessibility) */}
      <button
        type="button"
        onClick={isListening ? handleStopListening : handleStartListening}
        aria-label={isListening ? tVoice.stopBtn : `${tVoice.speakBtn} (${langConfig.nativeName})`}
        title={`${tVoice.speakBtn} in ${langConfig.langName} (${langConfig.nativeName})`}
        className={`relative min-w-[44px] min-h-[44px] rounded-2xl flex items-center justify-center transition-all duration-200 select-none shrink-0 ${
          isListening
            ? 'bg-red-600 text-white shadow-md ring-4 ring-red-500/30 animate-pulse'
            : isProcessing
            ? 'bg-amber-600 text-white animate-pulse'
            : 'bg-[#e7f3e4] hover:bg-[#d6ecd1] active:scale-95 text-[#14492a] border border-[#c6dfbf] shadow-2xs'
        } ${className}`}
      >
        {isListening ? (
          <Square className="w-5 h-5 fill-current" />
        ) : (
          <Mic className="w-5 h-5" />
        )}

        {/* Visual Pulse Wave when Listening */}
        {isListening && (
          <span className="absolute -inset-1 rounded-2xl bg-red-500/20 animate-ping pointer-events-none" />
        )}
      </button>

      {/* Floating Active Voice Recognition Feedback Overlay for Android and Desktop */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-[#dce8d5] space-y-4 animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-2">
            
            {/* Header with Language Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center text-white ${
                    isListening
                      ? 'bg-red-600 animate-pulse'
                      : isProcessing
                      ? 'bg-amber-600'
                      : isError
                      ? 'bg-red-600'
                      : 'bg-[#14492a]'
                  }`}
                >
                  {isListening ? (
                    <Mic className="w-5 h-5" />
                  ) : isProcessing ? (
                    <Sparkles className="w-5 h-5 animate-spin" />
                  ) : isError ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : (
                    <Check className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    {isListening
                      ? tVoice.listening
                      : isProcessing
                      ? tVoice.processing
                      : isError
                      ? tVoice.couldNotUnderstand
                      : 'Recognized'}
                  </h4>
                  <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full inline-block">
                    {langConfig.langName} ({langConfig.nativeName})
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleStopListening}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Interim Transcript or Recognized Text Display */}
            <div className="min-h-[80px] p-3.5 bg-[#f6f9f3] rounded-2xl border border-[#dbe8d5] flex flex-col justify-center text-center">
              {isListening && (
                <div className="space-y-2">
                  {interimSpeech ? (
                    <p className="text-sm font-semibold text-slate-800 leading-snug">
                      "{interimSpeech}"
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-center items-center gap-1.5 py-1">
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-3 h-3 rounded-full bg-red-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-4 h-4 rounded-full bg-red-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                        <span className="w-3 h-3 rounded-full bg-red-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        {tVoice.speakInstruction || `Speak clearly in ${langConfig.nativeName}`}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {isProcessing && (
                <div className="space-y-1">
                  <p className="text-sm font-bold text-emerald-900">
                    "{capturedText || interimSpeech}"
                  </p>
                  <p className="text-[11px] text-emerald-700 font-medium">
                    Adding to your question...
                  </p>
                </div>
              )}

              {isError && errorDetails && (
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center gap-1 text-red-700 text-xs font-bold">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errorDetails.message}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {errorDetails.friendlyAdvice}
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Controls */}
            <div className="flex gap-2 pt-1">
              {isListening ? (
                <button
                  type="button"
                  onClick={handleStopListening}
                  className="flex-1 min-h-[44px] rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Done Speaking / Cancel</span>
                </button>
              ) : isError ? (
                <>
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="flex-1 min-h-[44px] rounded-2xl bg-[#14492a] hover:bg-[#0f3820] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{tVoice.tapToRetry || 'Try Again'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleStopListening}
                    className="flex-1 min-h-[44px] rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                  >
                    Type Instead
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleStopListening}
                  className="w-full min-h-[44px] rounded-2xl bg-[#14492a] text-white text-xs font-bold transition"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
