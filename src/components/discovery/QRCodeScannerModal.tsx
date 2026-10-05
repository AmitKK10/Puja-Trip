import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import confetti from 'canvas-confetti';
import { Pandal } from '../../types';
import { playKanshorBell, playDhakHit } from '../../utils/audioSynth';
import { handleImageError } from '../../utils/imageFallback';
import { PandalCrowdHeatmap } from '../common/PandalCrowdHeatmap';
import {
  Camera,
  X,
  Plus,
  Check,
  Bookmark,
  BookmarkCheck,
  AlertCircle,
  Sparkles,
  QrCode,
  Upload,
  RefreshCw,
  ExternalLink,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

interface QRCodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pandals: Pandal[];
  activeTripPandalIds: string[];
  favorites: string[];
  visitedList?: string[];
  onToggleTripPandal: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onToggleVisited?: (id: string) => void;
  onSelectPandal: (pandal: Pandal) => void;
  isDarkMode?: boolean;
}

export const QRCodeScannerModal: React.FC<QRCodeScannerModalProps> = ({
  isOpen,
  onClose,
  pandals,
  activeTripPandalIds,
  favorites,
  visitedList = [],
  onToggleTripPandal,
  onToggleFavorite,
  onToggleVisited,
  onSelectPandal,
  isDarkMode = false,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<{
    rawCode: string;
    pandal: Pandal | null;
  } | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [justAddedToTrip, setJustAddedToTrip] = useState(false);
  const [justMarkedVisited, setJustMarkedVisited] = useState(false);

  // Stop camera stream on unmount or close
  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Start camera stream
  const startCamera = async () => {
    stopCamera();
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported in this browser environment.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS
        await videoRef.current.play();
        setCameraActive(true);
        scanFrame();
      }
    } catch (err: unknown) {
      console.warn('Camera stream error:', err);
      const errName = (err as Error)?.name || '';
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        setCameraError('Camera permission denied. Please allow camera access in browser settings or use image upload / quick test codes below.');
      } else {
        setCameraError('Unable to access camera feed. You can upload a photo of a QR code or test with sample pandal codes below.');
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setScannedResult(null);
    }
    return () => stopCamera();
  }, [isOpen]);

  // Decode QR code from frame
  const scanFrame = () => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const video = videoRef.current;
    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvasRef.current = canvas;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    try {
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        handleCodeDetected(code.data);
        return; // Pause loop once detected
      }
    } catch (err) {
      console.warn('jsQR scan error:', err);
    }

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  };

  // Process decoded code string and match to pandal
  const handleCodeDetected = (rawCode: string) => {
    const trimmed = rawCode.trim();
    let matched: Pandal | null = null;

    // 1. Direct ID match
    matched = pandals.find((p) => p.id.toLowerCase() === trimmed.toLowerCase()) || null;

    // 2. URL parsing: e.g. https://pujatrip.app/pandal?id=suruchi_sangha or pujatrip://pandal/suruchi_sangha
    if (!matched && (trimmed.includes('http') || trimmed.includes('pujatrip://') || trimmed.includes('?id='))) {
      try {
        const url = new URL(trimmed);
        const idParam = url.searchParams.get('id') || url.pathname.split('/').filter(Boolean).pop();
        if (idParam) {
          matched = pandals.find((p) => p.id.toLowerCase() === idParam.toLowerCase()) || null;
        }
      } catch {
        // Not a standard URL, try regex
        const idMatch = trimmed.match(/[?&]id=([^&#]+)/) || trimmed.match(/pandal\/([^/?&#]+)/);
        if (idMatch && idMatch[1]) {
          matched = pandals.find((p) => p.id.toLowerCase() === idMatch[1].toLowerCase()) || null;
        }
      }
    }

    // 3. JSON payload: e.g. { "id": "suruchi_sangha", "type": "pandal" }
    if (!matched && trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        const targetId = parsed.id || parsed.pandalId;
        if (targetId) {
          matched = pandals.find((p) => p.id.toLowerCase() === targetId.toLowerCase()) || null;
        }
      } catch {
        // invalid JSON
      }
    }

    // 4. Loose name match (e.g. "Suruchi Sangha" or "College Square")
    if (!matched) {
      const cleanSearch = trimmed.toLowerCase();
      matched =
        pandals.find(
          (p) =>
            p.name.toLowerCase().includes(cleanSearch) ||
            cleanSearch.includes(p.name.toLowerCase()) ||
            p.bengaliName.includes(trimmed)
        ) || null;
    }

    // Audio chime feedback & festive celebration
    try {
      playKanshorBell(0.7);
      setTimeout(() => playDhakHit('dha', 0.8), 120);
    } catch {
      // Audio optional
    }

    setScannedResult({ rawCode: trimmed, pandal: matched });

    if (matched) {
      // Trigger festive celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#DC2626', '#F59E0B', '#10B981', '#FEF08A'],
        });
      } catch (e) {
        // Confetti optional
      }

      // Mark as visited when physical QR code is scanned
      if (onToggleVisited && !visitedList.includes(matched.id)) {
        onToggleVisited(matched.id);
        setJustMarkedVisited(true);
        setTimeout(() => setJustMarkedVisited(false), 4000);
      }

      // Auto-add to trip if matched and not already in trip
      if (!activeTripPandalIds.includes(matched.id)) {
        onToggleTripPandal(matched.id);
        setJustAddedToTrip(true);
        setTimeout(() => setJustAddedToTrip(false), 3000);
      }
    }
  };

  // Image file upload fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            handleCodeDetected(code.data);
          } else {
            setCameraError('No valid Durga Puja QR code detected in the uploaded image. Please try another photo.');
          }
        }
        setIsProcessingFile(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Sample quick codes for reviewers/testers
  const samplePandals = pandals.slice(0, 5);

  if (!isOpen) return null;

  return (
    <div
      id="qr-scanner-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="qr-scanner-modal-content"
        className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden max-h-[92vh] flex flex-col ${
          isDarkMode
            ? 'bg-[#1C1418] border-amber-500/30 text-white'
            : 'bg-white border-amber-200 text-stone-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#DC2626] to-[#991B1B] text-white flex items-center justify-center shadow-md">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-h3 leading-tight text-stone-900 dark:text-white">
                Scan Pandal QR Code
              </h3>
              <p className="font-bengali text-micro text-[#DC2626] dark:text-[#FEF08A] font-bold">
                মণ্ডপ প্রাঙ্গণের কিউআর কোড স্ক্যান করুন
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white transition-all"
            title="Close Scanner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Result view if code was detected */}
          {scannedResult ? (
            <div className="space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
              {scannedResult.pandal ? (
                <div
                  className={`p-4 rounded-3xl border-2 transition-all shadow-lg ${
                    isDarkMode
                      ? 'bg-gradient-to-br from-[#28151F] to-[#1A0E14] border-emerald-500/50'
                      : 'bg-gradient-to-br from-emerald-50/90 to-amber-50/70 border-emerald-500/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-micro font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Pandal Verified & Scanned</span>
                    </span>
                    <span className="text-micro font-bold text-stone-500 font-mono">
                      {scannedResult.pandal.id}
                    </span>
                  </div>

                  {/* Just Added Alert Banner */}
                  {justAddedToTrip && (
                    <div className="mb-3 p-2.5 rounded-2xl bg-emerald-600 text-white text-btn font-bold flex items-center gap-2 shadow-sm animate-bounce">
                      <Sparkles className="w-4 h-4 text-amber-200 shrink-0" />
                      <span>Added to your current Trip Route automatically!</span>
                    </div>
                  )}

                  {/* Just Visited Alert Banner */}
                  {justMarkedVisited && (
                    <div className="mb-3 p-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-btn font-bold flex items-center gap-2 shadow-sm animate-bounce">
                      <CheckCircle2 className="w-4 h-4 text-amber-200 shrink-0" />
                      <span>🎉 Gate Check-In Successful! Pandal Marked as Visited (শারদ দর্শন সম্পন্ন)</span>
                    </div>
                  )}

                  {/* Pandal Preview Card */}
                  <div className="flex gap-3 items-start">
                    <img
                      src={scannedResult.pandal.heroImage}
                      alt={scannedResult.pandal.name}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover shrink-0 border border-black/10 shadow-sm"
                      referrerPolicy="no-referrer"
                      onError={handleImageError}
                    />
                    <div className="space-y-1 flex-1 min-w-0">
                      <h4 className="font-display font-black text-h3 leading-tight truncate">
                        {scannedResult.pandal.name}
                      </h4>
                      <p className="font-bengali-serif text-small text-[#DC2626] dark:text-[#FEF08A] font-bold truncate">
                        {scannedResult.pandal.bengaliName}
                      </p>
                      <div className="flex items-center gap-1 text-micro text-stone-500 dark:text-stone-400">
                        <MapPin className="w-3 h-3 text-amber-600" />
                        <span>{scannedResult.pandal.area}, {scannedResult.pandal.city === 'kolkata' ? 'Kolkata' : 'Contai'}</span>
                      </div>
                      <p className="text-micro text-stone-600 dark:text-stone-300 line-clamp-2 pt-0.5">
                        {scannedResult.pandal.themeConcept}
                      </p>
                    </div>
                  </div>

                  {/* Real-Time Crowd Heatmap for scanned pandal */}
                  <div className="mt-3">
                    <PandalCrowdHeatmap pandal={scannedResult.pandal} variant="full" />
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-3.5 space-y-2 pt-2 border-t border-stone-200 dark:border-stone-800">
                    {/* Primary Visit Button (Arrival Check-In) */}
                    <button
                      onClick={() => {
                        if (onToggleVisited) {
                          onToggleVisited(scannedResult.pandal!.id);
                          if (!visitedList.includes(scannedResult.pandal!.id)) {
                            playKanshorBell(0.8);
                            confetti({
                              particleCount: 60,
                              spread: 55,
                              origin: { y: 0.6 },
                              colors: ['#10B981', '#F59E0B', '#DC2626'],
                            });
                          }
                        }
                      }}
                      className={`w-full py-2.5 px-4 rounded-xl font-bold text-btn flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 ${
                        visitedList.includes(scannedResult.pandal!.id)
                          ? 'bg-emerald-700 text-white border border-emerald-600'
                          : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:brightness-110'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {visitedList.includes(scannedResult.pandal!.id)
                          ? 'Pandal Visited! (শারদ দর্শন সম্পন্ন ✓)'
                          : 'Mark Pandal as Visited (দর্শন নথিভুক্ত করুন)'}
                      </span>
                    </button>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => onToggleTripPandal(scannedResult.pandal!.id)}
                        className={`flex-1 py-2 px-3 rounded-xl font-bold text-btn flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all ${
                          activeTripPandalIds.includes(scannedResult.pandal.id)
                            ? 'bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200'
                            : 'bg-gradient-to-r from-[#DC2626] to-[#991B1B] text-white'
                        }`}
                      >
                        {activeTripPandalIds.includes(scannedResult.pandal.id) ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-600" />
                            <span>In Trip Route</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            <span>Add to Route</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => onToggleFavorite(scannedResult.pandal!.id)}
                        className={`p-2 rounded-xl border font-bold text-btn transition-all ${
                          favorites.includes(scannedResult.pandal.id)
                            ? 'bg-[#DC2626] border-[#DC2626] text-white'
                            : 'bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                        }`}
                        title={favorites.includes(scannedResult.pandal.id) ? 'Saved' : 'Save'}
                      >
                        {favorites.includes(scannedResult.pandal.id) ? (
                          <BookmarkCheck className="w-4 h-4" />
                        ) : (
                          <Bookmark className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={() => {
                          onSelectPandal(scannedResult.pandal!);
                          onClose();
                        }}
                        className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-200 border border-amber-500/30 font-bold text-btn transition-all flex items-center gap-1"
                      >
                        <span>View Details</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Scanned code didn't match our database */
                <div className="p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <h4 className="font-bold text-btn">Unrecognized QR Code</h4>
                  </div>
                  <p className="text-small font-mono bg-white/60 dark:bg-black/40 p-2 rounded-xl border break-all">
                    {scannedResult.rawCode}
                  </p>
                  <p className="text-micro">
                    This QR code does not match any registered pandal in Kolkata or Contai. Try scanning an official PujaTrip pandal QR code.
                  </p>
                </div>
              )}

              {/* Rescan Button */}
              <button
                onClick={() => {
                  setScannedResult(null);
                  startCamera();
                }}
                className="w-full py-2.5 rounded-2xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-btn flex items-center justify-center gap-2 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Scan Another QR Code</span>
              </button>
            </div>
          ) : (
            /* Active Camera Scanner Viewport */
            <div className="space-y-3">
              <div className="relative w-full aspect-square sm:aspect-video rounded-3xl overflow-hidden bg-black flex items-center justify-center border-2 border-dashed border-amber-500/60 shadow-inner">
                {/* Real video stream */}
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />

                {/* Reticle / Target overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-56 h-56 sm:w-64 sm:h-64 border-2 border-[#DC2626] rounded-3xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] flex items-center justify-center">
                    {/* Reticle corner accents */}
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-amber-400 rounded-tl-xl" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-amber-400 rounded-tr-xl" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-amber-400 rounded-bl-xl" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-amber-400 rounded-br-xl" />

                    {/* Animated scanning line */}
                    <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-[#FEF08A] to-transparent animate-pulse shadow-[0_0_8px_#FEF08A]" />
                  </div>
                </div>

                {/* Bottom guidance */}
                <div className="absolute bottom-3 left-0 right-0 text-center pointer-events-none">
                  <span className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-micro font-semibold shadow-md">
                    Align pandal physical QR code within frame
                  </span>
                </div>
              </div>

              {/* Camera Error / Permission Notice */}
              {cameraError && (
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200 text-small space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-btn">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Camera Permission / Status</span>
                  </div>
                  <p className="text-micro leading-relaxed">{cameraError}</p>
                  <button
                    onClick={startCamera}
                    className="px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-micro mt-1"
                  >
                    Retry Camera
                  </button>
                </div>
              )}

              {/* Upload image alternative */}
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700">
                <div className="flex items-center gap-2 text-micro font-medium text-stone-600 dark:text-stone-300">
                  <Upload className="w-4 h-4 text-[#DC2626]" />
                  <span>Have a photo of the QR code?</span>
                </div>
                <label className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-white text-micro font-bold cursor-pointer transition-all">
                  <span>{isProcessingFile ? 'Decoding...' : 'Upload Image'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Quick Testing Station for Physical Gate Codes (Ensures testing works effortlessly) */}
              <div className="space-y-2 pt-1 border-t border-stone-200 dark:border-stone-800">
                <div className="flex items-center justify-between text-micro font-bold text-stone-500">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Simulate Physical Gate QR Code Scans:</span>
                  </span>
                  <span className="text-[10px] text-stone-400">Click to test instant scan</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {samplePandals.map((pandal) => {
                    const inTrip = activeTripPandalIds.includes(pandal.id);
                    const isVisited = visitedList.includes(pandal.id);
                    return (
                      <button
                        key={pandal.id}
                        onClick={() => handleCodeDetected(pandal.id)}
                        className={`p-2 rounded-2xl border text-left flex items-center justify-between gap-2 transition-all hover:scale-[1.01] active:scale-95 ${
                          isDarkMode
                            ? 'bg-black/40 border-stone-800 hover:border-amber-500/50 text-white'
                            : 'bg-stone-50 border-stone-200 hover:border-amber-400 text-stone-900'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0 text-micro font-bold">
                            QR
                          </div>
                          <div className="truncate">
                            <span className="text-micro font-bold block truncate">{pandal.name}</span>
                            <span className="text-[10px] text-stone-400 block truncate">{pandal.area}</span>
                          </div>
                        </div>

                        <span
                          className={`text-micro font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            isVisited
                              ? 'bg-emerald-600 text-white'
                              : inTrip
                              ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                              : 'bg-red-500/15 text-[#DC2626] dark:text-[#FEF08A]'
                          }`}
                        >
                          {isVisited ? 'Visited ✓' : '+ Scan & Visit'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-micro text-stone-500 shrink-0">
          <span>Official PujaTrip QR System • Kolkata & Contai</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
