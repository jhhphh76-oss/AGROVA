import React, { useState, useEffect, useRef } from 'react';
import { 
  ScanLine, 
  Camera, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  Info,
  Trash2,
  BookmarkPlus,
  RefreshCw,
  Clock,
  Layers,
  MapPin,
  ChevronRight,
  ShieldCheck,
  Maximize2,
  X,
  FileCheck,
  HelpCircle,
  Eye,
  AlertTriangle,
  Sprout,
  Bot,
  MessageSquareText,
  Calendar,
  Check
} from 'lucide-react';
import { 
  SoilType, 
  SoilScanRecord, 
  PlantScanRecord,
  SupportedLanguage, 
  FarmerProfile, 
  CropRecord, 
  SoilAiAnalysis,
  PlantAiAnalysis 
} from '../types';
import { TRANSLATIONS } from '../constants/translations';
import { storageService } from '../services/storage';
import { soilScanService, ImageProcessResult as SoilImageResult } from '../services/soilScanService';
import { plantScanService, ImageProcessResult as PlantImageResult } from '../services/plantScanService';
import { AiAdvisorView } from '../components/AiAdvisorView';

interface SoilScanScreenProps {
  onSavedRecord: () => void;
  language: SupportedLanguage;
  profile?: FarmerProfile;
  crops?: CropRecord[];
  savedScans?: SoilScanRecord[];
}

export const SoilScanScreen: React.FC<SoilScanScreenProps> = ({
  onSavedRecord,
  language,
  profile,
  crops = [],
  savedScans: externalScans,
}) => {
  const t = TRANSLATIONS[language]?.soilScan || TRANSLATIONS.en.soilScan;

  // Primary Scan Modes: 'plant' | 'soil'
  const [scanMode, setScanMode] = useState<'plant' | 'soil'>('plant');

  // Screen View: 'scanner' | 'history' | 'advisor'
  const [activeScreenTab, setActiveScreenTab] = useState<'scanner' | 'history' | 'advisor'>('scanner');

  // History sub-tab: 'plant' | 'soil'
  const [historySubTab, setHistorySubTab] = useState<'plant' | 'soil'>('plant');

  // Field & Crop context selection
  const defaultField = crops.length > 0 ? crops[0].fieldName : 'Plot 1 (Main Field)';
  const [selectedField, setSelectedField] = useState<string>(defaultField);
  const defaultCrop = crops.length > 0 ? crops[0].name : 'Wheat';
  const [selectedCrop, setSelectedCrop] = useState<string>(defaultCrop);

  // Selected Captured Photo State
  const [capturedPlantImage, setCapturedPlantImage] = useState<PlantImageResult | null>(null);
  const [capturedSoilImage, setCapturedSoilImage] = useState<SoilImageResult | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [plantAnalysisResult, setPlantAnalysisResult] = useState<PlantAiAnalysis | null>(null);
  const [soilAnalysisResult, setSoilAnalysisResult] = useState<SoilAiAnalysis | null>(null);

  // Save State
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [savedScanId, setSavedScanId] = useState<string | null>(null);

  // Detail Modal for History
  const [selectedHistoryPlant, setSelectedHistoryPlant] = useState<PlantScanRecord | null>(null);
  const [selectedHistorySoil, setSelectedHistorySoil] = useState<SoilScanRecord | null>(null);

  // Safe item deletion modal state
  const [scanToDelete, setScanToDelete] = useState<{ type: 'plant' | 'soil'; id: string; name: string } | null>(null);

  // Direct native camera input reference
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

  // AI Advisor Shared Scan Context
  const [advisorSharedScan, setAdvisorSharedScan] = useState<{
    type: 'plant' | 'soil';
    summary: string;
    scanRecordId?: string;
    photoUrl?: string;
  } | null>(null);

  // Local storage scan lists
  const [plantScansList, setPlantScansList] = useState<PlantScanRecord[]>(() => {
    return storageService.getPlantScans();
  });
  const [soilScansList, setSoilScansList] = useState<SoilScanRecord[]>(() => {
    return externalScans && externalScans.length > 0 ? externalScans : storageService.getSoilScans();
  });

  // Sync with external scans or storage
  useEffect(() => {
    if (externalScans) {
      setSoilScansList(externalScans);
    }
    setPlantScansList(storageService.getPlantScans());
  }, [externalScans]);

  const locationDisplay = `${profile?.villageOrDistrict || 'Vijayapura'}, ${profile?.state || 'Karnataka'}`;

  // Handle Photo Captured from Real Camera Modal
  const handlePhotoCaptured = async (file: File, dataUrl: string) => {
    setImageError(null);
    setAnalysisError(null);
    setSaveSuccessMessage(null);
    setSaveErrorMessage(null);
    setSavedScanId(null);

    try {
      if (scanMode === 'plant') {
        const validation = plantScanService.validateImageFile(file);
        if (!validation.valid) {
          setImageError(validation.error || 'Invalid photo format.');
          return;
        }
        const processed = await plantScanService.processImageFile(file);
        setCapturedPlantImage(processed);
        setPlantAnalysisResult(null);
      } else {
        const validation = soilScanService.validateImageFile(file);
        if (!validation.valid) {
          setImageError(validation.error || 'Invalid photo format.');
          return;
        }
        const processed = await soilScanService.processImageFile(file);
        setCapturedSoilImage(processed);
        setSoilAnalysisResult(null);
      }
    } catch (err: any) {
      setImageError(err.message || 'Failed to process captured photo.');
    }
  };

  // Run AI Analysis for Captured Plant Photo
  const handleRunPlantAnalysis = async () => {
    if (!capturedPlantImage) {
      setImageError('Please capture a photo first.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setPlantAnalysisResult(null);

    const farmContext = {
      fieldName: selectedField,
      cropName: selectedCrop,
      villageOrDistrict: profile?.villageOrDistrict || 'Vijayapura',
      state: profile?.state || 'Karnataka',
    };

    const res = await plantScanService.analyzePlantPhoto(
      capturedPlantImage.base64,
      capturedPlantImage.mimeType,
      farmContext
    );

    setIsAnalyzing(false);

    if (res.success && res.analysis) {
      setPlantAnalysisResult(res.analysis);
    } else {
      setAnalysisError(res.error || 'Unable to complete AI plant analysis. Please try again.');
    }
  };

  // Run AI Analysis for Captured Soil Photo
  const handleRunSoilAnalysis = async () => {
    if (!capturedSoilImage) {
      setImageError('Please capture a photo first.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setSoilAnalysisResult(null);

    const farmContext = {
      fieldName: selectedField,
      villageOrDistrict: profile?.villageOrDistrict || 'Vijayapura',
      state: profile?.state || 'Karnataka',
      primarySoilType: profile?.primarySoilType,
    };

    const res = await soilScanService.analyzeSoilPhoto(
      capturedSoilImage.base64,
      capturedSoilImage.mimeType,
      farmContext
    );

    setIsAnalyzing(false);

    if (res.success && res.analysis) {
      setSoilAnalysisResult(res.analysis);
    } else {
      setAnalysisError(res.error || 'Unable to complete AI soil analysis. Please try again.');
    }
  };

  // Save Plant Scan Record to Persistent Storage
  const handleSavePlantRecord = async () => {
    if (!capturedPlantImage || !plantAnalysisResult) return;

    setIsSaving(true);
    setSaveErrorMessage(null);

    try {
      const thumb = await plantScanService.createStorageThumbnail(capturedPlantImage.dataUrl);
      const record: PlantScanRecord = {
        id: `plant-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        fieldName: selectedField,
        cropName: selectedCrop,
        photoUrl: thumb,
        observations: plantAnalysisResult.visibleObservations?.foliarCondition || 'Plant visual scan',
        aiAnalysis: plantAnalysisResult,
        isAiAnalyzed: true,
        farmContext: {
          fieldName: selectedField,
          cropName: selectedCrop,
          villageOrDistrict: profile?.villageOrDistrict,
          state: profile?.state,
        },
      };

      const ok = storageService.savePlantScan(record);
      if (ok) {
        setSavedScanId(record.id);
        setPlantScansList(storageService.getPlantScans());
        setSaveSuccessMessage('Plant scan record successfully saved to farm history!');
        onSavedRecord();
      } else {
        setSaveErrorMessage('Failed to save record to local storage.');
      }
    } catch (err: any) {
      setSaveErrorMessage(err.message || 'Error saving plant scan.');
    } finally {
      setIsSaving(false);
    }
  };

  // Save Soil Scan Record to Persistent Storage
  const handleSaveSoilRecord = async () => {
    if (!capturedSoilImage || !soilAnalysisResult) return;

    setIsSaving(true);
    setSaveErrorMessage(null);

    try {
      const thumb = await soilScanService.createStorageThumbnail(capturedSoilImage.dataUrl);
      const record: SoilScanRecord = {
        id: `soil-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        fieldName: selectedField,
        soilPhotoUrl: thumb,
        observations: soilAnalysisResult.visibleObservations?.apparentColor || 'Soil visual scan',
        aiAnalysis: soilAnalysisResult,
        isAiAnalyzed: true,
        farmContext: {
          villageOrDistrict: profile?.villageOrDistrict,
          state: profile?.state,
          primarySoilType: profile?.primarySoilType,
        },
        isLabVerified: false,
      };

      const ok = storageService.saveSoilScan(record);
      if (ok) {
        setSavedScanId(record.id);
        setSoilScansList(storageService.getSoilScans());
        setSaveSuccessMessage('Soil scan record successfully saved to farm history!');
        onSavedRecord();
      } else {
        setSaveErrorMessage('Failed to save record to storage.');
      }
    } catch (err: any) {
      setSaveErrorMessage(err.message || 'Error saving soil scan.');
    } finally {
      setIsSaving(false);
    }
  };

  // Share Scan Context with AI Advisor
  const handleShareWithAdvisor = (type: 'plant' | 'soil', summary: string, photoUrl?: string) => {
    setAdvisorSharedScan({
      type,
      summary,
      photoUrl,
    });
    setActiveScreenTab('advisor');
  };

  // Safe Delete Scan from History (Modal-based)
  const handleDeletePlantScan = (id: string, name?: string) => {
    setScanToDelete({ type: 'plant', id, name: name || 'Plant Scan Record' });
  };

  const handleDeleteSoilScan = (id: string, name?: string) => {
    setScanToDelete({ type: 'soil', id, name: name || 'Soil Scan Record' });
  };

  const handleConfirmDeleteScan = async () => {
    if (!scanToDelete) return;
    try {
      if (scanToDelete.type === 'plant') {
        const ok = await storageService.deletePlantScan(scanToDelete.id);
        if (ok) {
          setPlantScansList(storageService.getPlantScans());
          if (selectedHistoryPlant?.id === scanToDelete.id) {
            setSelectedHistoryPlant(null);
          }
        } else {
          setSaveErrorMessage('Failed to delete plant scan record.');
        }
      } else {
        const ok = await storageService.deleteSoilScan(scanToDelete.id);
        if (ok) {
          setSoilScansList(storageService.getSoilScans());
          if (selectedHistorySoil?.id === scanToDelete.id) {
            setSelectedHistorySoil(null);
          }
        } else {
          setSaveErrorMessage('Failed to delete soil scan record.');
        }
      }
    } catch (err: any) {
      console.error('Delete scan failed:', err);
      setSaveErrorMessage(err.message || 'Failed to delete scan record.');
    } finally {
      setScanToDelete(null);
      onSavedRecord();
    }
  };

  // Direct native camera capture handler
  const handleDirectCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        handlePhotoCaptured(file, reader.result as string);
      };
      reader.onerror = () => {
        setImageError('Failed to read photo from phone camera.');
      };
      reader.readAsDataURL(file);
    }
    // Clear input so retaking produces an event even if file name matches
    e.target.value = '';
  };

  return (
    <div className="space-y-4 sm:space-y-5 pb-12 animate-in fade-in duration-150">
      {/* Screen Header Bar: Visible Heading "Scan" */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#dce8d5] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ScanLine className="w-6 h-6 text-emerald-700" />
            <h1 className="text-xl sm:text-2xl font-black text-[#144225] font-display">
              Scan
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            AI-powered plant leaf diagnostics, optical soil analysis & expert agronomy guidance
          </p>
        </div>

        {/* Navigation Tabs: Scanner | History | AI Advisor */}
        <div className="flex items-center gap-1.5 p-1 bg-[#f4f7f2] rounded-2xl border border-[#dbe6d5] shrink-0">
          <button
            onClick={() => setActiveScreenTab('scanner')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeScreenTab === 'scanner'
                ? 'bg-[#14492a] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>New Scan</span>
          </button>

          <button
            onClick={() => setActiveScreenTab('history')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeScreenTab === 'history'
                ? 'bg-[#14492a] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>History ({plantScansList.length + soilScansList.length})</span>
          </button>

          <button
            onClick={() => setActiveScreenTab('advisor')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeScreenTab === 'advisor'
                ? 'bg-[#14492a] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>AI Advisor</span>
          </button>
        </div>
      </div>

      {/* ==================== VIEW 1: ACTIVE SCANNER ==================== */}
      {activeScreenTab === 'scanner' && (
        <div className="space-y-4">
          {/* TWO CLEAR MODES: Plant Scan vs Soil Scan */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <button
              onClick={() => {
                setScanMode('plant');
                setImageError(null);
                setAnalysisError(null);
              }}
              className={`p-3.5 sm:p-4 rounded-2xl border text-left transition flex items-center gap-3 ${
                scanMode === 'plant'
                  ? 'bg-gradient-to-br from-[#13482a] to-[#0c361e] border-emerald-800 text-white shadow-md'
                  : 'bg-white border-[#dce8d5] text-slate-700 hover:bg-[#fafdf9]'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  scanMode === 'plant'
                    ? 'bg-white/20 text-emerald-300'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                <Sprout className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-bold block truncate font-display">
                  1. Plant Scan
                </span>
                <span
                  className={`text-[10px] sm:text-[11px] block truncate ${
                    scanMode === 'plant' ? 'text-emerald-200' : 'text-slate-500'
                  }`}
                >
                  Foliage & symptom analysis
                </span>
              </div>
            </button>

            <button
              onClick={() => {
                setScanMode('soil');
                setImageError(null);
                setAnalysisError(null);
              }}
              className={`p-3.5 sm:p-4 rounded-2xl border text-left transition flex items-center gap-3 ${
                scanMode === 'soil'
                  ? 'bg-gradient-to-br from-[#13482a] to-[#0c361e] border-emerald-800 text-white shadow-md'
                  : 'bg-white border-[#dce8d5] text-slate-700 hover:bg-[#fafdf9]'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  scanMode === 'soil'
                    ? 'bg-white/20 text-emerald-300'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                <Layers className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-bold block truncate font-display">
                  2. Soil Scan
                </span>
                <span
                  className={`text-[10px] sm:text-[11px] block truncate ${
                    scanMode === 'soil' ? 'text-emerald-200' : 'text-slate-500'
                  }`}
                >
                  Surface texture & aggregates
                </span>
              </div>
            </button>
          </div>

          {/* Context Strip: Field & Crop selection */}
          <div className="bg-white rounded-2xl p-3 sm:p-4 border border-[#dce8d5] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="text-slate-600 font-medium truncate">{locationDisplay}</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Field Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Field:</span>
                <select
                  value={selectedField}
                  onChange={(e) => setSelectedField(e.target.value)}
                  className="px-2.5 py-1 rounded-xl bg-[#f4f7f1] border border-[#d2e2cb] text-slate-800 font-semibold focus:outline-none"
                >
                  {crops.map((c) => (
                    <option key={c.id} value={c.fieldName}>
                      {c.fieldName}
                    </option>
                  ))}
                  <option value="Plot 1 (Main Field)">Plot 1 (Main Field)</option>
                  <option value="East Ridge Plot">East Ridge Plot</option>
                  <option value="Canal Side Plot">Canal Side Plot</option>
                </select>
              </div>

              {/* Crop Selector (when Plant Scan) */}
              {scanMode === 'plant' && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">Crop:</span>
                  <select
                    value={selectedCrop}
                    onChange={(e) => setSelectedCrop(e.target.value)}
                    className="px-2.5 py-1 rounded-xl bg-[#f4f7f1] border border-[#d2e2cb] text-slate-800 font-semibold focus:outline-none"
                  >
                    {crops.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                    <option value="Wheat">Wheat</option>
                    <option value="Paddy / Rice">Paddy / Rice</option>
                    <option value="Cotton">Cotton</option>
                    <option value="Red Onion">Red Onion</option>
                    <option value="Tomato">Tomato</option>
                    <option value="Chilli">Chilli</option>
                    <option value="Mustard / Sarson">Mustard / Sarson</option>
                    <option value="Soybean">Soybean</option>
                    <option value="Other Crop">Other Crop</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Camera Capture Zone */}
          {((scanMode === 'plant' && !capturedPlantImage) || (scanMode === 'soil' && !capturedSoilImage)) && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-dashed border-[#a4c99c] text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100/70 border border-emerald-300 flex items-center justify-center mx-auto text-[#124429]">
                <Camera className="w-8 h-8 text-emerald-800" />
              </div>

              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-[#144225] font-display">
                  {scanMode === 'plant'
                    ? 'Take a Plant Leaf or Crop Photo'
                    : 'Take a Soil Surface Photo'}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {scanMode === 'plant'
                    ? 'Use your device camera to capture clear foliage. Center affected leaves in natural daylight.'
                    : 'Hold your camera 15–20 cm above the dry or damp soil patch. Ensure clear focus on surface particles.'}
                </p>
              </div>

              {imageError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs flex items-center gap-2 max-w-md mx-auto">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{imageError}</span>
                </div>
              )}

              {/* Hidden native device camera capture input */}
              <input
                ref={nativeCameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleDirectCameraCapture}
                className="hidden"
              />

              <div className="flex items-center justify-center max-w-sm mx-auto">
                <button
                  type="button"
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="w-full py-4 px-6 rounded-2xl bg-[#14492a] hover:bg-[#0f3c21] active:scale-95 text-white font-bold text-sm shadow-md shadow-emerald-950/20 transition inline-flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <Camera className="w-5 h-5 text-emerald-300 shrink-0" />
                  <span>Launch Phone Camera App</span>
                </button>
              </div>

              <div className="pt-2 text-[11px] text-slate-500">
                Direct phone camera capture • Real photo verification • Analyzed on secure server
              </div>
            </div>
          )}

          {/* Captured Photo Preview Card */}
          {((scanMode === 'plant' && capturedPlantImage) || (scanMode === 'soil' && capturedSoilImage)) && (
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#dce8d5] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-[#144225]">
                    Real Photo Captured ({scanMode === 'plant' ? selectedCrop : 'Soil Surface'})
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCapturedPlantImage(null);
                      setCapturedSoilImage(null);
                      setPlantAnalysisResult(null);
                      setSoilAnalysisResult(null);
                      setImageError(null);
                    }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Remove Photo</span>
                  </button>
                </div>
              </div>

              <div className="relative rounded-2xl overflow-hidden bg-black max-h-[340px] flex items-center justify-center border border-slate-200">
                <img
                  src={scanMode === 'plant' ? capturedPlantImage?.dataUrl : capturedSoilImage?.dataUrl}
                  alt="Captured scan"
                  className="max-h-[340px] w-auto object-contain"
                />
              </div>

              {/* Action Buttons to trigger AI Analysis */}
              {!plantAnalysisResult && !soilAnalysisResult && (
                <div>
                  <button
                    type="button"
                    onClick={scanMode === 'plant' ? handleRunPlantAnalysis : handleRunSoilAnalysis}
                    disabled={isAnalyzing}
                    className="w-full py-3.5 rounded-2xl bg-[#14492a] hover:bg-[#0f3c21] active:scale-95 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-emerald-300" />
                        <span>Analyzing with Gemini AI Vision...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Run AI {scanMode === 'plant' ? 'Plant' : 'Soil'} Analysis</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Analysis Error Alert */}
              {analysisError && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>Analysis Connection Failed</span>
                  </div>
                  <p className="leading-relaxed">{analysisError}</p>
                  <button
                    type="button"
                    onClick={scanMode === 'plant' ? handleRunPlantAnalysis : handleRunSoilAnalysis}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition cursor-pointer"
                  >
                    Try Analysis Again
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ==================== PLANT SCAN RESULTS ==================== */}
          {scanMode === 'plant' && plantAnalysisResult && (
            <div className="space-y-4 animate-in fade-in">
              {/* Unsuitable Warning if photo was invalid */}
              {!plantAnalysisResult.isSuitable && (
                <div className="p-4 rounded-3xl bg-amber-50 border border-amber-300 text-amber-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <span>Insufficient Photo for Reliable Conclusion</span>
                  </div>
                  <p className="text-xs leading-relaxed">
                    {plantAnalysisResult.unsuitableReason ||
                      'The photo is blurry, too dark, or does not clearly display plant foliage. Please retake a sharp photo in natural light.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setCapturedPlantImage(null);
                      setPlantAnalysisResult(null);
                      setImageError(null);
                    }}
                    className="mt-2 px-3.5 py-2 rounded-xl bg-amber-700 text-white text-xs font-bold hover:bg-amber-800 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Clear and Take New Scan</span>
                  </button>
                </div>
              )}

              {plantAnalysisResult.isSuitable && (
                <>
                  {/* Card 1: Visible Observations */}
                  <div className="bg-white rounded-3xl p-5 border border-[#dce8d5] shadow-xs space-y-3">
                    <div className="flex items-center gap-2 text-[#144225]">
                      <Eye className="w-4 h-4 text-emerald-600" />
                      <h4 className="text-sm font-bold font-display">Visible Plant Observations</h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-2xl bg-[#f8faf6] border border-[#dce8d5]">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                          Foliar Condition
                        </span>
                        <p className="text-slate-800 font-medium">
                          {plantAnalysisResult.visibleObservations.foliarCondition}
                        </p>
                      </div>

                      <div className="p-3 rounded-2xl bg-[#f8faf6] border border-[#dce8d5]">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                          Pest / Pathogen Signs
                        </span>
                        <p className="text-slate-800 font-medium">
                          {plantAnalysisResult.visibleObservations.pestOrPathogenSigns}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#f8faf6] border border-[#dce8d5] text-xs">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                        Overall Vigor
                      </span>
                      <p className="text-slate-800 font-medium">
                        {plantAnalysisResult.visibleObservations.overallVigor}
                      </p>
                    </div>
                  </div>

                  {/* Card 2: Possible Explanations (With Explicit Uncertainty) */}
                  <div className="bg-white rounded-3xl p-5 border border-[#dce8d5] shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[#144225]">
                        <HelpCircle className="w-4 h-4 text-emerald-600" />
                        <h4 className="text-sm font-bold font-display">
                          Possible Explanations for Symptoms
                        </h4>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                        Uncertainty Stated
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {plantAnalysisResult.possibleExplanations.map((exp, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-2xl bg-[#fbfdfa] border border-[#dce8d5] space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-[#144225] text-xs sm:text-sm">
                              {exp.cause}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                              Likelihood: {exp.likelihood}
                            </span>
                          </div>
                          <p className="text-slate-700 leading-relaxed">{exp.explanation}</p>
                          <div className="p-2 rounded-xl bg-amber-50/60 border border-amber-200/60 text-[11px] text-amber-900 leading-relaxed">
                            <strong>Note:</strong> {exp.uncertaintyNote}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card 3: Follow-Up Questions for the Farmer */}
                  {plantAnalysisResult.followUpQuestions?.length > 0 && (
                    <div className="bg-white rounded-3xl p-5 border border-[#dce8d5] shadow-xs space-y-3">
                      <div className="flex items-center gap-2 text-[#144225]">
                        <HelpCircle className="w-4 h-4 text-teal-600" />
                        <h4 className="text-sm font-bold font-display">
                          Follow-up Questions on Growing Conditions
                        </h4>
                      </div>
                      <ul className="text-xs text-slate-700 space-y-2 list-disc pl-4 leading-relaxed">
                        {plantAnalysisResult.followUpQuestions.map((q, idx) => (
                          <li key={idx}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Card 4: Practical Next Steps & Prevention */}
                  <div className="bg-white rounded-3xl p-5 border border-[#dce8d5] shadow-xs space-y-3">
                    <div className="flex items-center gap-2 text-[#144225]">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      <h4 className="text-sm font-bold font-display">
                        Practical Next Steps & Prevention
                      </h4>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Immediate Field Actions
                        </span>
                        <ul className="text-slate-700 space-y-1.5 list-disc pl-4 leading-relaxed">
                          {plantAnalysisResult.practicalNextSteps.map((s, idx) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ul>
                      </div>

                      {plantAnalysisResult.preventionGuidance?.length > 0 && (
                        <div className="pt-2 border-t border-slate-100">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                            Prevention Guidance
                          </span>
                          <ul className="text-slate-700 space-y-1.5 list-disc pl-4 leading-relaxed">
                            {plantAnalysisResult.preventionGuidance.map((p, idx) => (
                              <li key={idx}>{p}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card 5: Mandatory Scientific Transparency Warning */}
                  <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5 leading-relaxed">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Important Agronomic Notice</span>
                    </div>
                    <p>
                      {plantAnalysisResult.scientificCaution ||
                        'Visual inspection provides advisory observations and is not a definitive laboratory plant disease diagnosis. Do not apply synthetic chemicals without consulting official product label directions or certified local agricultural officers (KVK).'}
                    </p>
                  </div>

                  {/* Feedback Messages */}
                  {saveSuccessMessage && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{saveSuccessMessage}</span>
                    </div>
                  )}

                  {saveErrorMessage && (
                    <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>{saveErrorMessage}</span>
                    </div>
                  )}

                  {/* Action Bar: Save to History & Discuss with AI Advisor */}
                  <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={handleSavePlantRecord}
                      disabled={isSaving || Boolean(savedScanId)}
                      className="flex-1 py-3.5 px-4 rounded-2xl bg-[#14492a] hover:bg-[#0f3c21] active:scale-95 text-white text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <BookmarkPlus className="w-4 h-4" />
                      <span>{savedScanId ? 'Saved to Farm History' : 'Save to Farm History'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleShareWithAdvisor(
                          'plant',
                          `Plant Scan for ${selectedCrop} at ${selectedField}: ${plantAnalysisResult.visibleObservations.foliarCondition}. Potential explanations: ${plantAnalysisResult.possibleExplanations.map((e) => e.cause).join(', ')}.`,
                          capturedPlantImage?.dataUrl
                        )
                      }
                      className="py-3.5 px-5 rounded-2xl bg-[#eef6ec] hover:bg-[#e2f0df] text-[#14492a] border border-[#cbe1c7] text-xs font-bold transition flex items-center justify-center gap-2"
                    >
                      <Bot className="w-4 h-4 text-emerald-700" />
                      <span>Discuss with AI Advisor</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ==================== SOIL SCAN RESULTS ==================== */}
          {scanMode === 'soil' && soilAnalysisResult && (
            <div className="space-y-4 animate-in fade-in">
              {!soilAnalysisResult.isSuitable && (
                <div className="p-4 rounded-3xl bg-amber-50 border border-amber-300 text-amber-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <span>Insufficient Photo for Soil Analysis</span>
                  </div>
                  <p className="text-xs leading-relaxed">
                    {soilAnalysisResult.unsuitableReason ||
                      'The photo does not clearly show soil surface texture. Please retake a clear photo 15-20cm from the soil in good daylight.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setCapturedSoilImage(null);
                      setSoilAnalysisResult(null);
                      setImageError(null);
                    }}
                    className="mt-2 px-3.5 py-2 rounded-xl bg-amber-700 text-white text-xs font-bold hover:bg-amber-800 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Clear and Take New Scan</span>
                  </button>
                </div>
              )}

              {soilAnalysisResult.isSuitable && (
                <>
                  {/* Card 1: Visible Soil Characteristics */}
                  <div className="bg-white rounded-3xl p-5 border border-[#dce8d5] shadow-xs space-y-3">
                    <div className="flex items-center gap-2 text-[#144225]">
                      <Eye className="w-4 h-4 text-emerald-600" />
                      <h4 className="text-sm font-bold font-display">Visible Soil Characteristics</h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-2xl bg-[#f8faf6] border border-[#dce8d5]">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                          Apparent Color
                        </span>
                        <p className="text-slate-800 font-medium">
                          {soilAnalysisResult.visibleObservations.apparentColor}
                        </p>
                      </div>

                      <div className="p-3 rounded-2xl bg-[#f8faf6] border border-[#dce8d5]">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                          Visible Texture & Aggregates
                        </span>
                        <p className="text-slate-800 font-medium">
                          {soilAnalysisResult.visibleObservations.visibleTextureParticles}
                        </p>
                      </div>

                      <div className="p-3 rounded-2xl bg-[#f8faf6] border border-[#dce8d5]">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                          Surface Moisture Appearance (Visual Estimate)
                        </span>
                        <p className="text-slate-800 font-medium">
                          {soilAnalysisResult.visibleObservations.surfaceMoistureAppearance}
                        </p>
                      </div>

                      <div className="p-3 rounded-2xl bg-[#f8faf6] border border-[#dce8d5]">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                          Coarse Fragments / Stones
                        </span>
                        <p className="text-slate-800 font-medium">
                          {soilAnalysisResult.visibleObservations.coarseFragmentsStones}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Possible Concerns (Visual Estimates) */}
                  <div className="bg-white rounded-3xl p-5 border border-[#dce8d5] shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[#144225]">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <h4 className="text-sm font-bold font-display">
                          Possible Soil Inferences & Concerns
                        </h4>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                        Visual Estimates Only
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {soilAnalysisResult.possibleCharacteristics.map((char, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-2xl bg-[#fbfdfa] border border-[#dce8d5] space-y-1.5 text-xs"
                        >
                          <span className="font-bold text-[#144225] block">{char.characteristic}</span>
                          <p className="text-slate-700 leading-relaxed">{char.explanation}</p>
                          <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-200/60 text-[11px] text-amber-900 leading-relaxed">
                            <strong>Estimate Limitation:</strong> {char.uncertaintyNote}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card 3: Recommended Follow-Up Tests & Practical Next Steps */}
                  <div className="bg-white rounded-3xl p-5 border border-[#dce8d5] shadow-xs space-y-3">
                    <div className="flex items-center gap-2 text-[#144225]">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      <h4 className="text-sm font-bold font-display">
                        Recommended Follow-Up Tests & Steps
                      </h4>
                    </div>
                    <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-4 leading-relaxed">
                      {soilAnalysisResult.recommendedNextSteps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Card 4: Strict Scientific Transparency Notice (Per Requirement 4) */}
                  <div className="p-4 rounded-3xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-2 leading-relaxed">
                    <div className="flex items-center gap-2 font-bold text-amber-900">
                      <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>Scientific Measurement Transparency</span>
                    </div>
                    <p>
                      {soilAnalysisResult.soilTestNeededReminder ||
                        'A photo alone cannot measure soil pH, NPK nutrient levels, moisture percentage, or overall chemical fertility. Numerical measurements are never fabricated. To obtain true nutrient values, send a composite soil sample to an official Soil Testing Laboratory (Soil Health Card) or your local Krishi Vigyan Kendra (KVK).'}
                    </p>
                  </div>

                  {/* Feedback Messages */}
                  {saveSuccessMessage && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{saveSuccessMessage}</span>
                    </div>
                  )}

                  {saveErrorMessage && (
                    <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>{saveErrorMessage}</span>
                    </div>
                  )}

                  {/* Action Bar: Save & Discuss with AI Advisor */}
                  <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={handleSaveSoilRecord}
                      disabled={isSaving || Boolean(savedScanId)}
                      className="flex-1 py-3.5 px-4 rounded-2xl bg-[#14492a] hover:bg-[#0f3c21] active:scale-95 text-white text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <BookmarkPlus className="w-4 h-4" />
                      <span>{savedScanId ? 'Saved to Farm History' : 'Save to Farm History'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleShareWithAdvisor(
                          'soil',
                          `Soil Scan at ${selectedField}: Apparent color: ${soilAnalysisResult.visibleObservations.apparentColor}. Texture: ${soilAnalysisResult.visibleObservations.visibleTextureParticles}. Recommended follow-up: ${soilAnalysisResult.recommendedNextSteps.join(', ')}.`,
                          capturedSoilImage?.dataUrl
                        )
                      }
                      className="py-3.5 px-5 rounded-2xl bg-[#eef6ec] hover:bg-[#e2f0df] text-[#14492a] border border-[#cbe1c7] text-xs font-bold transition flex items-center justify-center gap-2"
                    >
                      <Bot className="w-4 h-4 text-emerald-700" />
                      <span>Discuss with AI Advisor</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ==================== VIEW 2: HISTORY ==================== */}
      {activeScreenTab === 'history' && (
        <div className="space-y-4">
          {/* Sub-tab Switcher: Plant Scans vs Soil Scans */}
          <div className="flex items-center gap-2 p-1 bg-[#f4f7f2] rounded-2xl border border-[#dbe6d5] max-w-sm">
            <button
              onClick={() => setHistorySubTab('plant')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                historySubTab === 'plant'
                  ? 'bg-[#14492a] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sprout className="w-3.5 h-3.5" />
              <span>Plant Scans ({plantScansList.length})</span>
            </button>

            <button
              onClick={() => setHistorySubTab('soil')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                historySubTab === 'soil'
                  ? 'bg-[#14492a] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Soil Scans ({soilScansList.length})</span>
            </button>
          </div>

          {/* Plant Scans List */}
          {historySubTab === 'plant' && (
            <div className="space-y-3">
              {plantScansList.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-3xl border border-[#dce8d5] space-y-2">
                  <Sprout className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No plant scans saved yet</p>
                  <p className="text-[11px] text-slate-400">
                    Capture a plant leaf photo in New Scan mode to analyze symptoms and save records.
                  </p>
                </div>
              ) : (
                plantScansList.map((record) => (
                  <div
                    key={record.id}
                    className="p-4 bg-white rounded-2xl border border-[#dce8d5] shadow-xs flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {record.photoUrl ? (
                        <img
                          src={record.photoUrl}
                          alt="Plant scan"
                          className="w-12 h-12 object-cover rounded-xl border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                          <Sprout className="w-6 h-6" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="font-bold text-[#144225] block truncate text-sm">
                          {record.cropName || 'Crop Scan'} • {record.fieldName}
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate">
                          {record.date} • {record.observations}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setSelectedHistoryPlant(record)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] transition"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDeletePlantScan(record.id, `${record.cropName || 'Crop'} Leaf Scan (${record.date})`)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 transition"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Soil Scans List */}
          {historySubTab === 'soil' && (
            <div className="space-y-3">
              {soilScansList.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-3xl border border-[#dce8d5] space-y-2">
                  <Layers className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No soil scans saved yet</p>
                  <p className="text-[11px] text-slate-400">
                    Capture a soil surface photo to save texture assessments.
                  </p>
                </div>
              ) : (
                soilScansList.map((record) => (
                  <div
                    key={record.id}
                    className="p-4 bg-white rounded-2xl border border-[#dce8d5] shadow-xs flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {record.soilPhotoUrl ? (
                        <img
                          src={record.soilPhotoUrl}
                          alt="Soil scan"
                          className="w-12 h-12 object-cover rounded-xl border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                          <Layers className="w-6 h-6" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="font-bold text-[#144225] block truncate text-sm">
                          {record.fieldName} • Soil Assessment
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate">
                          {record.date} • {record.observations}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setSelectedHistorySoil(record)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] transition"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDeleteSoilScan(record.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 transition"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* ==================== VIEW 3: AI ADVISOR ==================== */}
      {activeScreenTab === 'advisor' && (
        <AiAdvisorView
          language={language}
          locationName={locationDisplay}
          sharedScanContext={advisorSharedScan}
          onClearSharedScan={() => setAdvisorSharedScan(null)}
        />
      )}

      {/* ==================== DETAIL MODALS FOR HISTORY ==================== */}
      {/* Plant Scan History Detail Modal */}
      {selectedHistoryPlant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sprout className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-sm text-[#144225]">
                  {selectedHistoryPlant.cropName || 'Crop'} Scan Details
                </h3>
              </div>
              <button
                onClick={() => setSelectedHistoryPlant(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedHistoryPlant.photoUrl && (
              <img
                src={selectedHistoryPlant.photoUrl}
                alt="Plant detail"
                className="w-full max-h-48 object-cover rounded-2xl border border-slate-200"
              />
            )}

            <div className="text-xs space-y-2">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Field & Date</span>
                <span className="font-semibold text-slate-800">
                  {selectedHistoryPlant.fieldName} • {selectedHistoryPlant.date}
                </span>
              </div>

              {selectedHistoryPlant.aiAnalysis && (
                <>
                  <div className="p-3 bg-[#f8faf6] rounded-xl border border-[#dce8d5] space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Observations
                    </span>
                    <p className="text-slate-800 leading-relaxed font-medium">
                      {selectedHistoryPlant.aiAnalysis.visibleObservations?.foliarCondition}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Possible Explanations
                    </span>
                    {selectedHistoryPlant.aiAnalysis.possibleExplanations?.map((exp, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                        <span className="font-bold text-[#144225] block">{exp.cause}</span>
                        <p className="text-slate-600">{exp.explanation}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  handleShareWithAdvisor(
                    'plant',
                    `Historical Plant Scan for ${selectedHistoryPlant.cropName} on ${selectedHistoryPlant.date}: ${selectedHistoryPlant.observations}`,
                    selectedHistoryPlant.photoUrl
                  );
                  setSelectedHistoryPlant(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#14492a] hover:bg-[#0f3c21] text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Bot className="w-4 h-4 text-emerald-300" />
                <span>Discuss with AI Advisor</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedHistoryPlant(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Soil Scan History Detail Modal */}
      {selectedHistorySoil && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-sm text-[#144225]">
                  Soil Scan Details ({selectedHistorySoil.fieldName})
                </h3>
              </div>
              <button
                onClick={() => setSelectedHistorySoil(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedHistorySoil.soilPhotoUrl && (
              <img
                src={selectedHistorySoil.soilPhotoUrl}
                alt="Soil detail"
                className="w-full max-h-48 object-cover rounded-2xl border border-slate-200"
              />
            )}

            <div className="text-xs space-y-2">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Field & Date</span>
                <span className="font-semibold text-slate-800">
                  {selectedHistorySoil.fieldName} • {selectedHistorySoil.date}
                </span>
              </div>

              {selectedHistorySoil.aiAnalysis && (
                <>
                  <div className="p-3 bg-[#f8faf6] rounded-xl border border-[#dce8d5] space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Apparent Color & Texture
                    </span>
                    <p className="text-slate-800 leading-relaxed font-medium">
                      Color: {selectedHistorySoil.aiAnalysis.visibleObservations?.apparentColor}. Texture: {selectedHistorySoil.aiAnalysis.visibleObservations?.visibleTextureParticles}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 text-amber-900 text-[11px] leading-relaxed border border-amber-200">
                    <strong>Notice:</strong> Soil measurements (pH, NPK) require official laboratory testing. Visual assessments are estimates only.
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  handleShareWithAdvisor(
                    'soil',
                    `Historical Soil Scan for ${selectedHistorySoil.fieldName} on ${selectedHistorySoil.date}: ${selectedHistorySoil.observations}`,
                    selectedHistorySoil.soilPhotoUrl
                  );
                  setSelectedHistorySoil(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#14492a] hover:bg-[#0f3c21] text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Bot className="w-4 h-4 text-emerald-300" />
                <span>Discuss with AI Advisor</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedHistorySoil(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
