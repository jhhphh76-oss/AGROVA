import React, { useState } from 'react';
import { X, Stethoscope, Camera, Upload, AlertCircle, CheckCircle2, AlertTriangle, FileText, BookmarkPlus } from 'lucide-react';
import { GrowthStage, SupportedLanguage } from '../types';
import { TRANSLATIONS } from '../constants/translations';
import { storageService } from '../services/storage';

interface CropDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: SupportedLanguage;
  preselectedCrop?: string;
  onSavedToObservations?: () => void;
}

const COMMON_CROPS = [
  'Wheat',
  'Paddy / Rice',
  'Cotton',
  'Tomato',
  'Red Onion',
  'Mustard / Sarson',
  'Chilli',
  'Potato',
  'Soybean',
  'Maize',
  'Sugarcane',
  'Chickpea (Chana)',
];

const GROWTH_STAGES: GrowthStage[] = [
  'Sowing / Germination',
  'Tillering / Vegetative',
  'Flowering / Booting',
  'Grain / Fruit Formation',
  'Ripening / Maturity',
  'Harvest Ready',
];

const COMMON_SYMPTOMS = [
  'Yellowing of leaves (Chlorosis)',
  'Brown / black necrotic spots',
  'Leaf curling or crinkling',
  'Sudden plant wilting / drooping',
  'White powdery fungal coating',
  'Chewed leaf margins / holes',
  'Stem borer / hollow stems',
  'Stunted plant growth',
  'Premature fruit or flower drop',
];

export const CropDoctorModal: React.FC<CropDoctorModalProps> = ({
  isOpen,
  onClose,
  language,
  preselectedCrop,
  onSavedToObservations,
}) => {
  const t = TRANSLATIONS[language]?.cropDoctor || TRANSLATIONS.en.cropDoctor;

  const [cropName, setCropName] = useState<string>(preselectedCrop || 'Wheat');
  const [customCrop, setCustomCrop] = useState<string>('');
  const [stage, setStage] = useState<GrowthStage>('Tillering / Vegetative');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [description, setDescription] = useState<string>('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleSymptom = (sym: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Please select an image smaller than 5MB.');
        return;
      }
      setErrorMsg(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCrop = cropName === 'Other' ? customCrop.trim() : cropName;
    if (!finalCrop) {
      setErrorMsg('Please specify the crop name.');
      return;
    }
    if (selectedSymptoms.length === 0 && !description.trim()) {
      setErrorMsg('Please select at least one symptom or describe the problem.');
      return;
    }

    // Save record to local storage
    storageService.saveCropInquiry({
      id: `inq-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      cropName: finalCrop,
      growthStage: stage,
      symptoms: selectedSymptoms,
      affectedParts: ['Leaves'],
      description: description.trim(),
      photoUrl: photoPreview || undefined,
    });

    setIsSubmitted(true);
    setErrorMsg(null);
  };

  const handleSaveToFarmObservations = () => {
    const finalCrop = cropName === 'Other' ? customCrop : cropName;
    storageService.saveObservation({
      id: `obs-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      cropName: finalCrop,
      fieldName: 'Main Field',
      category: 'Pest & Disease',
      notes: `Crop Doctor Record: ${selectedSymptoms.join(', ')}. ${description}`.trim(),
    });
    setSaveSuccessMessage('Observation successfully saved to My Farm records!');
    if (onSavedToObservations) onSavedToObservations();
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setSelectedSymptoms([]);
    setDescription('');
    setPhotoPreview(null);
    setSaveSuccessMessage(null);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#d6e4cf] overflow-hidden my-auto">
        {/* Header */}
        <div className="px-5 py-4 bg-[#f3f8f1] border-b border-[#e2edd0] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#e3f2df] flex items-center justify-center text-[#124429] border border-[#cbe3c6]">
              <Stethoscope className="w-5 h-5 text-emerald-700" />
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
          {/* Honest Notice */}
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#fefce8] border border-[#fef08a] text-xs text-[#713f12]">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-relaxed">
              <span className="font-bold text-amber-900 block">Zero-Budget & Scientific Transparency</span>
              <span>{t.notice}</span>
            </div>
          </div>

          {!isSubmitted ? (
            /* Form Mode */
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Crop Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  {t.selectCrop} <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                  {COMMON_CROPS.slice(0, 8).map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setCropName(c)}
                      className={`px-2 py-2 text-[11px] sm:text-xs font-medium rounded-xl border text-center transition min-h-[40px] truncate ${
                        cropName === c
                          ? 'bg-[#14492a] text-white border-[#14492a] shadow-xs'
                          : 'bg-[#f7faf5] border-[#dbe7d5] text-[#2c4734] hover:bg-white'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={cropName}
                    onChange={(e) => setCropName(e.target.value)}
                    className="w-full text-xs bg-white border border-[#d2e2cb] rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {COMMON_CROPS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="Other">Other (Enter manually)</option>
                  </select>
                </div>

                {cropName === 'Other' && (
                  <input
                    type="text"
                    value={customCrop}
                    onChange={(e) => setCustomCrop(e.target.value)}
                    placeholder="Enter crop name..."
                    className="mt-2 w-full text-xs bg-white border border-[#d2e2cb] rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                )}
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

              {/* Observed Symptoms Checklist */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Observed Symptoms <span className="text-slate-400 font-normal">(Select all that apply)</span>
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {COMMON_SYMPTOMS.map((symptom) => {
                    const isChecked = selectedSymptoms.includes(symptom);
                    return (
                      <label
                        key={symptom}
                        className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition select-none ${
                          isChecked
                            ? 'bg-[#ecf5e8] border-[#a9d7a2] text-[#0e4828]'
                            : 'bg-white border-[#e3ecd9] text-slate-700 hover:bg-[#fafcf8]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSymptom(symptom)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 rounded-sm"
                        />
                        <span className="font-medium">{symptom}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Detailed Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  {t.describeIssue}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="E.g., Symptoms appeared 3 days after sudden rainfall. Lower leaves turning pale yellow first, roots appear healthy..."
                  rows={3}
                  className="w-full text-xs bg-white border border-[#d2e2cb] rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none leading-relaxed"
                />
              </div>

              {/* Plant Photo Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  {t.photoOptional}
                </label>

                {photoPreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-[#cfe2ca] bg-[#f2f7ef] p-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={photoPreview}
                        alt="Crop Problem Preview"
                        className="w-16 h-16 object-cover rounded-xl border border-white shadow-xs"
                      />
                      <div>
                        <span className="text-xs font-semibold text-emerald-800 block">Photo Attached</span>
                        <span className="text-[11px] text-slate-500">Ready for visual reference</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPhotoPreview(null)}
                      className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-xl transition"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-[#cfe2ca] bg-[#f7faf5] hover:bg-[#eff7ec] cursor-pointer transition">
                    <Camera className="w-6 h-6 text-emerald-700 mb-1" />
                    <span className="text-xs font-semibold text-[#14492a]">Upload or Take Photo</span>
                    <span className="text-[10px] text-slate-500">JPG, PNG (Max 5MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full min-h-[46px] rounded-xl bg-[#14492a] hover:bg-[#0e3a20] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99]"
                >
                  <FileText className="w-4 h-4" />
                  <span>{t.submitProblem}</span>
                </button>
              </div>
            </form>
          ) : (
            /* Results & Agronomic Guidance Mode */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#edf7ea] border border-[#b9e2b1] text-[#0d4a2b] space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <h3 className="font-bold text-sm">Crop Symptoms Recorded Successfully</h3>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Your inquiry for <strong>{cropName}</strong> at <strong>{stage}</strong> stage has been saved to your device. Review the structured summary below.
                </p>
              </div>

              {/* Submitted Summary Card */}
              <div className="bg-white rounded-2xl border border-[#d6e4cf] p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Crop & Stage</span>
                    <span className="text-sm font-extrabold text-[#113a21]">{cropName}</span>
                    <span className="text-xs text-slate-500 ml-2">({stage})</span>
                  </div>
                  {photoPreview && (
                    <img
                      src={photoPreview}
                      alt="Crop symptom preview"
                      className="w-12 h-12 object-cover rounded-xl border border-slate-200"
                    />
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold mb-1">Identified Symptoms</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSymptoms.map((sym) => (
                      <span
                        key={sym}
                        className="text-xs px-2.5 py-1 rounded-lg bg-[#ebf5e7] text-[#14492a] font-medium border border-[#cfe2ca]"
                      >
                        {sym}
                      </span>
                    ))}
                  </div>
                </div>

                {description && (
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold mb-0.5">Farmer Notes</span>
                    <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                      {description}
                    </p>
                  </div>
                )}
              </div>

              {/* Agronomic Verification Checklist */}
              <div className="bg-[#f8faf6] rounded-2xl border border-[#dce8d5] p-4 space-y-3">
                <h4 className="text-xs font-bold text-[#14492a] uppercase tracking-wider flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Standard Agronomic Observation Checklist</span>
                </h4>
                <ul className="text-xs text-slate-700 space-y-2 list-disc pl-4 leading-relaxed">
                  <li>
                    <strong>Check Leaf Underside:</strong> Look with a magnifying glass for small spider mites, thrips, or aphid clusters on lower leaf surfaces.
                  </li>
                  <li>
                    <strong>Check Soil Moisture & Root Crown:</strong> Inspect if root zone is waterlogged or compacted, which causes nutrient uptake lock (chlorosis).
                  </li>
                  <li>
                    <strong>Nutrient Deficiency vs Fungal Infection:</strong> Uniform pale yellowing of older leaves usually indicates nitrogen deficiency; circular brown spots with yellow halos point to fungal foliar blight.
                  </li>
                  <li>
                    <strong>Consult KVK / Extension Officer:</strong> Before spraying synthetic chemicals, verify exact threshold with your local Krishi Vigyan Kendra (KVK) agronomist.
                  </li>
                </ul>
              </div>

              {saveSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{saveSuccessMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSaveToFarmObservations}
                  className="flex-1 min-h-[44px] rounded-xl bg-[#14492a] hover:bg-[#0d361e] text-white text-xs font-bold flex items-center justify-center gap-2 transition"
                >
                  <BookmarkPlus className="w-4 h-4" />
                  <span>Save to My Farm Observations</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="min-h-[44px] px-4 rounded-xl bg-white border border-[#d2e2cb] text-slate-700 hover:bg-[#f3f7f0] text-xs font-semibold transition"
                >
                  New Check
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
