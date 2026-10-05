import React, { useState, useEffect, useRef } from 'react';
import { Pandal } from '../../types';
import { playDhakHit, playKanshorBell } from '../../utils/audioSynth';
import {
  drawFestiveFrameToCanvas,
  PUJATRIP_WEBSITE_URL,
  DEVELOPER_PORTFOLIO_URL,
} from './FestiveFrameRenderer';
import { FestiveFrameView } from './FestiveFrameView';
import { getCurrentPujaStatus } from '../../utils/pujaDateStatus';
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
  Globe,
  ExternalLink,
  Briefcase,
} from 'lucide-react';
import { AlpanaCorner } from '../common/BengaliMotifs';

interface FestiveCameraModalProps {
  pandal: Pandal;
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
}

export type CameraState = 'idle' | 'starting' | 'ready' | 'error';

export const FestiveCameraModal: React.FC<FestiveCameraModalProps> = ({
  pandal,
  isOpen,
  onClose,
  isDarkMode = false,
}) => {
  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isShutterFlashing, setIsShutterFlashing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const startupTimeoutRef = useRef<number | null>(null);

  // Stop camera tracks cleanly
  const stopCameraStream = () => {
    if (startupTimeoutRef.current) {
      window.clearTimeout(startupTimeoutRef.current);
      startupTimeoutRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('[FestiveCamera] Error stopping track:', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch {
        // ignore
      }
      videoRef.current.srcObject = null;
    }
  };

  // Start device camera
  const startCamera = async (facing: 'environment' | 'user' = facingMode) => {
    stopCameraStream();
    setCameraState('starting');
    setErrorMessage('');

    const isSecure = typeof window !== 'undefined' && (
      window.isSecureContext ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.protocol === 'https:'
    );

    console.log('[FestiveCamera] Camera supported:', typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia);
    console.log('[FestiveCamera] Secure context:', isSecure);

    if (!isSecure) {
      setCameraState('error');
      setErrorMessage('Camera access requires a secure HTTPS connection. Please use an HTTPS connection, or upload a photo from your gallery.');
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraState('error');
      setErrorMessage('Camera API is not supported in this browser. You can still upload a pandal photo from your gallery to apply the festive frame!');
      return;
    }

    // Set startup watchdog timer (10s)
    startupTimeoutRef.current = window.setTimeout(() => {
      setCameraState((prev) => {
        if (prev === 'starting') {
          console.warn('[FestiveCamera] Camera startup timed out after 10s');
          stopCameraStream();
          setErrorMessage('Camera feed startup timed out. Tap Retry or upload a photo from your gallery.');
          return 'error';
        }
        return prev;
      });
    }, 10000);

    const primaryConstraints: MediaStreamConstraints = {
      video: {
        facingMode: { ideal: facing },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    };

    console.log('[FestiveCamera] Requested constraints:', primaryConstraints);

    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia(primaryConstraints);
      console.log('[FestiveCamera] getUserMedia success with primary constraints');
    } catch (primaryErr: unknown) {
      console.warn('[FestiveCamera] Primary constraints failed, retrying with fallback:', primaryErr);
      const pErr = primaryErr as Error;

      if (pErr.name === 'NotAllowedError' || pErr.name === 'PermissionDeniedError') {
        if (startupTimeoutRef.current) {
          window.clearTimeout(startupTimeoutRef.current);
          startupTimeoutRef.current = null;
        }
        setCameraState('error');
        setErrorMessage('Camera permission was denied. Please allow Camera access in your browser settings.');
        return;
      }

      // Automatic fallback: simple constraints { video: true, audio: false }
      try {
        console.log('[FestiveCamera] Retrying with { video: true, audio: false }');
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        console.log('[FestiveCamera] getUserMedia success with fallback constraints');
      } catch (fallbackErr: unknown) {
        if (startupTimeoutRef.current) {
          window.clearTimeout(startupTimeoutRef.current);
          startupTimeoutRef.current = null;
        }
        const fErr = (fallbackErr as Error) || pErr;
        console.error('[FestiveCamera] Both camera attempts failed:', fErr);
        setCameraState('error');
        if (fErr.name === 'NotAllowedError' || fErr.name === 'PermissionDeniedError') {
          setErrorMessage('Camera permission was denied. Please allow Camera access in your browser settings.');
        } else if (fErr.name === 'NotFoundError' || fErr.name === 'DevicesNotFoundError') {
          setErrorMessage('No camera was found on this device.');
        } else if (fErr.name === 'NotReadableError' || fErr.name === 'TrackStartError') {
          setErrorMessage('The camera is currently being used by another app.');
        } else if (fErr.name === 'SecurityError') {
          setErrorMessage('Camera requires a secure HTTPS context.');
        } else {
          setErrorMessage('Unable to start camera. Try Retry or use Gallery.');
        }
        return;
      }
    }

    if (!stream) {
      setCameraState('error');
      setErrorMessage('Unable to start camera. Try Retry or use Gallery.');
      return;
    }

    streamRef.current = stream;

    // Ensure video element is mounted and accessible
    let video = videoRef.current;
    if (!video) {
      await new Promise((r) => setTimeout(r, 60));
      video = videoRef.current;
    }

    if (!video) {
      console.error('[FestiveCamera] videoRef is null after mount wait');
      setCameraState('error');
      setErrorMessage('Camera display element failed to initialize. Try Retry or use Gallery.');
      return;
    }

    try {
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');

      // Await metadata loading
      await new Promise<void>((resolve) => {
        if (video && video.readyState >= 2) {
          resolve();
          return;
        }
        const onLoaded = () => {
          video?.removeEventListener('loadedmetadata', onLoaded);
          resolve();
        };
        video?.addEventListener('loadedmetadata', onLoaded);
        setTimeout(resolve, 600);
      });

      console.log('[FestiveCamera] Video metadata loaded:', video.videoWidth, 'x', video.videoHeight);

      // Explicitly call video.play()
      await video.play();
      console.log('[FestiveCamera] video.play() successful. Camera ready!');

      if (startupTimeoutRef.current) {
        window.clearTimeout(startupTimeoutRef.current);
        startupTimeoutRef.current = null;
      }
      setCameraState('ready');
    } catch (playErr) {
      console.warn('[FestiveCamera] Error during video.play():', playErr);
      if (startupTimeoutRef.current) {
        window.clearTimeout(startupTimeoutRef.current);
        startupTimeoutRef.current = null;
      }
      const tracks = stream.getVideoTracks();
      if (tracks.length > 0 && tracks[0].readyState === 'live') {
        setCameraState('ready');
      } else {
        setCameraState('error');
        setErrorMessage('Unable to start video preview. Try Retry or use Gallery.');
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
  }, [isOpen]);

  // Flip camera between front and back
  const toggleFacingMode = async () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    await startCamera(nextFacing);
  };

  // Draw the branded PujaTrip festive frame on canvas
  const renderBrandedFrameToCanvas = (
    imageSource: CanvasImageSource,
    sourceWidth: number,
    sourceHeight: number
  ): string => {
    const canvas = document.createElement('canvas');
    drawFestiveFrameToCanvas(canvas, imageSource, sourceWidth, sourceHeight, pandal);
    return canvas.toDataURL('image/jpeg', 0.95);
  };

  // Capture photo from live video feed
  const handleSnapPhoto = () => {
    const video = videoRef.current;
    if (!video) {
      console.warn('[FestiveCamera] Cannot snap photo: video element not found');
      return;
    }
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (width === 0 || height === 0) {
      console.warn('[FestiveCamera] Cannot snap photo: video dimensions are 0');
      return;
    }

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

    const dataUrl = renderBrandedFrameToCanvas(video, width, height);
    if (dataUrl) {
      setCapturedImage(dataUrl);
      stopCameraStream();
    }
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
    e.target.value = '';
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
            className="w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
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
            /* Captured Branded Photo Result with Clickable QR Hotspots */
            <div className="relative w-full h-full flex flex-col items-center justify-center p-2">
              <div className="relative inline-block max-h-[60vh]">
                <img
                  src={capturedImage}
                  alt={`Festive frame for ${pandal.name}`}
                  className="max-h-[60vh] w-auto rounded-2xl shadow-xl object-contain border border-amber-500/30 block"
                />
                {/* Clickable hotspot over PujaTrip QR Code */}
                <a
                  href={PUJATRIP_WEBSITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Click to open PujaTrip"
                  title="Click or scan to open PujaTrip"
                  className="absolute bottom-[1.5%] left-[3.5%] w-[23%] h-[11%] rounded-lg border-2 border-transparent hover:border-amber-400/80 hover:bg-amber-400/15 transition-all cursor-pointer z-20"
                />
                {/* Clickable hotspot over Developer Portfolio QR Code */}
                <a
                  href={DEVELOPER_PORTFOLIO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Click to open Developer Portfolio"
                  title="Click or scan to open Developer Portfolio (Amit Kiran Kar)"
                  className="absolute bottom-[1.5%] right-[3.5%] w-[23%] h-[11%] rounded-lg border-2 border-transparent hover:border-amber-400/80 hover:bg-amber-400/15 transition-all cursor-pointer z-20"
                />
              </div>

              <div className="absolute top-4 right-4 bg-emerald-600 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Framed Snap Ready!</span>
              </div>
            </div>
          ) : (
            /* Live Camera Container - Always mounts video element so ref is never null */
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden min-h-[380px]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover min-h-[380px] ${
                  cameraState === 'ready' ? 'block' : 'opacity-0 pointer-events-none absolute'
                }`}
              />

              {/* Starting State Overlay */}
              {cameraState === 'starting' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-3 bg-[#1A0E17] z-20">
                  <div className="w-12 h-12 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
                  <p className="font-bold text-amber-200 text-sm">Starting camera feed...</p>
                  <p className="text-xs text-stone-400">Please grant camera permission when prompted</p>
                </div>
              )}

              {/* Error State Overlay */}
              {cameraState === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 max-w-sm mx-auto bg-[#1A0E17] z-20">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h4 className="font-display font-black text-base text-rose-300">
                    Camera Access Needed
                  </h4>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    {errorMessage || 'Unable to start camera. Try Retry or use Gallery.'}
                  </p>

                  {/* Action: Upload photo to frame */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-[#DC2626] text-white font-bold text-xs shadow-md flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-[#FEF08A]" />
                    <span>Upload Pandal Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => startCamera(facingMode)}
                    className="text-xs text-amber-300 underline font-bold hover:text-white cursor-pointer"
                  >
                    Retry Camera Access
                  </button>
                </div>
              )}

              {/* Live Branded Frame Overlay (Visual Preview) - visible when ready */}
              {cameraState === 'ready' && (() => {
                const liveStatus = getCurrentPujaStatus();
                const cityName = pandal.city === 'kolkata' ? 'Kolkata' : 'Contai';
                return (
                  <div className="absolute inset-0 pointer-events-none border-[12px] border-[#881337] shadow-inner">
                    {/* Inner Gold Pinstripe */}
                    <div className="absolute inset-1 border-2 border-[#F59E0B]/80 rounded-sm pointer-events-none">
                      {/* Top Festive Crest */}
                      <div className="absolute top-2 left-0 right-0 text-center">
                        <span className="px-3 py-1 rounded-full bg-[#881337]/90 text-[#FEF08A] font-extrabold text-[10px] tracking-wider uppercase border border-[#F59E0B]/50 shadow-md">
                          ✨ PujaTrip • {liveStatus.bengaliText} ({liveStatus.englishText}) ✨
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
                              {pandal.bengaliName} • {pandal.zone} • {cityName}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 block mb-0.5">
                              ✓ Darshan 2026
                            </span>
                            <span className="text-[8px] font-bold text-amber-200 block">
                              {liveStatus.bengaliText}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
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

        {/* Clickable QR Preview Cards: PujaTrip & Developer Portfolio */}
        <div className="px-3 py-2 bg-[#1d0e19] border-t border-[#F59E0B]/25 flex items-center justify-between gap-2.5 text-xs">
          <a
            href={PUJATRIP_WEBSITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center gap-2 p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-[#F59E0B]/35 hover:border-[#F59E0B]/70 shadow-xs transition-all active:scale-95 group cursor-pointer"
            title="Scan or click to open PujaTrip"
          >
            <div className="w-9 h-9 rounded-lg bg-[#FFFDF5] p-0.5 border border-[#F59E0B]/70 shadow-xs shrink-0 flex items-center justify-center">
              <img src="/assets/share/qr-pujatrip.png" alt="PujaTrip QR Code" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0 leading-tight">
              <div className="font-display font-black text-[11px] text-white flex items-center gap-1 group-hover:text-[#FEF08A] transition-colors">
                <span>OPEN PUJATRIP</span>
                <ExternalLink className="w-2.5 h-2.5 text-amber-300 opacity-80" />
              </div>
              <div className="text-[9px] text-[#FEF08A]/80 font-medium">
                Scan or Click
              </div>
            </div>
          </a>

          <div className="h-7 w-[1px] bg-[#F59E0B]/30 shrink-0" />

          <a
            href={DEVELOPER_PORTFOLIO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center gap-2 p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-[#F59E0B]/35 hover:border-[#F59E0B]/70 shadow-xs transition-all active:scale-95 group cursor-pointer"
            title="Scan or click to open Developer Portfolio"
          >
            <div className="w-9 h-9 rounded-lg bg-[#FFFDF5] p-0.5 border border-[#F59E0B]/70 shadow-xs shrink-0 flex items-center justify-center">
              <img src="/assets/share/qr-portfolio.png" alt="Developer Portfolio QR Code" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0 leading-tight">
              <div className="font-display font-black text-[11px] text-white flex items-center gap-1 group-hover:text-[#FEF08A] transition-colors">
                <span className="truncate">DEVELOPER PORTFOLIO</span>
                <ExternalLink className="w-2.5 h-2.5 text-amber-300 opacity-80" />
              </div>
              <div className="text-[9px] text-[#FEF08A]/80 font-medium truncate">
                Amit Kiran Kar
              </div>
            </div>
          </a>
        </div>

        {/* Bottom Action Controls */}
        <div className="p-4 bg-[#23141F] border-t border-[#F59E0B]/30 flex items-center justify-between gap-3">
          {capturedImage ? (
            /* Actions after Photo Capture */
            <div className="w-full flex items-center justify-between gap-2">
              <button
                onClick={handleRetake}
                className="px-3.5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>Retake</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-[#FEF08A]" />
                  <span>Share</span>
                </button>

                <button
                  onClick={handleDownload}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#DC2626] to-[#991B1B] hover:brightness-110 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
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
                disabled={cameraState !== 'ready'}
                className="p-3 rounded-2xl bg-black/40 hover:bg-black/60 border border-white/15 text-stone-200 hover:text-white transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
                title="Flip camera (front / back)"
              >
                <RefreshCw className="w-5 h-5 text-[#FEF08A]" />
              </button>

              {/* Shutter Button with Concentric Rings */}
              <button
                type="button"
                onClick={handleSnapPhoto}
                disabled={cameraState !== 'ready'}
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
                className="p-3 rounded-2xl bg-black/40 hover:bg-black/60 border border-white/15 text-stone-200 hover:text-white transition-all active:scale-95 cursor-pointer"
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
