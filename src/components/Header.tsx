import React from 'react';
import { AgrovaLogo } from './AgrovaLogo';
import { SupportedLanguage, AuthUser, UserRole } from '../types';
import { LANGUAGES } from '../constants/translations';
import { Globe, ShieldCheck, User, LogIn } from 'lucide-react';

interface HeaderProps {
  currentLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  farmLocation?: string;
  onOpenLanguageModal?: () => void;
  currentUser?: AuthUser | null;
  onOpenAuth?: () => void;
  role?: UserRole;
}

export const Header: React.FC<HeaderProps> = ({
  currentLanguage,
  farmLocation = 'Vijayapura, Karnataka',
  onOpenLanguageModal,
  currentUser,
  onOpenAuth,
  role = 'farmer',
}) => {
  const currentLangObj = LANGUAGES.find((l) => l.code === currentLanguage) || LANGUAGES[0];

  return (
    <header className="sticky top-0 z-30 bg-[#f7f9f4]/95 backdrop-blur-md border-b border-[#e2ebd9] px-3.5 sm:px-4 py-2 sm:py-2.5 transition-colors">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Zone */}
        <div className="flex items-center min-w-0 shrink">
          <AgrovaLogo variant="horizontal" size="md" subtitleText="Smart Farming. Fair Earnings." />
        </div>

        {/* Secondary Zone: User indicator, Location tag & Language switch button */}
        <div className="flex items-center gap-2 shrink-0">
          {/* User Account / Sign In Trigger */}
          {currentUser ? (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-2.5 py-1.5 min-h-[40px] rounded-xl bg-white border border-[#dce8d5] text-[#14492a] hover:bg-[#eef5eb] transition text-xs font-bold shrink-0"
              title={`${currentUser.name} (${currentUser.role})`}
            >
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">
                {currentUser.name.charAt(0)}
              </div>
              <span className="max-w-[90px] sm:max-w-[120px] truncate hidden xs:inline">{currentUser.name}</span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 min-h-[40px] rounded-xl bg-[#14492a] text-white hover:bg-[#0f3820] transition text-xs font-bold shrink-0 shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          {/* Farm Location Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ebf3e6] border border-[#d2e4cb] text-xs font-medium text-[#1e5430] shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate max-w-[130px]">{farmLocation}</span>
          </div>

          {/* Quick Language Switcher Trigger */}
          <button
            onClick={onOpenLanguageModal}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 min-h-[40px] sm:min-h-[44px] rounded-xl bg-white border border-[#dce8d5] text-[#1a4a2b] hover:bg-[#eef5eb] active:scale-95 transition shadow-2xs text-xs font-semibold shrink-0"
            aria-label="Change Language"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
            <span className="font-bold">{currentLangObj.localLabel}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
