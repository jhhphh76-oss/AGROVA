import React from 'react';
import { Sprout, Store, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { UserRole } from '../types';
import { AgrovaLogo } from './AgrovaLogo';

interface RoleOnboardingModalProps {
  isOpen: boolean;
  onSelectRole: (role: UserRole) => void;
}

export const RoleOnboardingModal: React.FC<RoleOnboardingModalProps> = ({
  isOpen,
  onSelectRole,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#dce8d5] overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-b from-[#f2f8ed] to-white border-b border-[#e1ebd9] text-center">
          <div className="flex justify-center mb-3">
            <AgrovaLogo size="lg" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#144225] font-display tracking-tight">
            Welcome to AGROVA
          </h2>
          <p className="text-xs sm:text-sm text-[#4b6350] mt-1.5 max-w-sm mx-auto">
            Please choose how you will be using AGROVA. This configures your personalized navigation, dashboard, and tools.
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {/* Option 1: Farmer */}
          <div 
            onClick={() => onSelectRole('farmer')}
            className="group relative bg-[#fbfdf9] hover:bg-[#f3f9ee] border-2 border-[#d5e7cb] hover:border-[#228445] rounded-2xl p-4 sm:p-5 cursor-pointer transition-all duration-200 shadow-2xs hover:shadow-md"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-green-800 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <Sprout className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-base font-bold text-[#144225]">
                    I am a Farmer / Grower
                  </h3>
                  <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    Grower
                  </span>
                </div>
                <p className="text-xs text-[#4d6653] leading-relaxed mb-3">
                  I cultivate farmland and want agricultural tools, crop logs, and direct access to wholesale produce buyers.
                </p>

                <div className="grid grid-cols-2 gap-1.5 text-[11px] text-[#2c5236] font-medium mb-3">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Live Vijayapura weather
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> AI visual soil scan
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Farm journal & crops
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> List harvest produce
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectRole('farmer');
                  }}
                  className="w-full py-2.5 px-4 bg-[#14492a] hover:bg-[#0f3820] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-xs group-hover:bg-[#185934]"
                >
                  <span>Continue as Farmer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Option 2: Buyer */}
          <div 
            onClick={() => onSelectRole('buyer')}
            className="group relative bg-[#fbfdf9] hover:bg-[#f3f9ee] border-2 border-[#d5e7cb] hover:border-[#228445] rounded-2xl p-4 sm:p-5 cursor-pointer transition-all duration-200 shadow-2xs hover:shadow-md"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1b5e39] to-[#0f3a22] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <Store className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-base font-bold text-[#144225]">
                    I am a Buyer / Trader
                  </h3>
                  <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    Procurement
                  </span>
                </div>
                <p className="text-xs text-[#4d6653] leading-relaxed mb-3">
                  I procure wholesale agricultural commodities, grains, pulses, and vegetables directly from farmers & FPOs.
                </p>

                <div className="grid grid-cols-2 gap-1.5 text-[11px] text-[#2c5236] font-medium mb-3">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Browse farmer harvests
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Mandi location filters
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Send purchase enquiries
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Direct grower contact
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectRole('buyer');
                  }}
                  className="w-full py-2.5 px-4 bg-[#14492a] hover:bg-[#0f3820] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-xs group-hover:bg-[#185934]"
                >
                  <span>Continue as Buyer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Notice */}
        <div className="p-3.5 bg-[#f4f7f1] border-t border-[#e2ebd9] text-[11px] text-[#556d59] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            No login password required. Your role choice configures your workspace and permissions. You can switch roles anytime from Profile & Settings.
          </span>
        </div>
      </div>
    </div>
  );
};
