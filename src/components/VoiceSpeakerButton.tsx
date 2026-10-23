import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Square, RotateCcw, AlertCircle, Info, X } from 'lucide-react';
import { SupportedLanguage } from '../types';
import { voiceService, VOICE_LANGUAGE_MAP } from '../services/voiceService';
import { TRANSLATIONS } from '../constants/translations';

interface VoiceSpeakerButtonProps {
  text: string;
  language: SupportedLanguage;
  utteranceId: string;
  variant?: 'icon' | 'badge' | 'button';
  customLabel?: string;
  className?: string;
}

export const VoiceSpeakerButton: React.FC<VoiceSpeakerButtonProps> = ({
  text,
  language,
  utteranceId,
  variant = 'badge',
  customLabel,
  className = '',
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hasPlayedOnce, setHasPlayedOnce] = useState<boolean>(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const tVoice = TRANSLATIONS[language]?.voice || TRANSLATIONS.en.voice;
  const langConfig = VOICE_LANGUAGE_MAP[language] || VOICE_LANGUAGE_MAP.en;

  // Poll or check if this utteranceId is currently playing
  useEffect(() => {
    const interval = setInterval(() => {
      const activeId = voiceService.getActiveUtteranceId();
      const speaking = voiceService.isSpeaking();
      if (activeId === utteranceId && speaking) {
        setIsPlaying(true);
      } else if (isPlaying && (activeId !== utteranceId || !speaking)) {
        setIsPlaying(false);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [utteranceId, isPlaying]);

  const handleSpeak = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // If currently speaking this utterance, stop it immediately
    if (isPlaying) {
      voiceService.stop();
      setIsPlaying(false);
      return;
    }

    setNoticeMessage(null);

    const result = await voiceService.speak({
      text,
      language,
      utteranceId,
      onStart: () => {
        setIsPlaying(true);
        setHasPlayedOnce(true);
      },
      onEnd: () => {
        setIsPlaying(false);
      },
      onError: () => {
        setIsPlaying(false);
      },
    });

    if (!result.success && result.notice) {
      setNoticeMessage(result.notice);
    }
  };

  const handleStop = (e: React.MouseEvent) => {
    e.stopPropagation();
    voiceService.stop();
    setIsPlaying(false);
  };

  // 1. Icon-only variant
  if (variant === 'icon') {
    return (
      <>
        <button
          type="button"
          onClick={handleSpeak}
          aria-label={isPlaying ? tVoice.stopBtn : tVoice.listenBtn}
          title={
            isPlaying
              ? tVoice.stopBtn
              : `${tVoice.listenBtn} in ${langConfig.langName} (${langConfig.nativeName})`
          }
          className={`min-w-[40px] min-h-[40px] p-2 rounded-xl flex items-center justify-center transition select-none shrink-0 ${
            isPlaying
              ? 'bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-300 animate-pulse'
              : 'bg-white/80 hover:bg-emerald-50 text-emerald-800 border border-[#dce8d5] shadow-2xs'
          } ${className}`}
        >
          {isPlaying ? (
            <Square className="w-4 h-4 fill-current text-rose-700" />
          ) : hasPlayedOnce ? (
            <RotateCcw className="w-4 h-4 text-emerald-700" />
          ) : (
            <Volume2 className="w-4 h-4 text-emerald-700" />
          )}
        </button>

        {noticeMessage && (
          <VoiceNoticeModal
            notice={noticeMessage}
            langConfig={langConfig}
            onClose={() => setNoticeMessage(null)}
          />
        )}
      </>
    );
  }

  // 2. Full Button variant (e.g. for Scan summaries and Fertilizer guidance)
  if (variant === 'button') {
    return (
      <>
        <div className={`flex items-center gap-2 ${className}`}>
          <button
            type="button"
            onClick={handleSpeak}
            className={`min-h-[44px] px-4 py-2 rounded-2xl font-bold text-xs transition flex items-center gap-2 shadow-2xs select-none ${
              isPlaying
                ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                : 'bg-[#14492a] hover:bg-[#0e3a20] active:scale-95 text-white'
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                <span>{tVoice.stopBtn}</span>
              </>
            ) : hasPlayedOnce ? (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>{tVoice.replayBtn}</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4" />
                <span>{customLabel || `${tVoice.listenBtn} (${langConfig.nativeName})`}</span>
              </>
            )}
          </button>

          {isPlaying && (
            <button
              type="button"
              onClick={handleStop}
              className="min-h-[44px] px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1"
            >
              <VolumeX className="w-4 h-4" />
              <span>{tVoice.stopBtn}</span>
            </button>
          )}
        </div>

        {noticeMessage && (
          <VoiceNoticeModal
            notice={noticeMessage}
            langConfig={langConfig}
            onClose={() => setNoticeMessage(null)}
          />
        )}
      </>
    );
  }

  // 3. Compact Badge variant (Default for chat bubbles and cards)
  return (
    <>
      <button
        type="button"
        onClick={handleSpeak}
        aria-label={isPlaying ? tVoice.stopBtn : tVoice.listenBtn}
        title={
          isPlaying
            ? tVoice.stopBtn
            : `${tVoice.listenBtn} in ${langConfig.langName} (${langConfig.nativeName})`
        }
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[36px] sm:min-h-[40px] rounded-xl text-[11px] font-semibold transition select-none ${
          isPlaying
            ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
            : 'bg-emerald-50 hover:bg-emerald-100/80 text-emerald-900 border border-emerald-200 shadow-2xs'
        } ${className}`}
      >
        {isPlaying ? (
          <>
            <Square className="w-3.5 h-3.5 fill-current text-rose-700" />
            <span className="font-bold text-rose-800">{tVoice.stopBtn}</span>
            <span className="flex space-x-0.5 ml-1">
              <span className="w-1 h-2.5 bg-rose-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-3.5 bg-rose-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-2 bg-rose-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          </>
        ) : hasPlayedOnce ? (
          <>
            <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
            <span>{tVoice.replayBtn}</span>
          </>
        ) : (
          <>
            <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>{customLabel || tVoice.listenBtn}</span>
            <span className="text-[10px] text-emerald-700/80 font-normal">
              ({langConfig.nativeName})
            </span>
          </>
        )}
      </button>

      {noticeMessage && (
        <VoiceNoticeModal
          notice={noticeMessage}
          langConfig={langConfig}
          onClose={() => setNoticeMessage(null)}
        />
      )}
    </>
  );
};

interface VoiceNoticeModalProps {
  notice: string;
  langConfig: { langName: string; nativeName: string };
  onClose: () => void;
}

const VoiceNoticeModal: React.FC<VoiceNoticeModalProps> = ({
  notice,
  langConfig,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">
                Speech Voice Limitation
              </h4>
              <span className="text-[10px] text-slate-500 font-medium">
                {langConfig.langName} ({langConfig.nativeName})
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-2">
          <p className="leading-relaxed">{notice}</p>
        </div>

        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-700 space-y-1.5">
          <span className="font-bold block text-slate-900 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-emerald-700" />
            How to enable on Android:
          </span>
          <ol className="list-decimal pl-4 space-y-0.5 text-slate-600">
            <li>Open phone <strong>Settings</strong> &gt; <strong>Accessibility</strong></li>
            <li>Tap <strong>Text-to-speech output</strong></li>
            <li>Tap gear icon beside Preferred engine (Google Speech)</li>
            <li>Select <strong>Install voice data</strong> &gt; <strong>{langConfig.langName}</strong></li>
          </ol>
        </div>

        <button
          onClick={onClose}
          className="w-full min-h-[44px] rounded-2xl bg-[#14492a] hover:bg-[#0f3820] text-white text-xs font-bold transition shadow-xs"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
