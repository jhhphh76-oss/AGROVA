import React from 'react';
import { 
  ScanLine, 
  Stethoscope, 
  Sparkles, 
  Store, 
  Sprout, 
  ArrowRight, 
  Clock, 
  MapPin, 
  Layers
} from 'lucide-react';
import { FarmerProfile, CropRecord, NavigationTab, SupportedLanguage } from '../types';
import { TRANSLATIONS } from '../constants/translations';
import { WeatherWidget } from '../components/WeatherWidget';

interface HomeScreenProps {
  profile: FarmerProfile;
  crops: CropRecord[];
  onNavigateTab: (tab: NavigationTab) => void;
  onOpenCropDoctor: () => void;
  onOpenFertilizer: () => void;
  language: SupportedLanguage;
  enquiriesCount?: number;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  profile,
  crops,
  onNavigateTab,
  onOpenCropDoctor,
  onOpenFertilizer,
  language,
  enquiriesCount = 0,
}) => {
  const t = TRANSLATIONS[language]?.home || TRANSLATIONS.en.home;

  const healthyCount = crops.filter((c) => c.healthStatus === 'healthy').length;

  return (
    <div className="space-y-4 sm:space-y-5 pb-8 animate-in fade-in duration-150">
      {/* Hero Welcome Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#124429] via-[#103e26] to-[#0a2818] text-white p-4.5 sm:p-6 shadow-md border border-[#1b5735]">
        {/* Subtle decorative glow */}
        <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-1.5 text-emerald-200 text-xs font-medium max-w-full">
            <MapPin className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span className="truncate">
              {profile.farmName || 'My Farm'} • {profile.villageOrDistrict || 'Vijayapura'}, {profile.state || 'Karnataka'}
            </span>
          </div>

          <div>
            <span className="text-xs font-semibold text-emerald-200 block mb-0.5">
              {t.welcomeGreeting} {profile.name} ji
            </span>
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight font-display text-white leading-tight">
              {t.taglineHeading}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 font-medium">
              Scan. Understand. Grow. Earn.
            </p>
          </div>

          {/* Quick Farm Overview Strip */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/15">
            <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-2 sm:p-2.5 text-center border border-white/10 min-w-0">
              <span className="text-[10px] text-emerald-200 uppercase tracking-wider block font-medium truncate">
                {t.activeCrops}
              </span>
              <span className="text-base sm:text-lg font-bold font-display tabular-nums block mt-0.5">
                {crops.length}
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-2 sm:p-2.5 text-center border border-white/10 min-w-0">
              <span className="text-[10px] text-emerald-200 uppercase tracking-wider block font-medium truncate">
                {t.totalLand}
              </span>
              <span className="text-base sm:text-lg font-bold font-display tabular-nums block mt-0.5 truncate">
                {profile.totalFarmArea} <span className="text-[10px] sm:text-xs font-normal">{profile.preferredAreaUnit}</span>
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-2 sm:p-2.5 text-center border border-white/10 min-w-0">
              <span className="text-[10px] text-emerald-200 uppercase tracking-wider block font-medium truncate">
                Crop Health
              </span>
              <span className="text-base sm:text-lg font-bold font-display tabular-nums text-emerald-300 block mt-0.5">
                {crops.length > 0 ? `${Math.round((healthyCount / crops.length) * 100)}%` : '100%'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Weather & Farming Conditions Summary */}
      <section aria-label="Weather Summary">
        <WeatherWidget
          locationName={`${profile.villageOrDistrict || 'Vijayapura'}, ${profile.state || 'Karnataka'}`}
          language={language}
        />
      </section>

      {/* Prominent Quick-Action Cards Grid */}
      <section className="space-y-2.5 sm:space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-bold text-[#144225] uppercase tracking-wider font-display">
            {t.quickActions}
          </h2>
          <span className="text-xs text-slate-500">Tap to open</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
          {/* Action 1: Soil Scan */}
          <button
            onClick={() => onNavigateTab('soil-scan')}
            className="flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl bg-white border border-[#dce8d5] shadow-2xs hover:border-[#a8d3a1] hover:bg-[#fafdf9] transition text-left group min-h-[84px]"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#e5f3e2] text-[#124429] flex items-center justify-center shrink-0 border border-[#cfe2ca] group-hover:scale-105 transition-transform">
              <ScanLine className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-700 shrink-0" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <h3 className="text-xs sm:text-sm font-bold text-[#133e24] group-hover:text-emerald-700 transition-colors font-display truncate">
                  {t.soilScanAction}
                </h3>
                <ArrowRight className="w-4 h-4 text-emerald-600 transition-transform group-hover:translate-x-1 shrink-0" />
              </div>
              <p className="text-xs text-[#526a57] mt-1 line-clamp-2 leading-relaxed">
                {t.soilScanDesc}
              </p>
            </div>
          </button>

          {/* Action 2: Crop Doctor */}
          <button
            onClick={onOpenCropDoctor}
            className="flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl bg-white border border-[#dce8d5] shadow-2xs hover:border-[#a8d3a1] hover:bg-[#fafdf9] transition text-left group min-h-[84px]"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#eef7ec] text-[#124429] flex items-center justify-center shrink-0 border border-[#cfe2ca] group-hover:scale-105 transition-transform">
              <Stethoscope className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-700 shrink-0" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <h3 className="text-xs sm:text-sm font-bold text-[#133e24] group-hover:text-emerald-700 transition-colors font-display truncate">
                  {t.cropDoctorAction}
                </h3>
                <ArrowRight className="w-4 h-4 text-emerald-600 transition-transform group-hover:translate-x-1 shrink-0" />
              </div>
              <p className="text-xs text-[#526a57] mt-1 line-clamp-2 leading-relaxed">
                {t.cropDoctorDesc}
              </p>
            </div>
          </button>

          {/* Action 3: Fertilizer Guidance */}
          <button
            onClick={onOpenFertilizer}
            className="flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl bg-white border border-[#dce8d5] shadow-2xs hover:border-[#a8d3a1] hover:bg-[#fafdf9] transition text-left group min-h-[84px]"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#f5f9f2] text-[#124429] flex items-center justify-center shrink-0 border border-[#cfe2ca] group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-700 shrink-0" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <h3 className="text-xs sm:text-sm font-bold text-[#133e24] group-hover:text-emerald-700 transition-colors font-display truncate">
                  {t.fertilizerAction}
                </h3>
                <ArrowRight className="w-4 h-4 text-emerald-600 transition-transform group-hover:translate-x-1 shrink-0" />
              </div>
              <p className="text-xs text-[#526a57] mt-1 line-clamp-2 leading-relaxed">
                {t.fertilizerDesc}
              </p>
            </div>
          </button>

          {/* Action 4: Marketplace */}
          <button
            onClick={() => onNavigateTab('marketplace')}
            className="flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl bg-white border border-[#dce8d5] shadow-2xs hover:border-[#a8d3a1] hover:bg-[#fafdf9] transition text-left group min-h-[84px] relative"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#eaf4eb] text-[#124429] flex items-center justify-center shrink-0 border border-[#cfe2ca] group-hover:scale-105 transition-transform">
              <Store className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-700 shrink-0" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 truncate">
                  <h3 className="text-xs sm:text-sm font-bold text-[#133e24] group-hover:text-emerald-700 transition-colors font-display truncate">
                    {t.marketplaceAction}
                  </h3>
                  {enquiriesCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                      {enquiriesCount} Enquiries
                    </span>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-600 transition-transform group-hover:translate-x-1 shrink-0" />
              </div>
              <p className="text-xs text-[#526a57] mt-1 line-clamp-2 leading-relaxed">
                {t.marketplaceDesc}
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* Recent Farm Activity */}
      <section className="space-y-2.5 sm:space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
            <h2 className="text-xs sm:text-sm font-bold text-[#144225] font-display">
              {t.recentActivity}
            </h2>
          </div>
          <button
            onClick={() => onNavigateTab('my-farm')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 shrink-0"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-[#dce8d5] divide-y divide-[#edf3ea] overflow-hidden shadow-2xs">
          {crops.slice(0, 3).map((crop) => (
            <div key={crop.id} className="p-3 sm:p-3.5 flex items-center justify-between gap-2.5 hover:bg-[#fafcf9] transition">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#ecf5e8] flex items-center justify-center text-emerald-800 shrink-0 border border-[#d6e7d1]">
                  <Sprout className="w-4 h-4 shrink-0" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-800 truncate">
                    {crop.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate">
                    {crop.currentStage} • {crop.area} {crop.areaUnit} ({crop.fieldName})
                  </p>
                </div>
              </div>

              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                crop.healthStatus === 'healthy'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {crop.healthStatus === 'healthy' ? 'Normal' : 'Inspection'}
              </span>
            </div>
          ))}

          {/* Demonstration Notice Strip */}
          <div className="p-3 bg-[#f8faf6] flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-500">
            <span className="flex items-center gap-1.5 truncate">
              <Layers className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">Offline On-Device Storage • ₹0 Budget Verified</span>
            </span>
            <span className="text-[11px] text-emerald-700 font-semibold shrink-0">Ready</span>
          </div>
        </div>
      </section>
    </div>
  );
};
