import React, { useState, useRef, useEffect } from 'react';
import { 
  ScanLine, 
  Camera, 
  Upload, 
  AlertCircle, 
  CheckCircle2, 
  RotateCcw,
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
  AlertTriangle
} from 'lucide-react';
import { 
  SoilType, 
  SoilScanRecord, 
  SupportedLanguage, 
  FarmerProfile, 
  CropRecord, 
  SoilAiAnalysis 
} from '../types';
import { TRANSLATIONS } from '../constants/translations';
import { storageService } from '../services/storage';
import { soilScanService, ImageProcessResult } from '../services/soilScanService';

interface SoilScanScreenProps {
  onSavedRecord: () => void;
  language: SupportedLanguage;
  profile?: FarmerProfile;
  crops?: CropRecord[];
  savedScans?: SoilScanRecord[];
}

const COMMON_SOIL_TYPES: SoilType[] = [
  'Alluvial Soil',
  'Black Soil (Regur)',
  'Red and Yellow Soil',
  'Laterite Soil',
  'Sandy Loam',
  'Clay Loam',
  'Mountain / Forest Soil',
];

export const SoilScanScreen: React.FC<SoilScanScreenProps> = ({
  onSavedRecord,
  language,
  profile,
  crops = [],
  savedScans: externalScans,
}) => {
  const t = TRANSLATIONS[language]?.soilScan || TRANSLATIONS.en.soilScan;

  // Screen View Mode: 'scanner' | 'history'
  const [viewMode, setViewMode] = useState<'scanner' | 'history'>('scanner');

  // Input references for mobile Camera vs Gallery file pickers
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  // Live Camera stream modal state (in-browser viewfinder option)
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraPermissionError, setCameraPermissionError] = useState<string | null>(null);

  // Field & Farm Context State
  const defaultField = crops.length > 0 ? crops[0].fieldName : 'Plot 1 (Main Field)';
  const [selectedField, setSelectedField] = useState<string>(defaultField);
  const [customFieldName, setCustomFieldName] = useState<string>('');
  const [isCustomField, setIsCustomField] = useState<boolean>(false);

  // Selected Photo State
  const [selectedImage, setSelectedImage] = useState<ImageProcessResult | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [aiUnavailable, setAiUnavailable] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<SoilAiAnalysis | null>(null);

  // Manual Checklist State (Offered when AI is unavailable or as optional fallback)
  const [showManualChecklist, setShowManualChecklist] = useState<boolean>(false);
  const [manualColor, setManualColor] = useState<string>('Dark Brown / Black');
  const [manualTexture, setManualTexture] = useState<string>('Crumbly / Granular Loam');
  const [manualStones, setManualStones] = useState<string>('Occasional small gravel');
  const [manualMoisture, setManualMoisture] = useState<'Dry' | 'Moist / Optimal' | 'Wet / Saturated'>('Moist / Optimal');
  const [manualDrainage, setManualDrainage] = useState<'Well-Drained' | 'Moderate' | 'Poor / Waterlogged'>('Well-Drained');
  const [manualNotes, setManualNotes] = useState<string>('');

  // Save State
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [currentSavedId, setCurrentSavedId] = useState<string | null>(null);

  // Full Photo Modal View
  const [previewModalOpen, setPreviewModalOpen] = useState<boolean>(false);

  // History Detail Modal
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<SoilScanRecord | null>(null);

  // Local scan history list state
  const [localScans, setLocalScans] = useState<SoilScanRecord[]>(() => {
    return externalScans && externalScans.length > 0 ? externalScans : storageService.getSoilScans();
  });

  useEffect(() => {
    if (externalScans) {
      setLocalScans(externalScans);
    }
  }, [externalScans]);

  // Clean up live camera stream when closed
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // Handle file selection from camera or gallery input
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError(null);
    setAnalysisError(null);
    setAnalysisResult(null);
    setSaveSuccessMessage(null);
    setSaveErrorMessage(null);
    setCurrentSavedId(null);

    // Validate file
    const validation = soilScanService.validateImageFile(file);
    if (!validation.valid) {
      setImageError(validation.error || 'Invalid file.');
      e.target.value = '';
      return;
    }

    try {
      setIsProcessingImage(true);
      const processed = await soilScanService.processImageFile(file);
      setSelectedImage(processed);
    } catch (err: any) {
      setImageError(err.message || 'Failed to process selected image.');
    } finally {
      setIsProcessingImage(false);
      e.target.value = '';
    }
  };

  // Open native camera input
  const handleTriggerNativeCamera = () => {
    setImageError(null);
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  // Open gallery picker input
  const handleTriggerGallery = () => {
    setImageError(null);
    if (galleryInputRef.current) {
      galleryInputRef.current.click();
    }
  };

  // Live in-app camera stream launcher
  const handleStartLiveCamera = async () => {
    setImageError(null);
    setCameraPermissionError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      // Fallback to native camera file input
      handleTriggerNativeCamera();
      return;
    }

    try {
      setIsLiveCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Camera stream error, falling back to camera file picker:', err);
      setIsLiveCameraOpen(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setImageError('Camera permission was denied. You can use the "Take Photo" or "Upload from Gallery" buttons instead.');
      } else {
        // Fallback directly to native camera picker
        handleTriggerNativeCamera();
      }
    }
  };

  // Capture frame from live camera viewfinder
  const handleCaptureLiveFrame = async () => {
    if (!videoRef.current) return;

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not access canvas context');

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const base64Data = dataUrl.split(',')[1] || '';

      // Stop camera stream
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
        setCameraStream(null);
      }
      setIsLiveCameraOpen(false);

      setSelectedImage({
        base64: base64Data,
        mimeType: 'image/jpeg',
        dataUrl,
        width: canvas.width,
        height: canvas.height,
        sizeBytes: Math.round((base64Data.length * 3) / 4),
        fileName: `soil_camera_${Date.now()}.jpg`,
      });
    } catch (err: any) {
      setImageError(err.message || 'Failed to capture frame from camera.');
      setIsLiveCameraOpen(false);
    }
  };

  const handleCloseLiveCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsLiveCameraOpen(false);
  };

  // Remove photo action
  const handleRemovePhoto = () => {
    setSelectedImage(null);
    setImageError(null);
    setAnalysisError(null);
    setAnalysisResult(null);
    setSaveSuccessMessage(null);
    setSaveErrorMessage(null);
    setCurrentSavedId(null);
  };

  // Trigger AI Soil Analysis
  const handleAnalyzeSoil = async () => {
    if (!selectedImage) {
      setImageError('Please take or upload a soil photograph before starting analysis.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAiUnavailable(false);
    setSaveSuccessMessage(null);
    setSaveErrorMessage(null);

    const actualFieldName = isCustomField && customFieldName.trim()
      ? customFieldName.trim()
      : selectedField;

    const farmContext = {
      fieldName: actualFieldName,
      villageOrDistrict: profile?.villageOrDistrict || 'Vijayapura',
      state: profile?.state || 'Karnataka',
      primarySoilType: profile?.primarySoilType || 'Black Soil (Regur)',
    };

    try {
      const result = await soilScanService.analyzeSoilPhoto(
        selectedImage.base64,
        selectedImage.mimeType,
        farmContext
      );

      if (result.success && result.analysis) {
        setAnalysisResult(result.analysis);
      } else {
        setAnalysisError(result.error || 'Failed to analyze soil photo.');
        if (result.aiUnavailable) {
          setAiUnavailable(true);
        }
      }
    } catch (err: any) {
      setAnalysisError(err.message || 'Network error while analyzing soil photo.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Save Scan to History and Local Storage
  const handleSaveScan = async () => {
    if (!selectedImage && !analysisResult) {
      setSaveErrorMessage('Cannot save scan without image or observations.');
      return;
    }

    setIsSaving(true);
    setSaveSuccessMessage(null);
    setSaveErrorMessage(null);

    const actualFieldName = isCustomField && customFieldName.trim()
      ? customFieldName.trim()
      : selectedField;

    try {
      // Create thumbnail for fast storage
      const photoThumb = selectedImage
        ? await soilScanService.createStorageThumbnail(selectedImage.dataUrl, 360)
        : undefined;

      const recordId = currentSavedId || `soil-scan-${Date.now()}`;

      const newScan: SoilScanRecord = {
        id: recordId,
        date: new Date().toISOString().split('T')[0],
        fieldName: actualFieldName,
        soilPhotoUrl: photoThumb || selectedImage?.dataUrl,
        knownSoilType: profile?.primarySoilType || 'Black Soil (Regur)',
        soilMoisture: analysisResult?.visibleObservations
          ? (analysisResult.visibleObservations.surfaceMoistureAppearance.toLowerCase().includes('dry') ? 'Dry' : 'Moist / Optimal')
          : manualMoisture,
        fieldDrainage: manualDrainage,
        observations: analysisResult?.visibleObservations
          ? `${analysisResult.visibleObservations.apparentColor}. ${analysisResult.visibleObservations.visibleTextureParticles}.`
          : `${manualColor}. ${manualTexture}. ${manualNotes}`,
        aiAnalysis: analysisResult || undefined,
        isAiAnalyzed: Boolean(analysisResult && analysisResult.isSuitable),
        farmContext: {
          villageOrDistrict: profile?.villageOrDistrict || 'Vijayapura',
          state: profile?.state || 'Karnataka',
          primarySoilType: profile?.primarySoilType || 'Black Soil (Regur)',
        },
        isLabVerified: false,
        notes: analysisResult
          ? `Visual scan via AGROVA Vision. Next: ${analysisResult.recommendedNextSteps?.[0] || 'Soil testing'}`
          : manualNotes || 'Manual farmer visual observation.',
      };

      const savedOk = storageService.saveSoilScan(newScan);

      if (savedOk) {
        setCurrentSavedId(recordId);
        setSaveSuccessMessage('Scan successfully saved to your farm records!');
        onSavedRecord();
        setLocalScans(storageService.getSoilScans());
      } else {
        setSaveErrorMessage('Could not save to device storage. Please check if browser storage is full.');
      }
    } catch (err: any) {
      setSaveErrorMessage(err.message || 'Failed to save scan record.');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to start a new scan
  const handleStartNewScan = () => {
    setSelectedImage(null);
    setAnalysisResult(null);
    setImageError(null);
    setAnalysisError(null);
    setAiUnavailable(false);
    setSaveSuccessMessage(null);
    setSaveErrorMessage(null);
    setCurrentSavedId(null);
    setShowManualChecklist(false);
    setViewMode('scanner');
  };

  // Delete scan from history
  const handleDeleteScan = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    storageService.deleteSoilScan(id);
    const updated = storageService.getSoilScans();
    setLocalScans(updated);
    onSavedRecord();
    if (selectedHistoryItem?.id === id) {
      setSelectedHistoryItem(null);
    }
  };

  const actualFieldNameDisplay = isCustomField && customFieldName.trim()
    ? customFieldName.trim()
    : selectedField;

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-150">
      {/* Hidden Mobile Native File Inputs */}
      {/* Camera Capture Input (launches native rear camera on mobile devices) */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* Gallery / File Picker Input */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* Top Header Card & View Mode Switcher */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#dce8d5] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#e5f3e2] flex items-center justify-center text-[#124429] border border-[#cfe2ca] shrink-0">
              <ScanLine className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-[#113d23] font-display">
                {t.title}
              </h1>
              <p className="text-xs text-[#526d57]">
                Visual topsoil inspection & in-field surface analysis
              </p>
            </div>
          </div>

          {/* Tab Selector: Scanner vs History */}
          <div className="flex items-center gap-1 p-1 bg-[#f3f7f0] rounded-2xl self-start sm:self-auto border border-[#e1ecdd]">
            <button
              onClick={() => setViewMode('scanner')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 min-h-[36px] ${
                viewMode === 'scanner'
                  ? 'bg-white text-[#14492a] shadow-2xs'
                  : 'text-[#4c6953] hover:text-[#113d23]'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Soil Scanner</span>
            </button>

            <button
              onClick={() => setViewMode('history')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 min-h-[36px] ${
                viewMode === 'history'
                  ? 'bg-white text-[#14492a] shadow-2xs'
                  : 'text-[#4c6953] hover:text-[#113d23]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>History ({localScans.length})</span>
            </button>
          </div>
        </div>

        {/* Scientific Transparency Notice */}
        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#fefce8] border border-[#fef08a] text-xs text-[#713f12]">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5 leading-relaxed">
            <span className="font-bold text-amber-900 block">Scientific Transparency Notice</span>
            <p className="text-[11px] text-amber-900/95 leading-normal">
              Visual analysis examines <strong>observable surface characteristics only</strong> (color, coarse fragments, clod aggregation, surface moisture). It <strong>cannot</strong> determine chemical nutrients, soil pH, or exact NPK values without a laboratory Soil Health Card.
            </p>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: SOIL SCANNER */}
      {viewMode === 'scanner' && (
        <div className="space-y-4">
          {/* Farm Context & Field Selector Card */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#dce8d5] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs sm:text-sm font-bold text-[#144225] font-display flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-700" />
                <span>Field & Farm Context</span>
              </h2>
              <span className="text-[10px] text-slate-500 font-medium">Context Only</span>
            </div>

            {/* Saved Farm Context Indicator */}
            <div className="p-2.5 rounded-xl bg-[#f5f9f2] border border-[#dbe8d5] text-xs text-[#2c4734] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  <strong>Saved Farm:</strong> {profile?.farmName || 'My Farm'} • {profile?.villageOrDistrict || 'Vijayapura'}, {profile?.state || 'Karnataka'}
                </span>
              </div>
              <span className="text-[11px] text-[#4d7256] italic">
                Reference soil: {profile?.primarySoilType || 'Black Soil (Regur)'}
              </span>
            </div>

            {/* Multi-field selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Field / Plot for this Scan
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  value={isCustomField ? 'custom' : selectedField}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setIsCustomField(true);
                    } else {
                      setIsCustomField(false);
                      setSelectedField(e.target.value);
                    }
                  }}
                  className="w-full text-xs bg-white border border-[#d2e2cb] rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {crops.map((c) => (
                    <option key={c.id} value={c.fieldName}>
                      {c.fieldName} ({c.name})
                    </option>
                  ))}
                  <option value="Plot 1 (Main Field)">Plot 1 (Main Field)</option>
                  <option value="North Plot (Canal)">North Plot (Canal)</option>
                  <option value="Central Garden Plot">Central Garden Plot</option>
                  <option value="East Ridge Plot">East Ridge Plot</option>
                  <option value="custom">+ Enter Custom Plot Name...</option>
                </select>

                {isCustomField && (
                  <input
                    type="text"
                    value={customFieldName}
                    onChange={(e) => setCustomFieldName(e.target.value)}
                    placeholder="Enter custom plot identifier..."
                    className="w-full text-xs bg-white border border-[#d2e2cb] rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    autoFocus
                  />
                )}
              </div>
            </div>
          </div>

          {/* Photo Capture & Preview Card */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#dce8d5] shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs sm:text-sm font-bold text-[#144225] font-display flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-700" />
                <span>Soil Photograph</span>
              </h2>
              <span className="text-[11px] text-slate-500">
                {selectedImage ? 'Image Selected' : 'Required'}
              </span>
            </div>

            {/* Error Message if image invalid */}
            {imageError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <p>{imageError}</p>
              </div>
            )}

            {/* Image Preview Area */}
            {selectedImage ? (
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden border border-[#cfe2ca] bg-slate-900 aspect-16/10 flex items-center justify-center shadow-inner group">
                  <img
                    src={selectedImage.dataUrl}
                    alt="Selected soil sample preview"
                    className="w-full h-full object-cover"
                  />

                  {/* Dimension & size badge */}
                  <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-xs text-[10px] text-white font-mono flex items-center gap-2">
                    <span>{selectedImage.width}×{selectedImage.height}px</span>
                    <span>•</span>
                    <span>{(selectedImage.sizeBytes / 1024).toFixed(0)} KB</span>
                  </div>

                  {/* Expand / View Full */}
                  <button
                    type="button"
                    onClick={() => setPreviewModalOpen(true)}
                    className="absolute top-2 right-2 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white transition backdrop-blur-xs"
                    title="View Full Size"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Retake, Change, and Remove Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={handleTriggerNativeCamera}
                    disabled={isAnalyzing}
                    className="py-2.5 px-2 rounded-xl bg-white border border-[#d2e2cb] text-[#14492a] hover:bg-[#edf5e9] transition text-xs font-bold flex items-center justify-center gap-1.5 min-h-[44px] shadow-2xs disabled:opacity-50"
                  >
                    <Camera className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Retake</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTriggerGallery}
                    disabled={isAnalyzing}
                    className="py-2.5 px-2 rounded-xl bg-white border border-[#d2e2cb] text-[#14492a] hover:bg-[#edf5e9] transition text-xs font-bold flex items-center justify-center gap-1.5 min-h-[44px] shadow-2xs disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Change</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={isAnalyzing}
                    className="py-2.5 px-2 rounded-xl bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 transition text-xs font-bold flex items-center justify-center gap-1.5 min-h-[44px] shadow-2xs disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Photo Selection Launchers */
              <div className="space-y-3">
                <div className="p-5 sm:p-6 rounded-2xl border-2 border-dashed border-[#cfe2ca] bg-[#f9fbf8] text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#e5f3e2] flex items-center justify-center text-emerald-700 mx-auto border border-[#cfe2ca]">
                    <Camera className="w-6 h-6" />
                  </div>

                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-[#14492a]">
                      Capture Topsoil Photo in Natural Daylight
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                      Hold phone approximately 20–30 cm above undisturbed soil. Ensure the soil is in focus with minimal hand blur.
                    </p>
                  </div>

                  {/* Primary Mobile Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 max-w-md mx-auto">
                    {/* Take Photo Action */}
                    <button
                      type="button"
                      onClick={handleTriggerNativeCamera}
                      disabled={isProcessingImage}
                      className="py-3 px-4 rounded-xl bg-[#14492a] hover:bg-[#0e3a20] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs min-h-[48px] active:scale-98"
                    >
                      <Camera className="w-4 h-4 text-emerald-300" />
                      <span>Take Photo (Camera)</span>
                    </button>

                    {/* Upload from Gallery Action */}
                    <button
                      type="button"
                      onClick={handleTriggerGallery}
                      disabled={isProcessingImage}
                      className="py-3 px-4 rounded-xl bg-white border border-[#cfe2ca] hover:bg-[#f1f7ef] text-[#14492a] text-xs font-bold transition flex items-center justify-center gap-2 shadow-2xs min-h-[48px] active:scale-98"
                    >
                      <Upload className="w-4 h-4 text-emerald-700" />
                      <span>Upload from Gallery</span>
                    </button>
                  </div>

                  {/* Secondary Live Web Camera Viewfinder button (if device supports) */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleStartLiveCamera}
                      className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 underline underline-offset-2 inline-flex items-center gap-1"
                    >
                      <span>Or launch in-app camera viewfinder</span>
                    </button>
                  </div>
                </div>

                {isProcessingImage && (
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-900 text-xs flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-700" />
                    <span>Preparing image preview...</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Button: Analyse Soil */}
          {!analysisResult && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleAnalyzeSoil}
                disabled={!selectedImage || isAnalyzing || isProcessingImage}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#14492a] to-[#0d3b1f] hover:from-[#0f3e23] hover:to-[#092d17] text-white text-sm font-extrabold transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[50px] active:scale-98"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-300" />
                    <span>Analyzing Soil Photograph with Gemini Vision...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-300" />
                    <span>{selectedImage ? 'Analyse Soil Photo' : 'Select or Take Photo to Analyse'}</span>
                  </>
                )}
              </button>

              {!selectedImage && (
                <p className="text-[11px] text-center text-slate-500">
                  Take or choose a photo of your field soil above to activate visual analysis.
                </p>
              )}
            </div>
          )}

          {/* Error Banner & Fallback to Manual Checklist */}
          {analysisError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-900 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="block text-red-950 font-bold">Analysis Could Not Complete</strong>
                  <p className="leading-relaxed">{analysisError}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 pt-1 border-t border-red-200">
                <button
                  type="button"
                  onClick={handleAnalyzeSoil}
                  disabled={isAnalyzing}
                  className="w-full sm:w-auto py-2 px-3 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Analysis</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowManualChecklist(true)}
                  className="w-full sm:w-auto py-2 px-3 rounded-xl bg-white border border-red-300 text-red-800 font-bold text-xs hover:bg-red-50 transition text-center"
                >
                  Use Manual Observation Checklist
                </button>
              </div>
            </div>
          )}

          {/* Unsuitable Image Warning Card (when photo is blurry/not soil) */}
          {analysisResult && !analysisResult.isSuitable && (
            <div className="p-4 sm:p-5 bg-amber-50 border border-amber-200 rounded-3xl space-y-3 text-xs text-amber-900">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-extrabold text-amber-950 text-sm font-display">
                    Photo Not Suitable for Soil Analysis
                  </h3>
                  <p className="leading-relaxed text-amber-900">
                    {analysisResult.unsuitableReason || 'The photograph is too blurry, dark, or does not clearly display surface soil.'}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-white/70 rounded-2xl border border-amber-200 space-y-1.5">
                <span className="font-bold text-amber-950 block">Tips for a Good Soil Photo:</span>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-900">
                  <li>Hold the camera steady in direct daylight without deep shadows.</li>
                  <li>Clear loose dry leaves on the surface to expose the soil crumb structure.</li>
                  <li>Maintain 20–30 cm distance so clods and gravel are sharply focused.</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleTriggerNativeCamera}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#14492a] text-white font-bold text-xs hover:bg-[#0e3a20] transition flex items-center justify-center gap-1.5 min-h-[44px]"
                >
                  <Camera className="w-4 h-4 text-emerald-300" />
                  <span>Retake Clear Photo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowManualChecklist(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-white border border-[#d2e2cb] text-[#14492a] font-bold text-xs hover:bg-[#edf5e9] transition text-center min-h-[44px]"
                >
                  Fill In Manual Checklist Instead
                </button>
              </div>
            </div>
          )}

          {/* RESULTS SCREEN (When analysis is successful and suitable) */}
          {analysisResult && analysisResult.isSuitable && (
            <div className="space-y-4 pt-2">
              {/* Results Header Card */}
              <div className="bg-gradient-to-br from-[#124429] via-[#0f3e25] to-[#0a2c19] rounded-3xl p-4 sm:p-5 text-white shadow-md space-y-3 border border-[#1b5735]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/15 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                      <span>Visual Inspection Complete</span>
                    </span>
                    <span className="text-[11px] text-emerald-200 truncate">
                      {actualFieldNameDisplay}
                    </span>
                  </div>

                  <span className="text-[10px] text-emerald-300">
                    Model: {analysisResult.modelUsed || 'Gemini Vision (Verified)'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs text-emerald-200 uppercase tracking-wider block">
                      Apparent Visual Color & Surface
                    </span>
                    <h2 className="text-lg sm:text-xl font-black font-display text-white mt-0.5">
                      {analysisResult.visibleObservations.apparentColor}
                    </h2>
                  </div>

                  <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 text-xs text-emerald-100 self-stretch sm:self-auto text-center">
                    <span className="text-[10px] block opacity-80 uppercase">Confidence</span>
                    <span className="font-bold">{analysisResult.limitationsAndConfidence.confidenceLevel}</span>
                  </div>
                </div>
              </div>

              {/* 1. Visible Observations Card */}
              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#dce8d5] shadow-xs space-y-3">
                <h3 className="text-xs sm:text-sm font-bold text-[#144225] font-display flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-700" />
                  <span>Direct Visible Observations (From Photograph)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 rounded-2xl bg-[#f8faf6] border border-[#dce8d5] space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      Observed Particle Texture & Aggregates
                    </span>
                    <p className="text-slate-800 font-medium leading-relaxed">
                      {analysisResult.visibleObservations.visibleTextureParticles}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#f8faf6] border border-[#dce8d5] space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      Coarse Fragments & Stones
                    </span>
                    <p className="text-slate-800 font-medium leading-relaxed">
                      {analysisResult.visibleObservations.coarseFragmentsStones}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#f8faf6] border border-[#dce8d5] space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      Visible Organic Residue
                    </span>
                    <p className="text-slate-800 font-medium leading-relaxed">
                      {analysisResult.visibleObservations.visibleOrganicResidue}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#f8faf6] border border-[#dce8d5] space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      Surface Moisture Appearance
                    </span>
                    <p className="text-slate-800 font-medium leading-relaxed">
                      {analysisResult.visibleObservations.surfaceMoistureAppearance}
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Possible Soil Characteristics Card (Uncertainty Explained) */}
              {analysisResult.possibleCharacteristics && analysisResult.possibleCharacteristics.length > 0 && (
                <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#dce8d5] shadow-xs space-y-3">
                  <h3 className="text-xs sm:text-sm font-bold text-[#144225] font-display flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-700" />
                    <span>Possible Soil Characteristics (Visual Resemblance Only)</span>
                  </h3>

                  <div className="space-y-2.5">
                    {analysisResult.possibleCharacteristics.map((item, idx) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-[#fbfdfa] border border-[#dce8d5] space-y-1.5 text-xs">
                        <div className="font-extrabold text-[#113d23] text-sm">
                          {item.characteristic}
                        </div>
                        <p className="text-slate-700 leading-relaxed">
                          {item.explanation}
                        </p>
                        <div className="pt-1 text-[11px] text-amber-800 bg-amber-50/70 p-2 rounded-xl border border-amber-200/60 leading-relaxed">
                          <strong>Uncertainty Note:</strong> {item.uncertaintyNote}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Confidence & Limitations Card */}
              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#dce8d5] shadow-xs space-y-2.5 text-xs">
                <h3 className="text-xs sm:text-sm font-bold text-slate-800 font-display flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-slate-500" />
                  <span>Optical Analysis Limitations</span>
                </h3>

                <ul className="space-y-1.5 text-slate-600 list-disc list-inside text-[11px] leading-relaxed">
                  {analysisResult.limitationsAndConfidence.limitations.map((lim, idx) => (
                    <li key={idx}>{lim}</li>
                  ))}
                </ul>
              </div>

              {/* 4. Mandatory "Soil Test Needed" Section */}
              <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-4 sm:p-5 space-y-2.5 text-xs text-amber-950">
                <div className="flex items-center gap-2 font-bold text-amber-900 text-sm font-display">
                  <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
                  <span>Laboratory Soil Test Needed (Non-Negotiable)</span>
                </div>

                <p className="leading-relaxed font-medium">
                  {analysisResult.soilTestNeededReminder}
                </p>

                <div className="p-3 rounded-2xl bg-white border border-amber-200 text-[11px] text-amber-900 space-y-1">
                  <strong>Notice to Farmer:</strong> AGROVA strictly does not invent NPK numbers, pH measurements, or fertilizer dosage from a photo. Real fertilizer recommendations depend on chemical extraction conducted by an accredited Soil Testing Laboratory (e.g. Government Soil Health Card).
                </div>
              </div>

              {/* 5. Recommended Next Steps */}
              {analysisResult.recommendedNextSteps && analysisResult.recommendedNextSteps.length > 0 && (
                <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#dce8d5] shadow-xs space-y-2.5 text-xs">
                  <h3 className="text-xs sm:text-sm font-bold text-[#144225] font-display flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-700" />
                    <span>Recommended Practical In-Field Steps</span>
                  </h3>

                  <div className="space-y-1.5">
                    {analysisResult.recommendedNextSteps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-2 rounded-xl bg-[#f8faf6] border border-[#e2ebd9]">
                        <span className="w-5 h-5 rounded-full bg-[#e5f3e2] text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-slate-800 leading-snug">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Save & Action Controls */}
              <div className="space-y-2 pt-2">
                {saveSuccessMessage && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold">{saveSuccessMessage}</span>
                  </div>
                )}

                {saveErrorMessage && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-900 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{saveErrorMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={handleSaveScan}
                    disabled={isSaving}
                    className="py-3 px-4 rounded-xl bg-[#14492a] hover:bg-[#0e3a20] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs min-h-[48px] disabled:opacity-50"
                  >
                    <BookmarkPlus className="w-4 h-4 text-emerald-300" />
                    <span>{isSaving ? 'Saving...' : currentSavedId ? 'Scan Saved ✓' : 'Save Scan'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAnalyzeSoil}
                    disabled={isAnalyzing}
                    className="py-3 px-4 rounded-xl bg-white border border-[#d2e2cb] text-[#14492a] hover:bg-[#edf5e9] text-xs font-bold transition flex items-center justify-center gap-2 min-h-[48px]"
                  >
                    <RefreshCw className="w-4 h-4 text-emerald-700" />
                    <span>Analyse Again</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleStartNewScan}
                    className="py-3 px-4 rounded-xl bg-[#e5f3e2] text-[#124429] hover:bg-[#d6ebd2] text-xs font-bold transition flex items-center justify-center gap-2 min-h-[48px]"
                  >
                    <RotateCcw className="w-4 h-4 text-emerald-700" />
                    <span>Start New Scan</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Optional Manual Observation Checklist Mode (Accessible anytime or when AI unavailable) */}
          {showManualChecklist && !analysisResult && (
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#dce8d5] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-700" />
                  <h3 className="text-sm font-bold text-[#144225] font-display">
                    Manual Soil Observation Checklist
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowManualChecklist(false)}
                  className="text-xs text-slate-400 hover:text-slate-700"
                >
                  Close
                </button>
              </div>

              <p className="text-xs text-slate-600">
                Record your tactile in-field observations manually. This record will be safely saved to your farm records.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Observed Soil Color
                  </label>
                  <select
                    value={manualColor}
                    onChange={(e) => setManualColor(e.target.value)}
                    className="w-full bg-white border border-[#d2e2cb] rounded-xl px-3 py-2 text-slate-800"
                  >
                    <option value="Deep Black (Regur)">Deep Black (Regur / Cotton Soil)</option>
                    <option value="Dark Brown Loam">Dark Brown Loam</option>
                    <option value="Reddish Brown / Ferruginous">Reddish Brown / Ferruginous</option>
                    <option value="Light Sandy Greyish">Light Sandy Greyish</option>
                    <option value="Yellowish Clay">Yellowish Clay</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Texture & Aggregate Feel
                  </label>
                  <select
                    value={manualTexture}
                    onChange={(e) => setManualTexture(e.target.value)}
                    className="w-full bg-white border border-[#d2e2cb] rounded-xl px-3 py-2 text-slate-800"
                  >
                    <option value="Sticky Clay (Forms strong ribbon)">Sticky Clay (Forms strong ribbon)</option>
                    <option value="Crumbly / Granular Loam">Crumbly / Granular Loam (Easy tillage)</option>
                    <option value="Gritty / Coarse Sandy">Gritty / Coarse Sandy (Fast drainage)</option>
                    <option value="Smooth Silt (Floury feel)">Smooth Silt (Floury feel)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Stones / Coarse Gravel
                  </label>
                  <select
                    value={manualStones}
                    onChange={(e) => setManualStones(e.target.value)}
                    className="w-full bg-white border border-[#d2e2cb] rounded-xl px-3 py-2 text-slate-800"
                  >
                    <option value="Zero to rare pebbles (Smooth topsoil)">Zero to rare pebbles (Smooth topsoil)</option>
                    <option value="Occasional small gravel (5-15mm)">Occasional small gravel (5-15mm)</option>
                    <option value="Rocky / Abundant gravel layer">Rocky / Abundant gravel layer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Current Field Moisture
                  </label>
                  <select
                    value={manualMoisture}
                    onChange={(e) => setManualMoisture(e.target.value as any)}
                    className="w-full bg-white border border-[#d2e2cb] rounded-xl px-3 py-2 text-slate-800"
                  >
                    <option value="Moist / Optimal">Moist / Optimal (Ideal field capacity)</option>
                    <option value="Dry">Dry (Cracked / Powdery surface)</option>
                    <option value="Wet / Saturated">Wet / Saturated (Standing water / Muddy)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Field Observations & Tillage Notes
                </label>
                <textarea
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="E.g., Applied 2 trolleys FYM manure, soil holds water well, earthworms present..."
                  rows={3}
                  className="w-full text-xs bg-white border border-[#d2e2cb] rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveScan}
                  disabled={isSaving}
                  className="w-full py-3 px-4 rounded-xl bg-[#14492a] text-white text-xs font-bold hover:bg-[#0e3a20] transition flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <BookmarkPlus className="w-4 h-4 text-emerald-300" />
                  <span>{isSaving ? 'Saving...' : 'Save Manual Observation to Farm Records'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: SCAN HISTORY */}
      {viewMode === 'history' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#dce8d5] shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-700" />
                <h2 className="text-sm sm:text-base font-bold text-[#144225] font-display">
                  Saved Soil Scans & Records
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setViewMode('scanner')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900"
              >
                + New Scan
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Locally persisted on this device. Synchronized with your farm field records.
            </p>
          </div>

          {localScans.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-[#dce8d5] text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#f5f9f2] text-slate-400 flex items-center justify-center mx-auto border border-[#e2ebd9]">
                <ScanLine className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">No Soil Scans Recorded Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Take a photograph of your field soil or complete a manual observation to build your soil record history.
              </p>
              <button
                type="button"
                onClick={() => setViewMode('scanner')}
                className="py-2.5 px-4 rounded-xl bg-[#14492a] text-white text-xs font-bold hover:bg-[#0e3a20] transition inline-flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Start Your First Soil Scan</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {localScans.map((scan) => (
                <div
                  key={scan.id}
                  onClick={() => setSelectedHistoryItem(scan)}
                  className="bg-white rounded-2xl p-3.5 sm:p-4 border border-[#dce8d5] shadow-2xs hover:border-[#a8d3a1] transition cursor-pointer space-y-2 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {scan.soilPhotoUrl ? (
                        <div className="w-14 h-14 rounded-xl bg-slate-900 overflow-hidden shrink-0 border border-[#cfe2ca]">
                          <img
                            src={scan.soilPhotoUrl}
                            alt="Soil thumbnail"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-[#f2f7ef] text-emerald-800 flex items-center justify-center shrink-0 border border-[#cfe2ca]">
                          <Layers className="w-6 h-6 text-emerald-700" />
                        </div>
                      )}

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {scan.fieldName}
                          </h4>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            scan.isAiAnalyzed
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : scan.isLabVerified
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {scan.isAiAnalyzed ? 'AI Vision' : scan.isLabVerified ? 'Lab Report' : 'Manual'}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 flex items-center gap-1.5 truncate">
                          <span>{scan.date}</span>
                          <span>•</span>
                          <span>{scan.knownSoilType || 'General Soil'}</span>
                        </p>

                        <p className="text-xs text-slate-700 line-clamp-1 mt-0.5">
                          {scan.observations}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleDeleteScan(scan.id, e)}
                        className="p-2 text-slate-400 hover:text-red-600 rounded-lg transition"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Full Size Image Modal */}
      {previewModalOpen && selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-white/20">
            <button
              onClick={() => setPreviewModalOpen(false)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black transition z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedImage.dataUrl}
              alt="Full size soil preview"
              className="w-full max-h-[80vh] object-contain"
            />
          </div>
        </div>
      )}

      {/* MODAL 2: Live Viewfinder In-App Camera */}
      {isLiveCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col justify-between p-4">
          <div className="flex items-center justify-between text-white pb-2">
            <span className="text-xs font-bold text-emerald-300">Live Soil Camera Viewfinder</span>
            <button
              type="button"
              onClick={handleCloseLiveCamera}
              className="p-2 text-white hover:text-slate-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="relative flex-1 flex items-center justify-center overflow-hidden rounded-3xl bg-black border border-white/20">
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className="w-full h-full object-cover"
            />
            {/* Viewfinder Target Framing Guide */}
            <div className="absolute inset-8 border-2 border-white/30 rounded-2xl pointer-events-none flex items-center justify-center">
              <span className="text-[10px] text-white/70 bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs">
                Position topsoil sample here
              </span>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={handleCloseLiveCamera}
              className="px-4 py-2.5 rounded-xl bg-white/20 text-white text-xs font-bold"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleCaptureLiveFrame}
              className="w-16 h-16 rounded-full bg-white border-4 border-emerald-500 shadow-xl flex items-center justify-center active:scale-95 transition"
              title="Capture Photo"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-600" />
            </button>

            <button
              type="button"
              onClick={() => {
                handleCloseLiveCamera();
                handleTriggerNativeCamera();
              }}
              className="px-3 py-2.5 rounded-xl bg-white/20 text-white text-xs font-bold"
            >
              Use Phone Camera
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: History Item Detail View */}
      {selectedHistoryItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 space-y-4 shadow-2xl border border-[#dce8d5]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-[#144225] font-display truncate">
                  {selectedHistoryItem.fieldName}
                </h3>
                <span className="text-xs text-slate-500">{selectedHistoryItem.date}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHistoryItem(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedHistoryItem.soilPhotoUrl && (
              <div className="rounded-2xl overflow-hidden aspect-16/9 bg-slate-900 border border-[#dce8d5]">
                <img
                  src={selectedHistoryItem.soilPhotoUrl}
                  alt="Saved soil scan"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-[#f8faf6] rounded-xl border border-[#e2ebd9]">
                <span className="font-bold text-slate-700 block mb-1">Visual Observations:</span>
                <p className="text-slate-800 leading-relaxed">{selectedHistoryItem.observations}</p>
              </div>

              {selectedHistoryItem.aiAnalysis && selectedHistoryItem.aiAnalysis.possibleCharacteristics && (
                <div className="p-3 bg-[#f8faf6] rounded-xl border border-[#e2ebd9] space-y-1.5">
                  <span className="font-bold text-slate-700 block">AI Visual Characteristics:</span>
                  {selectedHistoryItem.aiAnalysis.possibleCharacteristics.map((c, i) => (
                    <div key={i} className="text-[11px] text-slate-700 border-l-2 border-emerald-600 pl-2">
                      <strong>{c.characteristic}:</strong> {c.explanation}
                    </div>
                  ))}
                </div>
              )}

              {selectedHistoryItem.notes && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px]">
                  <strong>Notes:</strong> {selectedHistoryItem.notes}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleDeleteScan(selectedHistoryItem.id)}
                className="py-2 px-3 rounded-xl bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 transition"
              >
                Delete Record
              </button>
              <button
                type="button"
                onClick={() => setSelectedHistoryItem(null)}
                className="py-2 px-4 rounded-xl bg-[#14492a] text-white text-xs font-bold hover:bg-[#0e3a20] transition"
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
