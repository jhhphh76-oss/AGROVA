import React from 'react';
import { Home, Sprout, ScanLine, Store, Settings, Search, MessageSquareText } from 'lucide-react';
import { NavigationTab, SupportedLanguage, UserRole } from '../types';
import { TRANSLATIONS } from '../constants/translations';

interface BottomNavProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  language: SupportedLanguage;
  role?: UserRole;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  language,
  role = 'farmer',
}) => {
  const t = TRANSLATIONS[language]?.tabs || TRANSLATIONS.en.tabs;

  // STRICT REQUIREMENT: Exactly 5 items in bottom navigation for both roles
  const farmerNavItems = [
    {
      id: 'home' as NavigationTab,
      label: t.home,
      icon: Home,
    },
    {
      id: 'my-farm' as NavigationTab,
      label: t.myFarm,
      icon: Sprout,
    },
    {
      id: 'soil-scan' as NavigationTab,
      label: t.soilScan,
      icon: ScanLine,
    },
    {
      id: 'marketplace' as NavigationTab,
      label: t.marketplace,
      icon: Store,
    },
    {
      id: 'profile-settings' as NavigationTab,
      label: t.profileSettings,
      icon: Settings,
    },
  ];

  const buyerNavItems = [
    {
      id: 'home' as NavigationTab,
      label: t.home,
      icon: Home,
    },
    {
      id: 'browse-crops' as NavigationTab,
      label: t.browseCrops || 'Browse Crops',
      icon: Search,
    },
    {
      id: 'my-enquiries' as NavigationTab,
      label: t.myEnquiries || 'My Enquiries',
      icon: MessageSquareText,
    },
    {
      id: 'marketplace' as NavigationTab,
      label: t.marketplace,
      icon: Store,
    },
    {
      id: 'profile-settings' as NavigationTab,
      label: t.profileSettings,
      icon: Settings,
    },
  ];

  const navItems = role === 'buyer' ? buyerNavItems : farmerNavItems;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#dce8d5] shadow-lg pb-safe transition-colors select-none"
      role="navigation"
      aria-label="Bottom Navigation"
    >
      <div className="max-w-lg mx-auto grid grid-cols-5 h-16 items-center px-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`relative flex flex-col items-center justify-center h-full min-h-[48px] py-1 transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl overflow-hidden ${
                isActive
                  ? 'text-[#0e4828]'
                  : 'text-[#5c7362] hover:text-[#184628]'
              }`}
              aria-selected={isActive}
              aria-label={item.label}
            >
              {/* Active Indicator Top Accent Bar */}
              {isActive && (
                <span className="absolute top-0 w-8 h-1 bg-[#15803d] rounded-full transition-all" />
              )}

              {/* Icon Container */}
              <div
                className={`flex items-center justify-center w-8 h-6.5 sm:w-9 sm:h-7 rounded-lg transition-transform duration-200 shrink-0 ${
                  isActive
                    ? 'bg-[#e5f3e2] text-[#0d4a2b] scale-105 shadow-2xs'
                    : 'group-hover:bg-[#f1f7ef]'
                }`}
              >
                <Icon
                  className={`w-4.5 h-4.5 sm:w-5 sm:h-5 transition-transform shrink-0 ${
                    isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'
                  }`}
                />
              </div>

              {/* Compact, Highly-Readable Label */}
              <span
                className={`text-[9px] sm:text-[10px] tracking-tight leading-tight mt-0.5 w-full text-center px-0.5 truncate transition-colors ${
                  isActive
                    ? 'font-bold text-[#0d4a2b]'
                    : 'font-medium text-[#5a6e5f]'
                }`}
                title={item.label}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
