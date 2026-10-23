import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  ChevronDown, 
  AlertTriangle, 
  Sprout, 
  Droplets, 
  ShieldCheck, 
  Bell, 
  Edit3, 
  RefreshCw, 
  Sparkles, 
  Info, 
  Check, 
  X,
  Volume2,
  CalendarDays,
  ShieldAlert,
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import { 
  CropTimelineProfile, 
  CropTimelineStage, 
  CropTimelineActivity, 
  CurrentWeatherReport, 
  SupportedLanguage, 
  FarmingMethod,
  CropRecord,
  CropTimelineReminder
} from '../types';
import { cropTimelineService, CROP_AGRONOMIC_DATABASE } from '../services/cropTimelineService';
import { storageService } from '../services/storage';
import { TIMELINE_TRANSLATIONS } from '../constants/timelineTranslations';
import { VoiceSpeakerButton } from './VoiceSpeakerButton';

interface CropTimelineSectionProps {
  cropName: string;
  crops?: CropRecord[];
  weather?: CurrentWeatherReport;
  language?: SupportedLanguage;
  farmLocation?: string;
  onSelectCrop?: (cropName: string) => void;
  onOpenVoiceAssistant?: () => void;
}

const FARMING_METHODS: FarmingMethod[] = [
  'Drip Irrigated',
  'Rainfed',
  'Canal / Flood Irrigated',
  'Sprinkler Irrigated',
  'Organic / Natural Farming',
  'Integrated Pest Management (IPM)'
];

export const CropTimelineSection: React.FC<CropTimelineSectionProps> = ({
  cropName,
  crops = [],
  weather,
  language = 'en',
  farmLocation,
  onSelectCrop,
  onOpenVoiceAssistant
}) => {
  const t = TIMELINE_TRANSLATIONS[language] || TIMELINE_TRANSLATIONS.en;

  // Selected crop & profile
  const [timeline, setTimeline] = useState<CropTimelineProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  // Edit Crop Details Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editCropName, setEditCropName] = useState<string>(cropName);
  const [editVariety, setEditVariety] = useState<string>('');
  const [editSowingDate, setEditSowingDate] = useState<string>('');
  const [editFarmingMethod, setEditFarmingMethod] = useState<FarmingMethod>('Drip Irrigated');
  const [editRegion, setEditRegion] = useState<string>(farmLocation || 'Karnataka, India');
  const [editManualStageIndex, setEditManualStageIndex] = useState<number>(0);

  // Reminders Toast & State
  const [reminderToast, setReminderToast] = useState<string | null>(null);
  const [reminders, setReminders] = useState<CropTimelineReminder[]>(() => storageService.getTimelineReminders());

  // Collapsible completed stages state
  const [showCompletedStages, setShowCompletedStages] = useState<boolean>(false);

  // Load or generate timeline for selected crop
  const loadTimeline = async (targetCropName: string, forceAi = false) => {
    setLoading(true);
    setError(null);
    setAiNotice(null);

    try {
      // 1. Check if user has an existing saved crop record matching this name
      const matchedCropRecord = crops.find(c => c.name.toLowerCase() === targetCropName.toLowerCase() || targetCropName.toLowerCase().includes(c.name.toLowerCase()));
      
      // 2. Check storage for existing saved timeline profile
      let existing = storageService.getCropTimeline(targetCropName);

      // Determine initial sowing date from matched crop record if not in timeline
      const effectiveSowingDate = existing?.sowingDate || matchedCropRecord?.sowingDate || '';
      const effectiveVariety = existing?.variety || matchedCropRecord?.variety || '';
      const effectiveRegion = existing?.growingRegion || farmLocation || 'Karnataka, India';
      const effectiveFarmingMethod = existing?.farmingMethod || 'Drip Irrigated';

      if (!existing || forceAi) {
        if (forceAi) setIsAiLoading(true);

        const aiResult = await cropTimelineService.fetchAiEnhancedTimeline({
          cropName: targetCropName,
          variety: effectiveVariety,
          sowingDate: effectiveSowingDate,
          growingRegion: effectiveRegion,
          farmingMethod: effectiveFarmingMethod,
          manualStageIndex: existing?.currentStageIndex,
          weather,
          language
        });

        if (aiResult.success && aiResult.timeline) {
          existing = aiResult.timeline;
          if (aiResult.warning) {
            setAiNotice(aiResult.warning);
          }
          storageService.saveCropTimeline(existing);
        } else {
          // Generate using rule engine
          existing = cropTimelineService.generateTimelineProfile({
            cropName: targetCropName,
            variety: effectiveVariety,
            sowingDate: effectiveSowingDate,
            growingRegion: effectiveRegion,
            farmingMethod: effectiveFarmingMethod,
            weather,
            language
          });
          storageService.saveCropTimeline(existing);
        }
      }

      setTimeline(existing);
      setEditCropName(existing.cropName);
      setEditVariety(existing.variety || '');
      setEditSowingDate(existing.sowingDate || '');
      setEditFarmingMethod(existing.farmingMethod);
      setEditRegion(existing.growingRegion || farmLocation || 'Karnataka, India');
      setEditManualStageIndex(existing.currentStageIndex);
    } catch (err: any) {
      console.error('Failed to load crop timeline:', err);
      setError(err.message || 'Unable to load timeline for this crop.');
    } finally {
      setLoading(false);
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    loadTimeline(cropName);
  }, [cropName, weather, language]);

  // Handle marking an activity completed/incomplete
  const handleToggleActivity = (activityId: string) => {
    if (!timeline) return;
    const updated = storageService.toggleTimelineActivity(timeline.id, activityId);
    if (updated) {
      setTimeline({ ...updated });
    }
  };

  // Handle stage change (manual override)
  const handleStageChange = (newStageIndex: number) => {
    if (!timeline) return;
    const updated = storageService.updateTimelineStage(timeline.id, newStageIndex);
    if (updated) {
      setTimeline({ ...updated });
      setEditManualStageIndex(newStageIndex);
    }
  };

  // Handle saving edits from modal
  const handleSaveCropEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCropName.trim()) return;

    // Collect existing activity completion statuses to preserve checked state
    const existingActivityState: Record<string, boolean> = {};
    if (timeline) {
      timeline.stages.forEach(st => {
        st.activities.forEach(act => {
          existingActivityState[act.id] = act.completed;
        });
      });
    }

    const regenerated = cropTimelineService.generateTimelineProfile({
      cropName: editCropName,
      variety: editVariety.trim() || undefined,
      sowingDate: editSowingDate.trim() || undefined,
      growingRegion: editRegion.trim() || undefined,
      farmingMethod: editFarmingMethod,
      manualStageIndex: editManualStageIndex,
      weather,
      language,
      existingActivitiesState: existingActivityState
    });

    storageService.saveCropTimeline(regenerated);
    setTimeline(regenerated);
    setIsEditModalOpen(false);

    if (onSelectCrop && editCropName !== cropName) {
      onSelectCrop(editCropName);
    }
  };

  // Handle setting an in-app reminder for an activity
  const handleSetReminder = (activity: CropTimelineActivity, stageName: string) => {
    if (!timeline) return;

    const reminder: CropTimelineReminder = {
      id: `rem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timelineId: timeline.id,
      cropName: timeline.cropName,
      activityId: activity.id,
      activityTitle: activity.title,
      stageName,
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      notified: false,
      createdAt: new Date().toISOString()
    };

    storageService.saveTimelineReminder(reminder);
    setReminders(storageService.getTimelineReminders());

    // Request browser notification permission if available
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    setReminderToast(`Reminder set for: "${activity.title}"`);
    setTimeout(() => setReminderToast(null), 4000);
  };

  // Check if reminder is set for an activity
  const isReminderSet = (activityId: string) => {
    return reminders.some(r => r.activityId === activityId);
  };

  if (loading && !timeline) {
    return (
      <div className="p-6 rounded-3xl bg-white border border-[#dce8d5] text-center space-y-3">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold text-[#14492a]">
          Loading Crop Timeline for {cropName}...
        </p>
        <p className="text-[11px] text-slate-500">
          Calculating stage milestones from ICAR packages of practices and local weather data.
        </p>
      </div>
    );
  }

  if (error && !timeline) {
    return (
      <div className="p-5 rounded-3xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-2">
        <div className="flex items-center gap-2 font-bold text-red-950">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>Unable to generate crop timeline</span>
        </div>
        <p>{error}</p>
        <button
          onClick={() => loadTimeline(cropName, false)}
          className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl text-xs transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!timeline) return null;

  // Partition stages into Completed, Current, and Upcoming
  const completedStages = timeline.stages.filter(s => s.status === 'completed');
  const currentStage = timeline.stages.find(s => s.status === 'current') || timeline.stages[timeline.currentStageIndex] || timeline.stages[0];
  const upcomingStages = timeline.stages.filter(s => s.status === 'upcoming');

  return (
    <div className="space-y-4">
      {/* Toast Notification Banner */}
      {reminderToast && (
        <div 
          role="status"
          aria-live="polite"
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-[#124429] text-white text-xs font-semibold shadow-lg border border-emerald-500/40 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 max-w-[90vw]"
        >
          <Bell className="w-4 h-4 text-emerald-300 shrink-0" />
          <span className="truncate">{reminderToast}</span>
        </div>
      )}

      {/* Main Crop Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#124429] via-[#103e26] to-[#0a2818] text-white p-4 sm:p-5 shadow-xs border border-[#1b5735]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] uppercase border border-emerald-400/30">
                {t.title}
              </span>
              <span className="text-xs text-emerald-200/90 font-medium">
                {timeline.dataSource}
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-extrabold font-display truncate text-white">
              {timeline.cropName} {timeline.variety ? `(${timeline.variety})` : ''}
            </h3>

            <div className="flex items-center gap-2 text-xs text-emerald-100/90 flex-wrap pt-0.5">
              <span>🌾 {timeline.farmingMethod}</span>
              <span>•</span>
              <span>📍 {timeline.growingRegion || 'Local Region'}</span>
              {typeof timeline.daysAfterSowing === 'number' && (
                <>
                  <span>•</span>
                  <span className="font-bold text-white">
                    Day {timeline.daysAfterSowing} (DAS)
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons: Edit Crop Setup & Listen Voice */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Voice Audio Readout in Selected Language */}
            {timeline.spokenSummary && (
              <VoiceSpeakerButton
                text={timeline.spokenSummary}
                language={language}
                utteranceId={`timeline-${timeline.cropName}-${Date.now().toString().slice(0, 6)}`}
                variant="button"
                customLabel={t.listenAction}
              />
            )}

            {/* Edit Crop Setup Button */}
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="px-3 py-1.5 min-h-[38px] rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/25 text-white text-xs font-bold transition flex items-center gap-1.5 border border-white/20 cursor-pointer shadow-2xs"
              title="Edit planting date, variety, or growth stage"
            >
              <Edit3 className="w-3.5 h-3.5 text-emerald-300" />
              <span>{t.editDetails}</span>
            </button>

            {/* AI Re-enhancement button */}
            <button
              type="button"
              disabled={isAiLoading}
              onClick={() => loadTimeline(timeline.cropName, true)}
              className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition border border-white/20 cursor-pointer disabled:opacity-50"
              title="Re-analyze timeline with Gemini AI"
              aria-label="Refresh AI Timeline"
            >
              <Sparkles className={`w-3.5 h-3.5 text-emerald-300 ${isAiLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Progress Bar (Only shown if sowing date exists and progress is calculable) */}
        {typeof timeline.progressPercentage === 'number' ? (
          <div className="mt-3.5 pt-3 border-t border-white/15 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-emerald-200 font-medium">
              <span>{t.estimatedProgress}: <strong>{timeline.progressPercentage}%</strong></span>
              <span>
                {timeline.daysAfterSowing} of ~{timeline.totalDurationDays} days cycle
              </span>
            </div>
            <div className="w-full bg-white/15 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-400 to-green-300 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${timeline.progressPercentage}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="mt-3 pt-2.5 border-t border-white/15 text-[11px] text-emerald-200/90 flex items-center justify-between gap-2">
            <span>{t.noSowingDateNotice}</span>
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="text-xs font-bold text-white underline hover:text-emerald-200 shrink-0"
            >
              Add Date
            </button>
          </div>
        )}
      </div>

      {/* AI or Agronomic Notice */}
      {aiNotice && (
        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          <span>{aiNotice}</span>
        </div>
      )}

      {/* MANDATORY PROMINENT NEXT RECOMMENDED ACTION CARD */}
      {timeline.nextRecommendedAction && (
        <div className="p-4 rounded-3xl bg-white border-2 border-emerald-600/60 shadow-xs space-y-2.5 relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 font-display">
                {t.nextAction}
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase bg-rose-100 text-rose-800 border border-rose-200">
              {timeline.nextRecommendedAction.urgency.replace('_', ' ')}
            </span>
          </div>

          <div>
            <h4 className="text-sm sm:text-base font-bold text-[#144225] font-display">
              {timeline.nextRecommendedAction.title}
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed font-medium mt-1">
              {timeline.nextRecommendedAction.advice}
            </p>
          </div>

          {/* Scientific Agronomic Reasoning */}
          {timeline.nextRecommendedAction.reasoning && (
            <div className="p-2.5 rounded-2xl bg-[#f7faf5] border border-[#dce8d5] text-[11px] text-slate-600 space-y-0.5">
              <span className="font-bold text-[#134426] block">
                {t.whyItMatters}
              </span>
              <p className="leading-relaxed">
                {timeline.nextRecommendedAction.reasoning}
              </p>
            </div>
          )}

          {/* Weather-Aware Context Adjustment */}
          {timeline.nextRecommendedAction.weatherContext && (
            <div className="p-2.5 rounded-2xl bg-sky-50 border border-sky-200 text-[11px] text-sky-900 flex items-start gap-2">
              <Droplets className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">{t.weatherAdjustment}</span>
                <p className="leading-relaxed">{timeline.nextRecommendedAction.weatherContext}</p>
              </div>
            </div>
          )}

          {/* Safety Warning */}
          {timeline.nextRecommendedAction.safetyWarning && (
            <div className="flex items-start gap-1.5 text-[10px] text-amber-900/90 leading-tight">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
              <span>{timeline.nextRecommendedAction.safetyWarning}</span>
            </div>
          )}
        </div>
      )}

      {/* Date Estimation Disclaimer Notice */}
      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 leading-relaxed flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <span>{t.estimatedDatesNotice}</span>
      </div>

      {/* ==================== GROUP 1: COMPLETED STAGES ==================== */}
      {completedStages.length > 0 && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowCompletedStages(!showCompletedStages)}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#edf6ea] border border-[#d2e4cb] text-xs font-bold text-[#14492a] hover:bg-[#e4f0df] transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>{t.completedStages} ({completedStages.length})</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-600">
              <span>{showCompletedStages ? 'Hide' : 'View Past Milestones'}</span>
              {showCompletedStages ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </div>
          </button>

          {showCompletedStages && (
            <div className="space-y-2.5 pl-2 sm:pl-3 border-l-2 border-emerald-300 ml-3">
              {completedStages.map((stage) => (
                <div 
                  key={stage.id} 
                  className="p-3 rounded-2xl bg-white border border-[#dce8d5] shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">
                        ✓
                      </span>
                      <h5 className="text-xs sm:text-sm font-bold text-[#144225] font-display">
                        {stage.stageName}
                      </h5>
                    </div>
                    {stage.estimatedStartDate && stage.estimatedEndDate && (
                      <span className="text-[10px] font-semibold text-slate-500 tabular-nums">
                        {stage.estimatedStartDate} to {stage.estimatedEndDate}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {stage.description}
                  </p>
                  
                  {/* Activities summary */}
                  <div className="space-y-1 pt-1">
                    {stage.activities.map((act) => (
                      <div key={act.id} className="flex items-center gap-2 text-[11px] text-slate-700">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="line-through text-slate-500">{act.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== GROUP 2: CURRENT ACTIVE STAGE (HIGHLIGHTED) ==================== */}
      {currentStage && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-600 animate-ping" />
              <h4 className="text-xs sm:text-sm font-extrabold text-[#144225] uppercase tracking-wider font-display">
                {t.currentStage}
              </h4>
            </div>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold border border-emerald-300">
              Stage {currentStage.stageOrder} of {timeline.stages.length}
            </span>
          </div>

          <div className="p-4 rounded-3xl bg-white border-2 border-emerald-600 shadow-sm space-y-3.5">
            {/* Stage Title & Date Range */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e5efe1] pb-3">
              <div>
                <h5 className="text-sm sm:text-base font-extrabold text-[#114022] font-display">
                  {currentStage.stageName}
                </h5>
                <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                  {currentStage.description}
                </p>
              </div>

              {currentStage.estimatedStartDate && currentStage.estimatedEndDate ? (
                <div className="shrink-0 text-right bg-[#f7faf5] px-2.5 py-1.5 rounded-xl border border-[#dce8d5]">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                    Estimated Window:
                  </span>
                  <span className="text-xs font-bold text-slate-800 tabular-nums">
                    {currentStage.estimatedStartDate} — {currentStage.estimatedEndDate}
                  </span>
                </div>
              ) : (
                <span className="text-[10px] text-slate-400 italic">
                  Dates pending sowing entry
                </span>
              )}
            </div>

            {/* Key Focus Banner */}
            <div className="p-2.5 rounded-2xl bg-[#edf6ea] border border-[#d2e4cb] text-xs text-[#14492a] flex items-center gap-2">
              <Sprout className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="font-medium"><strong>Primary Objective:</strong> {currentStage.keyFocus}</span>
            </div>

            {/* Interactive Stage Activities Checklist */}
            <div className="space-y-2.5">
              <h6 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Stage Action Items & Verification ({currentStage.activities.length})
              </h6>

              {currentStage.activities.map((act) => {
                const categoryLabels: Record<string, string> = {
                  irrigation: '💧 Irrigation',
                  nutrient: '🌱 Nutrition',
                  weed: '🌿 Weeding',
                  pest_disease: '🛡️ Plant Protection',
                  field_inspection: '🔍 Scouting',
                  harvest: '🌾 Harvest'
                };

                return (
                  <div 
                    key={act.id}
                    className={`p-3.5 rounded-2xl border transition-all space-y-2 ${
                      act.completed 
                        ? 'bg-[#f8faf6] border-[#dce8d5] opacity-85' 
                        : 'bg-white border-[#d2e2cb] hover:border-emerald-600/50 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        {/* Checkbox */}
                        <button
                          type="button"
                          onClick={() => handleToggleActivity(act.id)}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition cursor-pointer ${
                            act.completed
                              ? 'bg-emerald-600 text-white'
                              : 'border-2 border-slate-300 hover:border-emerald-600 bg-white'
                          }`}
                          title={act.completed ? 'Mark incomplete' : 'Mark completed'}
                          aria-label={`Mark ${act.title} as ${act.completed ? 'incomplete' : 'completed'}`}
                        >
                          {act.completed && <Check className="w-4 h-4" />}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                              {categoryLabels[act.category] || act.category}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              ⏱️ {act.timingDescription}
                            </span>
                          </div>

                          <h6 className={`text-xs sm:text-sm font-bold text-[#144225] font-display mt-1 ${act.completed ? 'line-through text-slate-500' : ''}`}>
                            {act.title}
                          </h6>
                        </div>
                      </div>

                      {/* Reminder Button */}
                      <button
                        type="button"
                        onClick={() => handleSetReminder(act, currentStage.stageName)}
                        className={`p-1.5 rounded-xl border text-xs transition cursor-pointer shrink-0 ${
                          isReminderSet(act.id)
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                        title={isReminderSet(act.id) ? 'Reminder is set' : 'Set in-app reminder'}
                      >
                        <Bell className={`w-3.5 h-3.5 ${isReminderSet(act.id) ? 'text-emerald-700 fill-emerald-600' : ''}`} />
                      </button>
                    </div>

                    {/* Scientific Importance / Reasoning */}
                    <div className="pl-8 text-[11px] text-slate-600 leading-relaxed">
                      <p><strong>{t.whyItMatters}</strong> {act.importanceReason}</p>
                    </div>

                    {/* Weather adjustment */}
                    {act.weatherAdjustment && (
                      <div className="ml-8 p-2 rounded-xl bg-amber-50 border border-amber-200 text-[10px] text-amber-900 leading-tight">
                        <strong>{t.weatherAdjustment}</strong> {act.weatherAdjustment}
                      </div>
                    )}

                    {/* Safety note */}
                    {act.safetyNote && (
                      <div className="ml-8 text-[10px] text-amber-900/90 flex items-start gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-700 shrink-0 mt-0.5" />
                        <span>{act.safetyNote}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================== GROUP 3: UPCOMING STAGES ==================== */}
      {upcomingStages.length > 0 && (
        <div className="space-y-2.5">
          <h4 className="text-xs sm:text-sm font-bold text-[#144225] uppercase tracking-wider font-display">
            {t.upcomingStages} ({upcomingStages.length})
          </h4>

          <div className="space-y-2.5 pl-2 sm:pl-3 border-l-2 border-slate-300 ml-3">
            {upcomingStages.map((stage) => (
              <div 
                key={stage.id} 
                className="p-3.5 rounded-2xl bg-white border border-[#dce8d5] shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                      {stage.stageOrder}
                    </span>
                    <h5 className="text-xs sm:text-sm font-bold text-slate-800 font-display">
                      {stage.stageName}
                    </h5>
                  </div>
                  {stage.estimatedStartDate && stage.estimatedEndDate && (
                    <span className="text-[10px] font-semibold text-slate-500 tabular-nums">
                      Est. {stage.estimatedStartDate} to {stage.estimatedEndDate}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {stage.description}
                </p>

                <div className="p-2 rounded-xl bg-[#f8faf6] border border-[#dce8d5] text-[10px] text-[#14492a]">
                  <strong>Preparatory Focus:</strong> {stage.keyFocus}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chemical & Spraying Safety Warning Notice */}
      <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-1">
        <div className="flex items-center gap-2 font-bold text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
          <span>{t.safetyWarningTitle}</span>
        </div>
        <p className="leading-relaxed text-[11px]">
          {t.safetyWarningBody}
        </p>
      </div>

      {/* ==================== CROP EDIT & SETUP MODAL ==================== */}
      {isEditModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-black/60 backdrop-blur-xs animate-in fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-crop-title"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Sprout className="w-5 h-5 text-emerald-700" />
                <h4 id="modal-crop-title" className="text-base font-bold text-[#144225] font-display">
                  {t.editDetails}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCropEdits} className="space-y-3.5 text-xs">
              {/* Crop Name */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  {t.cropNameLabel} *
                </label>
                <input
                  type="text"
                  value={editCropName}
                  onChange={(e) => setEditCropName(e.target.value)}
                  required
                  placeholder="e.g. Wheat, Tomato, Cotton, Rice..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 min-h-[40px]"
                />
              </div>

              {/* Variety */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  {t.varietyLabel}
                </label>
                <input
                  type="text"
                  value={editVariety}
                  onChange={(e) => setEditVariety(e.target.value)}
                  placeholder="e.g. HD-2967, Pusa Red, Local Hybrid..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 min-h-[40px]"
                />
              </div>

              {/* Sowing / Transplanting Date */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  {t.sowingDateLabel} (Optional)
                </label>
                <input
                  type="date"
                  value={editSowingDate}
                  onChange={(e) => setEditSowingDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 min-h-[40px]"
                />
                <span className="text-[10px] text-slate-500 block">
                  Enables calendar milestone forecasting and progress percentages.
                </span>
              </div>

              {/* Farming Method */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  {t.farmingMethodLabel}
                </label>
                <select
                  value={editFarmingMethod}
                  onChange={(e) => setEditFarmingMethod(e.target.value as FarmingMethod)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 min-h-[40px]"
                >
                  {FARMING_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Growing Region */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  {t.growingRegionLabel}
                </label>
                <input
                  type="text"
                  value={editRegion}
                  onChange={(e) => setEditRegion(e.target.value)}
                  placeholder="e.g. Vijayapura, Karnataka"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 min-h-[40px]"
                />
              </div>

              {/* Current Growth Stage (Manual Override) */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  {t.currentStageLabel}
                </label>
                <select
                  value={editManualStageIndex}
                  onChange={(e) => setEditManualStageIndex(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 min-h-[40px]"
                >
                  {timeline.stages.map((st, idx) => (
                    <option key={st.id} value={idx}>
                      Stage {idx + 1}: {st.stageName}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-500 block">
                  Allows you to correct the system's estimated stage based on actual field observation.
                </span>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 min-h-[40px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 min-h-[40px] rounded-xl bg-[#14492a] hover:bg-[#0f3820] text-white font-bold transition shadow-xs cursor-pointer"
                >
                  {t.saveChanges}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
