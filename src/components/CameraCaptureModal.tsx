import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  RotateCcw, 
  X, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  SwitchCamera,
  Sparkles,
  Smartphone
} from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCaptured: (file: File, dataUrl: string) => void;
  targetSubject: 'plant' | 'soil';
}

function dataUrlToFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onPhotoCaptured,
  targetSubject,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [isLoadingCamera, setIsLoadingCamera] = useState<boolean>(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

  // Check available camera devices
  useEffect(() => {
    if (!isOpen) return;
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoDevices.length > 1);
      }).catch(() => {});
    }
  }, [isOpen]);

  // Start live camera stream
  const startCamera = async (mode = facingMode) => {
    setIsLoadingCamera(true);
    setPermissionError(null);
    setCapturedPreview(null);
    setCapturedFile(null);

    // Stop existing stream if any
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsLoadingCamera(false);
      setPermissionError('Camera API is not supported by this browser. Tap "Use Device Phone Camera" below to take a photo.');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      setIsLoadingCamera(false);
    } catch (err: any) {
      console.warn('getUserMedia error:', err);
      setIsLoadingCamera(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionError('Camera permission was blocked or not granted in this window. Use the native device camera button below.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setPermissionError('No camera found on this device. Please connect a camera or use your phone camera.');
      } else {
        setPermissionError(err.message || 'Unable to access camera.');
      }
    }
  };

  // Launch camera when modal opens
  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      setCapturedPreview(null);
      setCapturedFile(null);
      setPermissionError(null);
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, facingMode]);

  // Bind video element whenever stream changes or capturedPreview resets
  useEffect(() => {
    if (videoRef.current && stream && !capturedPreview) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((e) => console.warn('Video play error:', e));
    }
  }, [stream, capturedPreview]);

  const handleCaptureFrame = () => {
    if (!videoRef.current) {
      nativeCameraInputRef.current?.click();
      return;
    }

    const video = videoRef.current;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    // If video stream is not yet active or 0 dimensions, fall back to native device camera
    if (width === 0 || height === 0 || video.readyState < 2) {
      nativeCameraInputRef.current?.click();
      return;
    }

    setIsCapturing(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');

      ctx.drawImage(video, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      const fileName = `${targetSubject}-scan-${Date.now()}.jpg`;
      const file = dataUrlToFile(dataUrl, fileName);

      setCapturedPreview(dataUrl);
      setCapturedFile(file);

      // Stop active stream to save power
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
    } catch (e) {
      console.warn('Canvas capture error, switching to native capture:', e);
      nativeCameraInputRef.current?.click();
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRetake = () => {
    setCapturedPreview(null);
    setCapturedFile(null);
    if (permissionError) {
      nativeCameraInputRef.current?.click();
    } else {
      startCamera(facingMode);
    }
  };

  const handleConfirmPhoto = () => {
    if (capturedPreview && capturedFile) {
      onPhotoCaptured(capturedFile, capturedPreview);
      onClose();
    }
  };

  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Handle native camera capture file picker (strictly real camera only)
  const handleNativeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setCapturedPreview(dataUrl);
        setCapturedFile(file);
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
          setStream(null);
        }
      };
      reader.onerror = () => {
        setPermissionError('Unable to read image from device camera.');
      };
      reader.readAsDataURL(file);
    }
    // Reset file input value to allow immediate retakes
    e.target.value = '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Hidden native phone camera input: strictly camera only */}
      <input
        ref={nativeCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleNativeFileChange}
        className="hidden"
      />

      <div className="bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-700 flex flex-col max-h-[92vh]">
        {/* Top Header Bar */}
        <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold font-display">
              {capturedPreview
                ? 'Review Captured Photo'
                : targetSubject === 'plant'
                ? 'Capture Plant Leaf / Crop'
                : 'Capture Soil Surface'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
            title="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewfinder or Captured Preview */}
        <div className="relative bg-black flex-1 min-h-[320px] sm:min-h-[380px] flex items-center justify-center overflow-hidden">
          {/* Permission / Unsupported Error State */}
          {permissionError && !capturedPreview && (
            <div className="p-6 text-center text-white space-y-4 max-w-sm">
              <div className="w-14 h-14 rounded-2xl bg-amber-950/60 border border-amber-700/60 flex items-center justify-center mx-auto text-amber-400">
                <Smartphone className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-amber-300">Use Native Device Camera</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {permissionError}
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="w-full py-3 rounded-xl bg-[#14492a] hover:bg-[#0f3c21] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg"
                >
                  <Camera className="w-4 h-4 text-emerald-300" />
                  <span>Launch Phone Camera App</span>
                </button>

                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry In-App Camera</span>
                </button>
              </div>
            </div>
          )}

          {/* Loading Camera State */}
          {isLoadingCamera && !permissionError && !capturedPreview && (
            <div className="p-8 text-center text-white space-y-3">
              <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-300 font-medium">Starting camera...</p>
              <button
                type="button"
                onClick={() => nativeCameraInputRef.current?.click()}
                className="mt-3 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:text-white"
              >
                Or use native camera directly
              </button>
            </div>
          )}

          {/* Live Viewfinder */}
          {!isLoadingCamera && !permissionError && !capturedPreview && (
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover max-h-[500px]"
              />

              {/* Viewfinder Target Framing Guides */}
              <div className="absolute inset-8 sm:inset-12 pointer-events-none border-2 border-white/30 rounded-2xl flex flex-col justify-between p-3">
                <div className="flex justify-between">
                  <div className="w-6 h-6 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg" />
                  <div className="w-6 h-6 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg" />
                </div>
                <div className="text-center">
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-black/60 text-white backdrop-blur-xs">
                    {targetSubject === 'plant'
                      ? 'Center leaf symptom in daylight'
                      : 'Hold camera 15-20cm above soil surface'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <div className="w-6 h-6 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg" />
                  <div className="w-6 h-6 border-b-2 border-r-2 border-emerald-400 rounded-br-lg" />
                </div>
              </div>

              {/* Camera Switcher (Front/Back) */}
              {hasMultipleCameras && (
                <button
                  type="button"
                  onClick={handleToggleFacingMode}
                  className="absolute top-4 right-4 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-xs transition"
                  title="Switch Camera"
                >
                  <SwitchCamera className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Captured Preview Mode */}
          {capturedPreview && (
            <div className="relative w-full h-full flex items-center justify-center p-2">
              <img
                src={capturedPreview}
                alt="Captured scan preview"
                className="max-w-full max-h-[460px] object-contain rounded-2xl shadow-lg border border-slate-700"
              />
              <div className="absolute top-4 left-4 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-600/60 text-emerald-300 text-[11px] font-bold">
                ✓ Photo Ready
              </div>
            </div>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 shrink-0">
          {/* Live capture controls */}
          {!capturedPreview ? (
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCaptureFrame}
                disabled={isCapturing}
                className="flex-1 max-w-[200px] flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-lg shadow-emerald-950 transition disabled:opacity-40"
              >
                <div className="w-4 h-4 rounded-full border-2 border-white bg-white/20" />
                <span>Capture Photo</span>
              </button>

              <button
                type="button"
                onClick={() => nativeCameraInputRef.current?.click()}
                className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition flex items-center gap-1.5"
                title="Open native camera application"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Phone App</span>
              </button>
            </div>
          ) : (
            /* Review & Confirm controls: Retake vs Use/Analyze vs Cancel */
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>Retake</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmPhoto}
                className="flex-1 py-3 px-3 rounded-xl bg-[#14492a] hover:bg-[#0f3c21] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950"
              >
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Analyze Photo</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs transition"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
