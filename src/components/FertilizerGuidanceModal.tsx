import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  ShieldAlert, 
  BookmarkPlus, 
  HelpCircle,
  RefreshCw,
  FlaskConical,
  Sprout,
  ArrowRight,
  Info
} from 'lucide-react';
import { GrowthStage, SupportedLanguage, FarmerProfile, PlantScanRecord, SoilScanRecord } from '../types';
import { TRANSLATIONS } from '../constants/translations';
import { storageService } from '../services/storage';

interface FertilizerGuidanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: SupportedLanguage;
  preselectedCrop?: string;
  onSavedToObservations?: () => void;
  profile?: FarmerProfile;
  plantScans?: PlantScanRecord[];
  soilScans?: SoilScanRecord[];
}

interface GuidanceResult {
  summary: string;
  stageNutrientDynamics: {
    nutrient: string;
    role: string;
    managementAdvice: string;
  }[];
  measuredVsEstimatedNotice: string;
  actionableNextSteps: string[];
  followUpQuestions: string[];
  extensionDisclaimer: string;
}

const COMMON_CROPS = [
  'Wheat',
  'Paddy / Rice',
  'Cotton',
  'Red Onion',
  'Tomato',
  'Mustard / Sarson',
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
  profile,
  plantScans = [],
  soilScans = [],
}) => {
  const t = TRANSLATIONS[language]?.fertilizer || TRANSLATIONS.en.fertilizer;

  const [crop, setCrop] = useState<string>(preselectedCrop || 'Wheat');
  const [stage, setStage] = useState<GrowthStage>('Tillering / Vegetative');
  
  // Real Laboratory Soil Test
  const [hasSoilTest, setHasSoilTest] = useState<boolean>(false);
  const [soilPh, setSoilPh] = useState<string>('');
  const [nitrogenLevel, setNitrogenLevel] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [phosphorusLevel, setPhosphorusLevel] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [potassiumLevel, setPotassiumLevel] = useState<'Low' | 'Medium' | 'High'>('High');
  const [organicCarbon, setOrganicCarbon] = useState<string>('');

  // Scan context integration
  const [includeScanContext, setIncludeScanContext] = useState<boolean>(true);
  const [selectedScanSummary, setSelectedScanSummary] = useState<string>('');

  // Organic context
  const [organicManureApplied, setOrganicManureApplied] = useState<boolean>(true);
  const [previousCropLegume, setPreviousCropLegume] = useState<boolean>(false);
  const [farmingNotes, setFarmingNotes] = useState<string>('');

  // Execution state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [guidanceResult, setGuidanceResult] = useState<GuidanceResult | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedCrop) {
      setCrop(preselectedCrop);
    }
  }, [preselectedCrop]);

  // Derive recent scan summary if available
  useEffect(() => {
    if (plantScans && plantScans.length > 0) {
      const recent = plantScans[0];
      if (recent.aiAnalysis?.visibleObservations) {
        setSelectedScanSummary(
          `Recent Leaf Scan (${recent.date}): ${recent.aiAnalysis.visibleObservations.foliarCondition || 'Foliage inspected'}. Vigor: ${recent.aiAnalysis.visibleObservations.overallVigor || 'Normal'}.`
        );
      }
    } else if (soilScans && soilScans.length > 0) {
      const recentSoil = soilScans[0];
      setSelectedScanSummary(
        `Recent Soil Scan (${recentSoil.date}): Texture estimated as ${recentSoil.aiAnalysis?.visibleObservations?.apparentColor || 'Surface scanned'}.`
      );
    }
  }, [plantScans, soilScans]);

  if (!isOpen) return null;

  const handleFetchGuidance = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSaveSuccessMsg(null);

    const locationText = profile
      ? `${profile.villageOrDistrict || 'Vijayapura'}, ${profile.state || 'Karnataka'}`
      : 'Karnataka, India';

    try {
      const payload = {
        cropName: crop,
        growthStage: stage,
        location: locationText,
        soilType: profile?.primarySoilType,
        hasSoilTest,
        soilTestResults: hasSoilTest
          ? {
              ph: soilPh ? parseFloat(soilPh) : undefined,
              nitrogen: nitrogenLevel,
              phosphorus: phosphorusLevel,
              potassium: potassiumLevel,
              organicCarbon: organicCarbon || undefined,
            }
          : undefined,
        scanResultsSummary: includeScanContext ? selectedScanSummary : undefined,
        organicManureApplied,
        previousCropLegume,
        farmingNotes: farmingNotes.trim(),
        language,
      };

      const res = await fetch('/api/fertilizer-guidance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate fertilizer guidance.');
      }

      setGuidanceResult(data.guidance);
    } catch (err: any) {
      console.error('Fertilizer guidance error:', err);
      setErrorMsg(err.message || 'Unable to connect to Fertilizer Advisor. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToFarmNotes = () => {
    if (!guidanceResult) return;
    storageService.saveObservation({
      id: `obs-fert-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      cropName: crop,
      fieldName: 'Main Field',
      category: 'Fertilizer',
      notes: `Fertilizer Guidance (${crop} - ${stage}): ${guidanceResult.summary}. Manure applied: ${
        organicManureApplied ? 'Yes' : 'No'
      }. Soil Test: ${hasSoilTest ? `N:${nitrogenLevel}, P:${phosphorusLevel}, K:${potassiumLevel}` : 'Unconfirmed'}.`.trim(),
    });
    setSaveSuccessMsg('Guidance record saved to My Farm observations!');
    if (onSavedToObservations) onSavedToObservations();
  };

  const handleReset = () => {
    setGuidanceResult(null);
    setErrorMsg(null);
    setSaveSuccessMsg(null);
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
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Scientific Transparency Notice */}
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#fefce8] border border-[#fef08a] text-xs text-[#713f12]">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-relaxed">
              <span className="font-bold text-amber-900 block">Strict Agronomic Measurement Transparency</span>
              <span>
                A photo alone cannot measure soil chemistry or NPK levels. Only verified laboratory tests (Soil Health Cards) provide measured chemical values. Visual observations provide growth-stage guidelines.
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button
                type="button"
                onClick={handleFetchGuidance}
                className="px-2.5 py-1 bg-red-100 text-red-800 hover:bg-red-200 rounded-lg font-bold text-[11px] shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          {!guidanceResult ? (
            /* Input Form */
            <form onSubmit={handleFetchGuidance} className="space-y-4">
              {/* Crop Selection */}
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
                          ? 'bg-[#14492a] text-white border-[#14492a] font-bold shadow-xs'
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
                  className="w-full text-xs bg-white border border-[#d2e2cb] rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {GROWTH_STAGES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Soil Test Toggle & Inputs */}
              <div className="p-3.5 rounded-2xl bg-[#f9faf7] border border-[#e2edd0] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 block flex items-center gap-1.5">
                      <FlaskConical className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Official Soil Health Card Available?</span>
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Government lab test or certified testing report
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setHasSoilTest(true)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                        hasSoilTest
                          ? 'bg-[#14492a] text-white shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-600'
                      }`}
                    >
                      Yes, Have Test
                    </button>
                    <button
                      type="button"
                      onClick={() => setHasSoilTest(false)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                        !hasSoilTest
                          ? 'bg-[#14492a] text-white shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-600'
                      }`}
                    >
                      No Lab Test
                    </button>
                  </div>
                </div>

                {hasSoilTest ? (
                  <div className="space-y-2.5 pt-2 border-t border-slate-200/60">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-1 font-bold">Soil pH</span>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="e.g. 6.8"
                          value={soilPh}
                          onChange={(e) => setSoilPh(e.target.value)}
                          className="w-full text-xs bg-white border border-slate-200 rounded-lg p-1.5 text-slate-800"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-1 font-bold">Nitrogen (N)</span>
                        <select
                          value={nitrogenLevel}
                          onChange={(e) => setNitrogenLevel(e.target.value as any)}
                          className="w-full text-xs bg-white border border-slate-200 rounded-lg p-1.5 text-slate-800"
                        >
                          <option value="Low">Low (&lt; 280 kg/ha)</option>
                          <option value="Medium">Medium (280-560)</option>
                          <option value="High">High (&gt; 560)</option>
                        </select>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-1 font-bold">Phosphorus (P)</span>
                        <select
                          value={phosphorusLevel}
                          onChange={(e) => setPhosphorusLevel(e.target.value as any)}
                          className="w-full text-xs bg-white border border-slate-200 rounded-lg p-1.5 text-slate-800"
                        >
                          <option value="Low">Low (&lt; 10 kg/ha)</option>
                          <option value="Medium">Medium (10-25)</option>
                          <option value="High">High (&gt; 25)</option>
                        </select>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-1 font-bold">Potassium (K)</span>
                        <select
                          value={potassiumLevel}
                          onChange={(e) => setPotassiumLevel(e.target.value as any)}
                          className="w-full text-xs bg-white border border-slate-200 rounded-lg p-1.5 text-slate-800"
                        >
                          <option value="Low">Low (&lt; 110 kg/ha)</option>
                          <option value="Medium">Medium (110-280)</option>
                          <option value="High">High (&gt; 280)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded-xl border border-slate-200/60 leading-relaxed">
                    💡 Without a laboratory test, guidance will provide standard crop nutritional timing. AGROVA will never invent chemical measurements.
                  </div>
                )}
              </div>

              {/* Scan Results Context Strip */}
              {selectedScanSummary && (
                <div className="p-3 bg-[#f2f7ef] rounded-2xl border border-[#cfe2ca] space-y-1.5">
                  <label className="flex items-center gap-2 text-xs font-bold text-[#14492a] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeScanContext}
                      onChange={(e) => setIncludeScanContext(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded-sm"
                    />
                    <span>Include Recent In-Field Scan Observations</span>
                  </label>
                  {includeScanContext && (
                    <p className="text-[11px] text-slate-600 pl-6 leading-relaxed">
                      {selectedScanSummary}
                    </p>
                  )}
                </div>
              )}

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

              {/* Additional Observations */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Field Observations (Optional)
                </label>
                <input
                  type="text"
                  value={farmingNotes}
                  onChange={(e) => setFarmingNotes(e.target.value)}
                  placeholder="E.g., Drip irrigation installed, clay-loam soil, 1st split applied 15 days ago..."
                  className="w-full text-xs bg-white border border-[#d2e2cb] rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full min-h-[46px] rounded-2xl bg-[#14492a] hover:bg-[#0e3a20] active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-300" />
                      <span>Generating Agronomic Nutrition Guidance...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>{t.calculateGuidance}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Guidance Results Mode */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#edf7ea] border border-[#b9e2b1] text-[#0d4a2b] space-y-1.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <h3 className="font-bold text-sm">Nutrient Management Strategy for {crop}</h3>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                  {guidanceResult.summary}
                </p>
              </div>

              {/* Measured vs Estimated Transparency Notice */}
              <div className="p-3 bg-[#f8faf6] rounded-2xl border border-[#dce8d5] text-xs text-slate-700 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-[#144225] block text-[11px] uppercase tracking-wider">
                    Measurement Verification
                  </span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {guidanceResult.measuredVsEstimatedNotice}
                  </p>
                </div>
              </div>

              {/* Growth Stage Nutrient Dynamics */}
              <div className="bg-white rounded-2xl border border-[#d6e4cf] p-4 space-y-3">
                <h4 className="text-xs font-bold text-[#14492a] uppercase tracking-wider">
                  Nutrient Dynamics at {stage} Stage
                </h4>

                <div className="space-y-2.5">
                  {guidanceResult.stageNutrientDynamics?.map((item, idx) => (
                    <div key={idx} className="p-3 bg-[#f7faf5] rounded-xl border border-[#dbe7d5] space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#133e24] text-xs">{item.nutrient}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {stage}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        <strong>Role:</strong> {item.role}
                      </p>
                      <p className="text-emerald-900 text-[11px] leading-relaxed">
                        <strong>Strategy:</strong> {item.managementAdvice}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actionable Next Steps */}
              {guidanceResult.actionableNextSteps && guidanceResult.actionableNextSteps.length > 0 && (
                <div className="bg-white rounded-2xl border border-[#d6e4cf] p-4 space-y-2 text-xs">
                  <h4 className="text-xs font-bold text-[#14492a] uppercase tracking-wider">
                    Recommended Next Steps
                  </h4>
                  <ul className="space-y-1.5 list-disc pl-4 text-slate-700 text-xs leading-relaxed">
                    {guidanceResult.actionableNextSteps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Follow-up Questions */}
              {guidanceResult.followUpQuestions && guidanceResult.followUpQuestions.length > 0 && (
                <div className="bg-[#fcfbf7] rounded-2xl border border-[#eadfc9] p-3.5 space-y-2 text-xs text-amber-950">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <HelpCircle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Follow-Up Considerations</span>
                  </div>
                  <ul className="space-y-1 list-disc pl-4 text-[11px] leading-relaxed">
                    {guidanceResult.followUpQuestions.map((q, idx) => (
                      <li key={idx}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Extension Disclaimer */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
                <strong>Certified Extension Compliance:</strong> {guidanceResult.extensionDisclaimer}
              </div>

              {saveSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              {/* Actions */}
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
                  onClick={handleReset}
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
