import React, { useState } from 'react';
import { Sprout } from 'lucide-react';

interface LogoProps {
  variant?: 'full' | 'horizontal' | 'icon' | 'badge';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSubtitle?: boolean;
  subtitleText?: string;
  besideTitle?: React.ReactNode;
}

export const AgriConnectLogo: React.FC<LogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  className = '',
  showSubtitle = true,
  subtitleText = 'Smart Farming. Fair Earnings.',
  besideTitle,
}) => {
  // Track if user-provided authentic image logo exists and loads successfully
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [imageFailed, setImageFailed] = useState<boolean>(false);

  // User-provided authentic logo image path candidates (NO AI-generated replacements)
  const logoSrc = '/IMG-20261012-WA0003.jpg';

  // Dimension scaling
  const sizeConfig = {
    sm: {
      imgHeight: 'h-7',
      textSize: 'text-base',
      subSize: 'text-[9px]',
      iconSize: 'w-4 h-4',
    },
    md: {
      imgHeight: 'h-9',
      textSize: 'text-lg sm:text-xl',
      subSize: 'text-[10px]',
      iconSize: 'w-5 h-5',
    },
    lg: {
      imgHeight: 'h-12',
      textSize: 'text-2xl',
      subSize: 'text-xs',
      iconSize: 'w-7 h-7',
    },
    xl: {
      imgHeight: 'h-20',
      textSize: 'text-3xl sm:text-4xl',
      subSize: 'text-sm',
      iconSize: 'w-10 h-10',
    },
  }[size];

  // If user's provided authentic image asset is present and loaded:
  if (imageLoaded && !imageFailed) {
    if (variant === 'icon') {
      return (
        <div className={`inline-flex items-center ${className}`}>
          <img
            src={logoSrc}
            alt="AgriConnect"
            className={`${sizeConfig.imgHeight} w-auto object-contain`}
          />
        </div>
      );
    }

    if (variant === 'full') {
      return (
        <div className={`flex flex-col items-center text-center gap-1.5 ${className}`}>
          <img
            src={logoSrc}
            alt="AgriConnect"
            className={`${sizeConfig.imgHeight} w-auto object-contain max-w-full`}
          />
          {showSubtitle && (
            <p className={`${sizeConfig.subSize} font-semibold text-[#15803d] tracking-wider uppercase`}>
              — {subtitleText} —
            </p>
          )}
        </div>
      );
    }

    // Horizontal lockup
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <img
          src={logoSrc}
          alt="AgriConnect"
          className={`${sizeConfig.imgHeight} w-auto object-contain shrink-0`}
        />
        {besideTitle}
        {showSubtitle && (
          <span className={`hidden sm:inline-block ${sizeConfig.subSize} font-semibold text-[#15803d] tracking-wider uppercase`}>
            {subtitleText}
          </span>
        )}
      </div>
    );
  }

  // Hidden image probe to detect when user's provided logo asset is placed in the project
  const ImageProbe = !imageFailed && (
    <img
      src={logoSrc}
      alt="AgriConnect Logo Probe"
      className="hidden"
      onLoad={() => setImageLoaded(true)}
      onError={() => setImageFailed(true)}
    />
  );

  // Clean, high-legibility typographic brandmark when image asset is unavailable
  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center shrink-0 ${className}`}>
        {ImageProbe}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#14492a] to-[#0a2e1a] flex items-center justify-center text-white shadow-2xs border border-[#1b5b35]">
          <Sprout className="w-5 h-5 text-emerald-400" />
        </div>
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-[#eaf4eb] border border-[#c3e2c6] rounded-xl ${className}`}>
        {ImageProbe}
        <Sprout className="w-4 h-4 text-emerald-700" />
        <span className="font-extrabold text-[#0d4a2b] text-sm tracking-wide font-display">
          AgriConnect
        </span>
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`flex flex-col items-center text-center gap-1.5 ${className}`}>
        {ImageProbe}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#14492a] to-[#0a2e1a] flex items-center justify-center text-white shadow-2xs border border-[#1b5b35]">
            <Sprout className="w-6 h-6 text-emerald-400" />
          </div>
          <span className={`font-black ${sizeConfig.textSize} tracking-tight text-[#0d4a2b] font-display`}>
            Agri<span className="text-emerald-600">Connect</span>
          </span>
        </div>
        {showSubtitle && (
          <p className={`${sizeConfig.subSize} font-semibold text-[#15803d] tracking-wider uppercase mt-0.5`}>
            — {subtitleText} —
          </p>
        )}
      </div>
    );
  }

  // Default: Horizontal brand lockup (Clean, responsive, mobile-safe, never truncated)
  return (
    <div className={`inline-flex items-center gap-1.5 sm:gap-2.5 shrink-0 ${className}`}>
      {ImageProbe}
      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[#14492a] to-[#0a2e1a] flex items-center justify-center text-white shadow-2xs border border-[#1b5b35] shrink-0">
        <Sprout className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
      </div>

      <div className="flex flex-col justify-center shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <span className={`font-black ${sizeConfig.textSize} tracking-tight text-[#0d4a2b] leading-tight font-display whitespace-nowrap shrink-0`}>
            Agri<span className="text-emerald-600">Connect</span>
          </span>
          {besideTitle}
        </div>
        {showSubtitle && (
          <span className={`hidden sm:block ${sizeConfig.subSize} font-semibold text-[#15803d] tracking-wider uppercase leading-none truncate`}>
            {subtitleText}
          </span>
        )}
      </div>
    </div>
  );
};

// Backwards-compatible export alias for components importing AgrovaLogo
export const AgrovaLogo = AgriConnectLogo;
export default AgriConnectLogo;
