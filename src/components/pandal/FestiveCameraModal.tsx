import React, { useState, useEffect, useRef } from 'react';
import { Pandal } from '../../types';
import { playDhakHit, playKanshorBell } from '../../utils/audioSynth';
import confetti from 'canvas-confetti';
import {
  Camera,
  X,
  RefreshCw,
  Download,
  Share2,
  Sparkles,
  AlertTriangle,
  Upload,
  Check,
  RotateCcw,
  Maximize2,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import { DurgaThirdEye, ShankhaIcon, DhunuchiIcon, AlpanaCorner } from '../common/BengaliMotifs';

interface FestiveCameraModalProps {
  pandal: Pandal;
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
}

export const FestiveCameraModal: React.FC<FestiveCameraModalProps> = ({
  pandal,
  isOpen,
  onClose,
  isDarkMode = false,
}) => {
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'starting' | 'active' | 'denied' | 'unsupported'>('idle');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isShutterFlashing, setIsShutterFlashing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera tracks cleanly
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Start device camera
  const startCamera = async (facing: 'environment' | 'user' = facingMode) => {
    stopCameraStream();
    setCameraStatus('starting');
    setErrorMessage('');

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraStatus('unsupported');
      setErrorMessage('Camera API is not supported in this browser environment. You can still upload a photo to apply the festive frame!');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(console.error);
        };
      }
      setCameraStatus('active');
    } catch (err: unknown) {
      console.warn('Camera access failed:', err);
      const error = err as Error;
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setCameraStatus('denied');
        setErrorMessage('Camera access was declined. You can enable camera permissions in your browser or upload a photo below.');
      } else {
        // Fallback: try user facing or default video without constraints
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          streamRef.current = fallbackStream;
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().catch(console.error);
            };
          }
          setCameraStatus('active');
        } catch (fallbackErr) {
          setCameraStatus('unsupported');
          setErrorMessage('Unable to start video camera feed. You can upload an existing pandal photo to apply the festive frame.');
        }
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCapturedImage(null);
      startCamera(facingMode);
    } else {
      stopCameraStream();
    }

    return () => {
      stopCameraStream();
    };
  }, [isOpen, facingMode]);

  // Flip camera between front and back
  const toggleFacingMode = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
  };

  // Draw the branded PujaTrip festive frame on canvas
  const renderBrandedFrameToCanvas = (
    imageSource: CanvasImageSource,
    sourceWidth: number,
    sourceHeight: number
  ): string => {
    const canvas = document.createElement('canvas');
    // Maintain standard high quality resolution
    const targetWidth = Math.min(1280, Math.max(800, sourceWidth));
    const targetHeight = Math.round((sourceHeight / sourceWidth) * targetWidth);
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // 1. Draw camera photo
    ctx.drawImage(imageSource, 0, 0, targetWidth, targetHeight);

    // 2. Subtle warm festive vignette / golden tint
    const vignette = ctx.createRadialGradient(
      targetWidth / 2,
      targetHeight / 2,
      targetWidth * 0.2,
      targetWidth / 2,
      targetHeight / 2,
      targetWidth * 0.75
    );
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(26, 12, 18, 0.45)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    // 3. Outer Festive Double Frame (Crimson & Gold)
    const borderWidth = Math.max(12, Math.round(targetWidth * 0.016));
    const goldPinstripe = Math.max(2, Math.round(borderWidth * 0.25));

    // Outer crimson border
    ctx.lineWidth = borderWidth;
    ctx.strokeStyle = '#881337';
    ctx.strokeRect(borderWidth / 2, borderWidth / 2, targetWidth - borderWidth, targetHeight - borderWidth);

    // Inner gold pinstripe
    ctx.lineWidth = goldPinstripe;
    ctx.strokeStyle = '#F59E0B';
    const innerOffset = borderWidth + 4;
    ctx.strokeRect(innerOffset, innerOffset, targetWidth - innerOffset * 2, targetHeight - innerOffset * 2);

    // 4. Top Header Festive Banner
    const headerHeight = Math.max(48, Math.round(targetHeight * 0.075));
    const headerGrad = ctx.createLinearGradient(0, 0, 0, headerHeight * 1.5);
    headerGrad.addColorStop(0, 'rgba(136, 19, 55, 0.92)');
    headerGrad.addColorStop(1, 'rgba(136, 19, 55, 0)');
    ctx.fillStyle = headerGrad;
    ctx.fillRect(0, 0, targetWidth, headerHeight * 1.5);

    // Header Text: PUJATRIP • শারদ উৎসব ২০২৬
    ctx.fillStyle = '#FEF08A';
    ctx.font = `bold ${Math.max(13, Math.round(targetWidth * 0.018))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✨ PUJATRIP • শারদ উৎসব 2026 ✨', targetWidth / 2, headerHeight * 0.55);

    // 5. Corner Ornate Alpana Flourishes
    const cornerSize = Math.max(24, Math.round(targetWidth * 0.04));
    ctx.fillStyle = '#FDE68A';
    // Draw corner brackets
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#FEF08A';
    // Top-left
    ctx.beginPath();
    ctx.moveTo(innerOffset + 8, innerOffset + 8 + cornerSize);
    ctx.lineTo(innerOffset + 8, innerOffset + 8);
    ctx.lineTo(innerOffset + 8 + cornerSize, innerOffset + 8);
    ctx.stroke();
    // Top-right
    ctx.beginPath();
    ctx.moveTo(targetWidth - innerOffset - 8 - cornerSize, innerOffset + 8);
    ctx.lineTo(targetWidth - innerOffset - 8, innerOffset + 8);
    ctx.lineTo(targetWidth - innerOffset - 8, innerOffset + 8 + cornerSize);
    ctx.stroke();

    // 6. Bottom Branded Pandal Banner
    const footerHeight = Math.max(90, Math.round(targetHeight * 0.16));
    const footerGrad = ctx.createLinearGradient(0, targetHeight - footerHeight * 1.3, 0, targetHeight);
    footerGrad.addColorStop(0, 'rgba(136, 19, 55, 0)');
    footerGrad.addColorStop(0.3, 'rgba(136, 19, 55, 0.88)');
    footerGrad.addColorStop(1, 'rgba(120, 15, 45, 0.98)');
    ctx.fillStyle = footerGrad;
    ctx.fillRect(0, targetHeight - footerHeight * 1.3, targetWidth, footerHeight * 1.3);

    // Decorative Gold divider line above footer text
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(targetWidth * 0.08, targetHeight - footerHeight + 8);
    ctx.lineTo(targetWidth * 0.92, targetHeight - footerHeight + 8);
    ctx.stroke();

    // Bottom Pandal Name
    ctx.textAlign = 'left';
    const leftMargin = Math.max(20, Math.round(targetWidth * 0.04));

    // Primary English Pandal Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `900 ${Math.max(18, Math.round(targetWidth * 0.028))}px sans-serif`;
    ctx.fillText(pandal.name, leftMargin, targetHeight - footerHeight + 34);

    // Bengali Name & Zone
    ctx.fillStyle = '#FEF08A';
    ctx.font = `bold ${Math.max(13, Math.round(targetWidth * 0.018))}px sans-serif`;
    const subText = `${pandal.bengaliName} • ${pandal.zone} • Maha Saptami 2026`;
    ctx.fillText(subText, leftMargin, targetHeight - footerHeight + 58);

    // Verified Darshan Badge on right side
    ctx.textAlign = 'right';
    const rightMargin = targetWidth - leftMargin;
    ctx.fillStyle = '#34D399';
    ctx.font = `bold ${Math.max(11, Math.round(targetWidth * 0.016))}px sans-serif`;
    ctx.fillText('✓ শারদ দর্শন স্মৃতি • #PujaTripMoments', rightMargin, targetHeight - footerHeight + 34);

    ctx.fillStyle = '#FDE68A';
    ctx.font = `${Math.max(10, Math.round(targetWidth * 0.014))}px sans-serif`;
    ctx.fillText('Kolkata & Contai Durga Puja', rightMargin, targetHeight - footerHeight + 56);

    return canvas.toDataURL('image/jpeg', 0.92);
  };

  // Capture photo from live video feed
  const handleSnapPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    // Trigger shutter flash
    setIsShutterFlashing(true);
    setTimeout(() => setIsShutterFlashing(false), 200);

    // Festive audio sound
    playDhakHit('dha');
    playKanshorBell(1);

    // Confetti celebration
    confetti({
      particleCount: 50,
      spread: 75,
      origin: { y: 0.7 },
      colors: ['#DC2626', '#FEF08A', '#F59E0B'],
    });

    const dataUrl = renderBrandedFrameToCanvas(video, video.videoWidth, video.videoHeight);
    setCapturedImage(dataUrl);
    stopCameraStream();
  };

  // Handle uploaded photo from file input
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        playDhakHit('dha');
        playKanshorBell(0.9);
        const dataUrl = renderBrandedFrameToCanvas(img, img.width, img.height);
        setCapturedImage(dataUrl);
        stopCameraStream();
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Retake photo: restart camera
  const handleRetake = () => {
    setCapturedImage(null);
    startCamera(facingMode);
  };

  // Download captured branded photo
  const handleDownload = () => {
    if (!capturedImage) return;
    const cleanName = pandal.name.replace(/[^a-zA-Z0-9]/g, '-');
    const a = document.createElement('a');
    a.href = capturedImage;
    a.download = `PujaTrip-${cleanName}-Darshan.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    playKanshorBell(0.8);
  };

  // Share captured photo
  const handleShare = async () => {
    if (!capturedImage) return;

    if (navigator.share) {
      try {
        // Convert dataURL to Blob for sharing
        const res = await fetch(capturedImage);
        const blob = await res.blob();
        const file = new File([blob], `PujaTrip-${pandal.name}.jpg`, { type: 'image/jpeg' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Durga Puja Darshan at ${pandal.name}`,
            text: `Celebrated Durga Puja darshan at ${pandal.name} (${pandal.zone}) with PujaTrip! #PujaTripMoments`,
            files: [file],
          });
          playKanshorBell(0.8);
          return;
        } else {
          await navigator.share({
            title: `Durga Puja Darshan at ${pandal.name}`,
            text: `Celebrated Durga Puja darshan at ${pandal.name} with PujaTrip!`,
            url: window.location.href,
          });
          playKanshorBell(0.8);
          return;
        }
      } catch (err: unknown) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }

    // Fallback: download the file
    handleDownload();
  };

  if (!isOpen) return null;

  return (
    <div
      id="festive-camera-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
    >
      <div className="relative w-full max-w-lg rounded-3xl overflow-hidden border border-[#F59E0B]/40 shadow-2xl bg-[#1A0E17] text-white flex flex-col max-h-[92vh]">
        {/* Top Modal Header */}
        <div className="px-4 py-3 bg-[#881337] border-b border-[#F59E0B]/30 flex items-center justify-between z-20">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-black/30 border border-white/20 flex items-center justify-center text-[#FEF08A]">
              <Camera className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-display font-black text-sm sm:text-base text-[#FEF08A] tracking-tight leading-tight">
                Festive Puja Snap
              </h3>
              <p className="text-[11px] text-amber-200/80 font-medium truncate max-w-[220px]">
                {pandal.name}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-stone-300 hover:text-white flex items-center justify-center transition-colors"
            title="Close camera"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewport Area: Live Camera Feed or Captured Photo */}
        <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center min-h-[380px] sm:min-h-[460px]">
          {/* Shutter White Flash Animation */}
          {isShutterFlashing && (
            <div className="absolute inset-0 bg-white z-40 animate-fadeOut pointer-events-none" />
          )}

          {capturedImage ? (
            /* Captured Branded Photo Result */
            <div className="relative w-full h-full flex flex-col items-center justify-center p-2">
              <img
                src={capturedImage}
                alt={`Festive frame for ${pandal.name}`}
                className="max-h-[60vh] w-auto rounded-2xl shadow-xl object-contain border border-amber-500/30"
              />
              <div className="absolute top-4 right-4 bg-emerald-600 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Framed Snap Ready!</span>
              </div>
            </div>
          ) : cameraStatus === 'active' ? (
            /* Live Camera Feed with Interactive Branded Overlay */
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover min-h-[380px]"
              />

              {/* Live Branded Frame Overlay (Visual Preview) */}
              <div className="absolute inset-0 pointer-events-none border-[12px] border-[#881337] shadow-inner">
                {/* Inner Gold Pinstripe */}
                <div className="absolute inset-1 border-2 border-[#F59E0B]/80 rounded-sm pointer-events-none">
                  {/* Top Festive Crest */}
                  <div className="absolute top-2 left-0 right-0 text-center">
                    <span className="px-3 py-1 rounded-full bg-[#881337]/90 text-[#FEF08A] font-extrabold text-[10px] tracking-wider uppercase border border-[#F59E0B]/50 shadow-md">
                      ✨ PujaTrip • শারদ উৎসব 2026 ✨
                    </span>
                  </div>

                  {/* Corner Bengali Motifs */}
                  <AlpanaCorner position="top-left" size={36} color="#FEF08A" className="absolute top-1 left-1 opacity-70" />
                  <AlpanaCorner position="top-right" size={36} color="#FEF08A" className="absolute top-1 right-1 opacity-70" />

                  {/* Bottom Live Festive Pandal Strip */}
                  <div className="absolute bottom-2 left-2 right-2 p-2.5 rounded-xl bg-[#881337]/90 backdrop-blur-xs border border-[#F59E0B]/50 text-white shadow-lg">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-display font-black text-xs sm:text-sm text-white truncate">
                          {pandal.name}
                        </div>
                        <div className="text-[10px] text-[#FEF08A] font-semibold truncate">
                          {pandal.bengaliName} • {pandal.zone}
                        </div>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                        ✓ Darshan
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : cameraStatus === 'starting' ? (
            /* Starting State */
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
              <p className="font-bold text-amber-200 text-sm">Starting camera feed...</p>
              <p className="text-xs text-stone-400">Please grant camera permission when prompted</p>
            </div>
          ) : (
            /* Denied or Unsupported Camera State */
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 max-w-sm">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="font-display font-black text-base text-rose-300">
                Camera Access Needed
              </h4>
              <p className="text-xs text-stone-300 leading-relaxed">
                {errorMessage || 'Your browser declined or does not support direct webcam access. You can upload a photo from your gallery to apply the festive frame!'}
              </p>

              {/* Action: Upload photo to frame */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-[#DC2626] text-white font-bold text-xs shadow-md flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all"
              >
                <Upload className="w-4 h-4 text-[#FEF08A]" />
                <span>Upload Pandal Photo</span>
              </button>

              <button
                type="button"
                onClick={() => startCamera(facingMode)}
                className="text-xs text-amber-300 underline font-bold hover:text-white"
              >
                Retry Camera Access
              </button>
            </div>
          )}
        </div>

        {/* Hidden File Input for Gallery Upload Fallback */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Bottom Action Controls */}
        <div className="p-4 bg-[#23141F] border-t border-[#F59E0B]/30 flex items-center justify-between gap-3">
          {capturedImage ? (
            /* Actions after Photo Capture */
            <div className="w-full flex items-center justify-between gap-2">
              <button
                onClick={handleRetake}
                className="px-3.5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95"
              >
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>Retake</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <Share2 className="w-4 h-4 text-[#FEF08A]" />
                  <span>Share</span>
                </button>

                <button
                  onClick={handleDownload}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#DC2626] to-[#991B1B] hover:brightness-110 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <Download className="w-4 h-4 text-[#FEF08A]" />
                  <span>Save Photo</span>
                </button>
              </div>
            </div>
          ) : (
            /* Live Camera Controls */
            <div className="w-full flex items-center justify-between">
              {/* Flip camera */}
              <button
                type="button"
                onClick={toggleFacingMode}
                disabled={cameraStatus !== 'active'}
                className="p-3 rounded-2xl bg-black/40 hover:bg-black/60 border border-white/15 text-stone-200 hover:text-white transition-all active:scale-95 disabled:opacity-40"
                title="Flip camera (front / back)"
              >
                <RefreshCw className="w-5 h-5 text-[#FEF08A]" />
              </button>

              {/* Shutter Button with Concentric Rings */}
              <button
                type="button"
                onClick={handleSnapPhoto}
                disabled={cameraStatus !== 'active'}
                className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-tr from-[#991B1B] via-[#DC2626] to-[#F59E0B] p-1 shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center ring-4 ring-[#FEF08A]/40"
                title="Snap Festive Photo"
                aria-label="Snap Festive Photo"
              >
                <div className="w-full h-full rounded-full border-2 border-white flex items-center justify-center bg-[#881337]/50">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </button>

              {/* Upload fallback button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-2xl bg-black/40 hover:bg-black/60 border border-white/15 text-stone-200 hover:text-white transition-all active:scale-95"
                title="Upload photo from gallery"
              >
                <Upload className="w-5 h-5 text-[#FEF08A]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
