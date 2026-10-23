import React from 'react';
import { AgrovaLogo } from './AgrovaLogo';
import { SupportedLanguage, AuthUser, UserRole, TextSize, VoiceStatus } from '../types';
import { LANGUAGES } from '../constants/translations';
import { Globe, ShieldCheck, Mic, Check, AlertCircle, Sparkles, Type } from 'lucide-react';

interface HeaderProps {
  currentLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  farmLocation?: string;
  onOpenLanguageModal?: () => void;
  currentUser?: AuthUser | null;
  onOpenAuth?: () => void;
  role?: UserRole;
  onOpenVoiceAssistant?: () => void;
  voiceStatus?: VoiceStatus;
  textSize?: TextSize;
  onTextSizeChange?: (size: TextSize) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLanguage,
  farmLocation = 'Vijayapura, Karnataka',
  onOpenLanguageModal,
  currentUser,
  onOpenAuth,
  role = 'farmer',
  onOpenVoiceAssistant,
  voiceStatus = 'idle',
  textSize = 'standard',
  onTextSizeChange,
}) => {
  const currentLangObj = LANGUAGES.find((l) => l.code === currentLanguage) || LANGUAGES[0];

  const handleCycleTextSize = () => {
    if (!onTextSizeChange) return;
    if (textSize === 'standard') {
      onTextSizeChange('large');
    } else if (textSize === 'large') {
      onTextSizeChange('xlarge');
    } else {
      onTextSizeChange('standard');
    }
  };

  const textSizeLabels: Record<TextSize, { short: string; label: string }> = {
    standard: { short: 'Std', label: 'Standard (100%)' },
    large: { short: 'Lg', label: 'Large (115%)' },
    xlarge: { short: 'XL', label: 'Extra Large (130%)' },
  };

  const getVoiceButtonConfig = () => {
    switch (voiceStatus) {
      case 'listening':
        return {
          bgClass: 'bg-red-600 hover:bg-red-700 text-white ring-4 ring-red-400/40 animate-pulse',
          icon: <Mic className="w-5 h-5 text-white animate-pulse" />,
          ariaLabel: 'AgriConnect Voice Assistant: Listening now. Speak clearly into your microphone.',
          title: 'Listening now — Speak in your chosen language',
          statusText: 'Listening',
        };
      case 'processing':
        return {
          bgClass: 'bg-amber-600 hover:bg-amber-700 text-white ring-2 ring-amber-300',
          icon: <Sparkles className="w-5 h-5 text-white animate-spin" />,
          ariaLabel: 'AgriConnect Voice Assistant: Processing speech query.',
          title: 'Processing speech...',
          statusText: 'Processing',
        };
      case 'success':
        return {
          bgClass: 'bg-emerald-800 text-white ring-2 ring-emerald-300',
          icon: <Check className="w-5 h-5 text-white" />,
          ariaLabel: 'AgriConnect Voice Assistant: Speech recognized successfully.',
          title: 'Speech captured successfully',
          statusText: 'Recognized',
        };
      case 'error':
        return {
          bgClass: 'bg-red-800 hover:bg-red-900 text-white ring-2 ring-red-400',
          icon: <AlertCircle className="w-5 h-5 text-white" />,
          ariaLabel: 'AgriConnect Voice Assistant: Voice error occurred. Tap to retry or use text input.',
          title: 'Voice error — Tap to retry',
          statusText: 'Error',
        };
      case 'idle':
      default:
        return {
          bgClass: 'bg-emerald-700 hover:bg-emerald-800 text-white border border-emerald-600/40 shadow-xs',
          icon: <Mic className="w-5 h-5 text-white stroke-[2.2]" />,
          ariaLabel: `AgriConnect Voice Assistant — Tap to speak instead of typing (Language: ${currentLangObj.localLabel})`,
          title: `AgriConnect Voice Assistant — Tap to speak in ${currentLangObj.label} (${currentLangObj.localLabel})`,
          statusText: 'Ready',
        };
    }
  };

  const voiceConfig = getVoiceButtonConfig();

  return (
    <header 
      className="sticky top-0 z-30 bg-[#f7f9f4]/95 backdrop-blur-md border-b border-[#e2ebd9] px-2.5 sm:px-4 py-2 sm:py-2.5 transition-colors"
      role="banner"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-1.5 sm:gap-3 min-w-0">
        {/* Brand Zone & Dedicated Microphone Button beside Agriconnect name */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 shrink-0">
          <AgrovaLogo
            variant="horizontal"
            size="md"
            subtitleText="Smart Farming. Fair Earnings."
          />

          {/* Dedicated Accessibility Microphone Button */}
          <button
            type="button"
            onClick={onOpenVoiceAssistant}
            className={`relative flex items-center justify-center min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl active:scale-95 transition-all focus:outline-none focus-visible:ring-3 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 shrink-0 cursor-pointer ${voiceConfig.bgClass}`}
            aria-label="Voice assistant"
            aria-live="polite"
            title={voiceConfig.title}
          >
            {voiceConfig.icon}
            {/* Visual Listening Pulse Ring for Low-Vision users */}
            {voiceStatus === 'listening' && (
              <span className="absolute -inset-1 rounded-xl bg-red-500/30 animate-ping pointer-events-none" aria-hidden="true" />
            )}
            <span className="sr-only">Status: {voiceConfig.statusText}</span>
          </button>
        </div>

        {/* Secondary Zone: Text Size Cycler, Farm Location tag & Compact Globe Language button */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Quick Text Size Toggle: Standard -> Large -> Extra Large */}
          {onTextSizeChange && (
            <button
              type="button"
              onClick={handleCycleTextSize}
              className="flex items-center justify-center gap-1 min-w-[44px] min-h-[44px] px-2 sm:px-2.5 py-1.5 rounded-xl bg-white border border-[#dce8d5] text-[#14492a] hover:bg-[#eef5eb] active:scale-95 transition shadow-2xs text-xs font-bold shrink-0 cursor-pointer focus-visible:ring-3 focus-visible:ring-emerald-600"
              aria-label={`Adjust text size: currently ${textSizeLabels[textSize].label}`}
              title={`Text Size: ${textSizeLabels[textSize].label} (Tap to change)`}
            >
              <Type className="w-4 h-4 text-emerald-800" aria-hidden="true" />
              <span className="font-bold text-[11px] tabular-nums">{textSizeLabels[textSize].short}</span>
            </button>
          )}

          {/* Farm Location Badge (visible on medium screens and up) */}
          <div 
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#ebf3e6] border border-[#d2e4cb] text-xs font-medium text-[#1e5430] shrink-0"
            aria-label={`Location: ${farmLocation}`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
            <span className="truncate max-w-[130px]">{farmLocation}</span>
          </div>

          {/* Compact Globe Icon Button (Replaces large selector displaying "English") */}
          <button
            type="button"
            onClick={onOpenLanguageModal}
            className="flex items-center justify-center min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl bg-white border border-[#dce8d5] text-[#1a4a2b] hover:bg-[#eef5eb] active:scale-95 transition shadow-2xs shrink-0 cursor-pointer focus-visible:ring-3 focus-visible:ring-emerald-600"
            aria-label="Choose language"
            title={`Choose language (Currently: ${currentLangObj.label} - ${currentLangObj.localLabel})`}
          >
            <Globe className="w-5 h-5 text-emerald-700 shrink-0" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
};


