import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, CheckCircle2, ShieldAlert, BookmarkPlus, HelpCircle } from 'lucide-react';
import { GrowthStage, SupportedLanguage } from '../types';
import { TRANSLATIONS } from '../constants/translations';
import { storageService } from '../services/storage';

interface FertilizerGuidanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: SupportedLanguage;
  preselectedCrop?: string;
  onSavedToObservations?: () => void;
}

const COMMON_CROPS = [
  'Wheat',
  'Paddy / Rice',
  'Mustard / Sarson',
  'Red Onion',
  'Cotton',
  'Tomato',
  'Soybean',
  'Chilli',
  'Maize',
  'Chickpea (Chana)',
];

const GROWTH_STAGES: GrowthStage[] = [
  'Sowing / Germination',
  'Tillering / Vegetative',
  'Flowering / Booting',
  'Grain / Fruit Formation',
  'Ripening / Maturity',
];

export const FertilizerGuidanceModal: React.FC<FertilizerGuidanceModalProps> = ({
  isOpen,
  onClose,
  language,
  preselectedCrop,
  onSavedToObservations,
}) => {
  const t = TRANSLATIONS[language]?.fertilizer || TRANSLATIONS.en.fertilizer;

  const [crop, setCrop] = useState<string>(preselectedCrop || 'Wheat');
  const [stage, setStage] = useState<GrowthStage>('Tillering / Vegetative');
  const [hasSoilTest, setHasSoilTest] = useState<boolean>(true);
  const [nitrogenLevel, setNitrogenLevel] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [phosphorusLevel, setPhosphorusLevel] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [potassiumLevel, setPotassiumLevel] = useState<'Low' | 'Medium' | 'High'>('High');
  const [organicManureApplied, setOrganicManureApplied] = useState<boolean>(true);
  const [previousCropLegume, setPreviousCropLegume] = useState<boolean>(false);
  const [farmingNotes, setFarmingNotes] = useState<string>('');
  const [isCalculated, setIsCalculated] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCalculated(true);
    setSaveSuccessMsg(null);
  };

  const handleSaveToFarmNotes = () => {
    storageService.saveObservation({
      id: `obs-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      cropName: crop,
      fieldName: 'Main Field',
      category: 'Fertilizer',
      notes: `Fertilizer Guidance Review: Stage ${stage}. Organic manure applied: ${
        organicManureApplied ? 'Yes' : 'No'
      }. Soil N-P-K status: ${hasSoilTest ? `${nitrogenLevel} N, ${phosphorusLevel} P, ${potassiumLevel} K` : 'Unverified'}. ${farmingNotes}`.trim(),
    });
    setSaveSuccessMsg('Guidance record saved to My Farm observations!');
    if (onSavedToObservations) onSavedToObservations();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#d6e4cf] overflow-hidden my-auto">
        {/* Header */}
        <div className="px-5 py-4 bg-[#f3f8f1] border-b border-[#e2edd0] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#e3f2df] flex items-center justify-center text-[#124429] border border-[#cbe3c6]">
              <Sparkles className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#103d24] font-display">
                {t.title}
              </h2>
              <p className="text-xs text-[#4f6b55]">{t.subtitle}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white border border-[#d6e4cf] flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition min-w-[36px] min-h-[36px]"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Scientific Disclaimer Banner */}
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#fefce8] border border-[#fef08a] text-xs text-[#713f12]">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-relaxed">
              <span className="font-bold text-amber-900 block">Scientific Transparency Notice</span>
              <span>{t.notice}</span>
            </div>
          </div>

          {!isCalculated ? (
            /* Input Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Target Crop */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  {t.selectCrop}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                  {COMMON_CROPS.slice(0, 8).map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setCrop(c)}
                      className={`px-2 py-2 text-[11px] sm:text-xs font-medium rounded-xl border text-center transition min-h-[40px] truncate ${
                        crop === c
                          ? 'bg-[#14492a] text-white border-[#14492a]'
                          : 'bg-[#f7faf5] border-[#dbe7d5] text-[#2c4734] hover:bg-white'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Growth Stage */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  {t.selectStage}
                </label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as GrowthStage)}
                  className="w-full text-xs bg-white border border-[#d2e2cb] rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {GROWTH_STAGES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Soil Test Toggle */}
              <div className="p-3.5 rounded-2xl bg-[#f9faf7] border border-[#e2edd0] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 block">Soil Test Report Available?</span>
                    <span className="text-[11px] text-slate-500">Government Soil Health Card or Lab test</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setHasSoilTest(true)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                        hasSoilTest
                          ? 'bg-[#14492a] text-white'
                          : 'bg-white border border-slate-200 text-slate-600'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setHasSoilTest(false)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                        !hasSoilTest
                          ? 'bg-[#14492a] text-white'
                          : 'bg-white border border-slate-200 text-slate-600'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                {hasSoilTest && (
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60">
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-1 font-bold">Nitrogen (N)</span>
                      <select
                        value={nitrogenLevel}
                        onChange={(e) => setNitrogenLevel(e.target.value as any)}
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg p-1.5 text-slate-800"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block mb-1 font-bold">Phosphorus (P)</span>
                      <select
                        value={phosphorusLevel}
                        onChange={(e) => setPhosphorusLevel(e.target.value as any)}
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg p-1.5 text-slate-800"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block mb-1 font-bold">Potassium (K)</span>
                      <select
                        value={potassiumLevel}
                        onChange={(e) => setPotassiumLevel(e.target.value as any)}
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg p-1.5 text-slate-800"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Organic Context Checkboxes */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={organicManureApplied}
                    onChange={(e) => setOrganicManureApplied(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded-sm"
                  />
                  <span>Applied Farmyard Manure (FYM) or Compost before sowing</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={previousCropLegume}
                    onChange={(e) => setPreviousCropLegume(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded-sm"
                  />
                  <span>Previous season crop was a legume / pulse (nitrogen-fixing)</span>
                </label>
              </div>

              {/* Additional Observation */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Field Observations (Optional)
                </label>
                <input
                  type="text"
                  value={farmingNotes}
                  onChange={(e) => setFarmingNotes(e.target.value)}
                  placeholder="E.g., Canal water irrigation, heavy black clay soil..."
                  className="w-full text-xs bg-white border border-[#d2e2cb] rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full min-h-[46px] rounded-xl bg-[#14492a] hover:bg-[#0e3a20] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99]"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{t.calculateGuidance}</span>
                </button>
              </div>
            </form>
          ) : (
            /* Results & Educational Principles */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#edf7ea] border border-[#b9e2b1] text-[#0d4a2b] space-y-1.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <h3 className="font-bold text-sm">Nutrient Management Summary Generated</h3>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Summary for <strong>{crop}</strong> at <strong>{stage}</strong> stage based on agronomical principles.
                </p>
              </div>

              {/* Growth Stage Nutrient Demand Card */}
              <div className="bg-white rounded-2xl border border-[#d6e4cf] p-4 space-y-3">
                <h4 className="text-xs font-bold text-[#14492a] uppercase tracking-wider">
                  Nutrient Dynamics at {stage}
                </h4>

                <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
                  {stage.includes('Sowing') && (
                    <div className="p-2.5 bg-[#f5f9f3] rounded-xl border border-[#dbe8d5]">
                      <strong className="text-emerald-900 block mb-0.5">Basal Nutrition Focus (Phosphorus & Starter Nitrogen):</strong>
                      Phosphorus (P) is vital at sowing for initial root development and energy transfer. Apply full recommended P and K as basal dressing. Provide only 1/3rd of total Nitrogen to avoid leaching.
                    </div>
                  )}

                  {stage.includes('Vegetative') && (
                    <div className="p-2.5 bg-[#f5f9f3] rounded-xl border border-[#dbe8d5]">
                      <strong className="text-emerald-900 block mb-0.5">Vegetative Canopy Growth (Split Nitrogen Top Dressing):</strong>
                      Peak nitrogen requirement for leaf area index and tiller development. Apply Neem-Coated Urea in split dosage followed by immediate light irrigation.
                    </div>
                  )}

                  {stage.includes('Flowering') && (
                    <div className="p-2.5 bg-[#f5f9f3] rounded-xl border border-[#dbe8d5]">
                      <strong className="text-emerald-900 block mb-0.5">Reproductive Transition (Balanced Potassium & Micronutrients):</strong>
                      Excessive nitrogen at flowering causes vegetative lodging and attracts fungal spores. Potassium (K) and Boron support pollen viability and prevent flower drop.
                    </div>
                  )}

                  {stage.includes('Formation') && (
                    <div className="p-2.5 bg-[#f5f9f3] rounded-xl border border-[#dbe8d5]">
                      <strong className="text-emerald-900 block mb-0.5">Grain / Fruit Filling (Potassium & Translocation):</strong>
                      Potassium supports starch translocation into grain kernels, increasing test weight and luster. Avoid late nitrogen sprays that delay maturity.
                    </div>
                  )}

                  {stage.includes('Maturity') && (
                    <div className="p-2.5 bg-[#f5f9f3] rounded-xl border border-[#dbe8d5]">
                      <strong className="text-emerald-900 block mb-0.5">Maturity Phase:</strong>
                      Nutrient application completed. Stop irrigation 10-14 days before harvest to facilitate uniform ripening and reduce grain moisture.
                    </div>
                  )}
                </div>
              </div>

              {/* What is needed before certified recommendations */}
              <div className="bg-[#fcfbf7] rounded-2xl border border-[#eadfc9] p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-amber-900">
                  <HelpCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    Requirements for Certified Field-Specific Dosage
                  </h4>
                </div>

                <ul className="text-xs text-amber-950 space-y-1.5 list-disc pl-4 leading-relaxed">
                  <li>
                    <strong>Official Soil Health Card:</strong> Exact laboratory values for pH, Organic Carbon (OC %), and electrical conductivity (EC).
                  </li>
                  <li>
                    <strong>Target Yield Calculation:</strong> Dosage varies drastically between irrigated high-yielding hybrids (e.g., 25 quintals/acre) and rainfed native varieties.
                  </li>
                  <li>
                    <strong>Local Extension Approval:</strong> Consult your nearest Krishi Vigyan Kendra (KVK) or State Department of Agriculture extension officer before purchasing chemical bags.
                  </li>
                </ul>
              </div>

              {saveSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSaveToFarmNotes}
                  className="flex-1 min-h-[44px] rounded-xl bg-[#14492a] hover:bg-[#0d361e] text-white text-xs font-bold flex items-center justify-center gap-2 transition"
                >
                  <BookmarkPlus className="w-4 h-4" />
                  <span>Save Guidance to My Farm</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCalculated(false)}
                  className="min-h-[44px] px-4 rounded-xl bg-white border border-[#d2e2cb] text-slate-700 hover:bg-[#f3f7f0] text-xs font-semibold transition"
                >
                  Edit Parameters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
