import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TripPlan, Pandal, PlannedItinerary, CityId } from '../../types';
import { playKanshorBell, playDhakHit } from '../../utils/audioSynth';
import {
  Share2,
  Download,
  Copy,
  Check,
  Image as ImageIcon,
  MessageCircle,
  X,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  Footprints,
  Trophy,
  CheckCircle2,
  Send,
} from 'lucide-react';

interface RouteShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: TripPlan;
  sequencePandals: Pandal[];
  plannedItinerary: PlannedItinerary;
  activeCity: CityId;
  visitedList?: string[];
  isDarkMode?: boolean;
}

export const RouteShareModal: React.FC<RouteShareModalProps> = ({
  isOpen,
  onClose,
  trip,
  sequencePandals,
  plannedItinerary,
  activeCity,
  visitedList = [],
  isDarkMode = false,
}) => {
  const [activeTab, setActiveTab] = useState<'image' | 'whatsapp'>('image');
  const [copiedTextToast, setCopiedTextToast] = useState(false);
  const [copiedImageToast, setCopiedImageToast] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const { visitedCount, completionPercentage } = useMemo(() => {
    const total = sequencePandals.length;
    if (total === 0) return { visitedCount: 0, completionPercentage: 0 };
    const visited = sequencePandals.filter((p) => visitedList.includes(p.id)).length;
    return {
      visitedCount: visited,
      completionPercentage: Math.round((visited / total) * 100),
    };
  }, [sequencePandals, visitedList]);

  // Generate deep link
  const generateShareUrl = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://pujatrip.app';
    const stopIds = sequencePandals.map((p) => p.id).join(',');
    return `${baseUrl}/?tab=route&city=${activeCity}&tripName=${encodeURIComponent(trip.name)}&stops=${stopIds}`;
  };

  // Generate formatted WhatsApp text summary
  const generateWhatsAppText = () => {
    const cityLabel = activeCity === 'kolkata' ? 'Kolkata' : 'Contai';
    const bengaliCity = activeCity === 'kolkata' ? 'কলকাতা' : 'কাঁথি';
    const shareUrl = generateShareUrl();
    const total = sequencePandals.length;

    let text = `🎉 *শুভ শারদীয়া! PujaTrip Itinerary: ${trip.name}*\n`;
    if (trip.bengaliName) {
      text += `✨ *${trip.bengaliName}*\n`;
    }
    text += `📍 *City:* ${cityLabel} (${bengaliCity}) | 📅 *Date:* ${trip.date || 'Mahasaptami 2026'}\n`;
    text += `⏰ *Timings:* ${plannedItinerary.summary.plannedStartTime} → ${plannedItinerary.summary.plannedEndTime}\n`;
    text += `🚶 *Total Walking:* ${plannedItinerary.summary.formattedTotalWalkingDistance} (${total} pandal stops)\n`;
    text += `🏆 *Darshan Completion:* ${completionPercentage}% (${visitedCount}/${total} pandals visited)\n\n`;
    text += `📋 *PANDAL ROUTE ITINERARY:*\n`;

    sequencePandals.forEach((p, idx) => {
      const isVisited = visitedList.includes(p.id);
      const icon = isVisited ? '✅' : '📍';
      const status = isVisited ? ' [✓ Darshan Completed]' : '';
      const wait = p.queueWaitMinutes ? `~${p.queueWaitMinutes}m queue` : 'Low crowd';
      text += `${icon} *${idx + 1}. ${p.name}* (${p.bengaliName})${status}\n`;
      text += `   ↳ ${p.area} • ⏱️ ${wait}\n`;
    });

    text += `\n🌟 *Track and customize this route live on PujaTrip:* \n${shareUrl}\n`;
    text += `_শারদোৎসব ২০২৬-এর আন্তরিক শুভেচ্ছা!_`;
    return text;
  };

  // Trigger WhatsApp share
  const handleOpenWhatsApp = () => {
    const text = generateWhatsAppText();
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    playKanshorBell(0.7);
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  // Copy text to clipboard
  const handleCopyText = async () => {
    const text = generateWhatsAppText();
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setCopiedTextToast(true);
        playDhakHit('ta', 0.6);
        setTimeout(() => setCopiedTextToast(false), 2500);
      }
    } catch {
      // Fallback
    }
  };

  // Draw the high-res PujaTrip Itinerary Poster on HTML5 Canvas
  const generateItineraryCanvas = () => {
    setIsGeneratingImage(true);
    const canvas = document.createElement('canvas');
    canvasRef.current = canvas;

    const width = 1080;
    const padding = 56;
    const headerHeight = 360;
    const progressSectionHeight = 120;
    const stopItemHeight = 92;
    const stopsToRender = sequencePandals.slice(0, 10); // Display up to 10 stops cleanly
    const contentHeight = stopsToRender.length * stopItemHeight;
    const footerHeight = 170;
    const height = headerHeight + progressSectionHeight + contentHeight + footerHeight;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsGeneratingImage(false);
      return;
    }

    // 1. Festive vermilion to deep crimson gradient backdrop
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#7F1D1D'); // Red 900
    bgGradient.addColorStop(0.3, '#991B1B'); // Red 800
    bgGradient.addColorStop(0.7, '#881337'); // Rose 900
    bgGradient.addColorStop(1, '#450A0A'); // Red 950
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Subtle background circular Alpona patterns
    ctx.save();
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.04)';
    ctx.lineWidth = 3;
    for (let r = 80; r <= 600; r += 70) {
      ctx.beginPath();
      ctx.arc(width / 2, headerHeight / 2 + 60, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // 2. Decorative Gold Double Border
    ctx.strokeStyle = '#FDE68A'; // Amber 200
    ctx.lineWidth = 6;
    ctx.strokeRect(24, 24, width - 48, height - 48);

    ctx.strokeStyle = 'rgba(253, 230, 138, 0.45)';
    ctx.lineWidth = 2;
    ctx.strokeRect(34, 34, width - 68, height - 68);

    // 3. Ornate Corner Alpona Accents
    const drawCornerFloret = (cx: number, cy: number) => {
      ctx.save();
      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#FEF08A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    };
    drawCornerFloret(46, 46);
    drawCornerFloret(width - 46, 46);
    drawCornerFloret(46, height - 46);
    drawCornerFloret(width - 46, height - 46);

    // 4. Header: Logo & Festival Title
    ctx.textAlign = 'center';

    // Little Festive Eyebrow
    ctx.fillStyle = '#FEF08A';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('🔱 PUJATRIP • শারদ পরিক্রমা ২০২৬ 🔱', width / 2, 85);

    // Main Itinerary Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 50px sans-serif';
    ctx.fillText(trip.name, width / 2, 150);

    // Bengali Trip Name
    if (trip.bengaliName) {
      ctx.fillStyle = '#FEF08A';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText(trip.bengaliName, width / 2, 195);
    }

    // City & Date
    const cityText = activeCity === 'kolkata' ? 'KOLKATA • কলকাতা' : 'CONTAI • কাঁথি';
    ctx.fillStyle = '#FDE68A';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`📍 ${cityText}   •   📅 ${trip.date || 'Maha Saptami 2026'}`, width / 2, 238);

    // Header Metrics Bar Pill
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.roundRect(padding, 265, width - padding * 2, 64, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(253, 230, 138, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#FEF08A';
    ctx.font = 'bold 23px sans-serif';
    const metricsString = `⏱️ ${plannedItinerary.summary.plannedStartTime} - ${plannedItinerary.summary.plannedEndTime}    •    🚶 ${plannedItinerary.summary.formattedTotalWalkingDistance} Walk    •    📍 ${sequencePandals.length} Stops`;
    ctx.fillText(metricsString, width / 2, 306);

    // 5. DARSHAN COMPLETION TRACKER (Visual progress bar on Canvas)
    const trackerY = headerHeight + 5;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.roundRect(padding, trackerY, width - padding * 2, 98, 20);
    ctx.fill();
    ctx.strokeStyle = completionPercentage === 100 ? '#10B981' : 'rgba(245, 158, 11, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Darshan Completion Label & Stat
    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 25px sans-serif';
    ctx.fillText('🏆 DARSHAN COMPLETION', padding + 24, trackerY + 38);

    ctx.fillStyle = '#FEF08A';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('শারদ দর্শন অগ্রগতি', padding + 345, trackerY + 38);

    // Percentage & Count (Right aligned)
    ctx.textAlign = 'right';
    ctx.fillStyle = completionPercentage === 100 ? '#86EFAC' : '#FDE68A';
    ctx.font = '900 28px sans-serif';
    ctx.fillText(
      `${completionPercentage}% Completed (${visitedCount}/${sequencePandals.length} Visited)`,
      width - padding - 24,
      trackerY + 38
    );

    // Progress Bar Track
    const barX = padding + 24;
    const barY = trackerY + 54;
    const barW = width - padding * 2 - 48;
    const barH = 24;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 12);
    ctx.fill();

    // Progress Bar Fill
    const fillWidth = Math.max((barW * completionPercentage) / 100, visitedCount > 0 ? 30 : 0);
    if (fillWidth > 0) {
      const barGradient = ctx.createLinearGradient(barX, 0, barX + fillWidth, 0);
      if (completionPercentage === 100) {
        barGradient.addColorStop(0, '#10B981');
        barGradient.addColorStop(1, '#34D399');
      } else {
        barGradient.addColorStop(0, '#F59E0B');
        barGradient.addColorStop(0.6, '#DC2626');
        barGradient.addColorStop(1, '#10B981');
      }
      ctx.fillStyle = barGradient;
      ctx.beginPath();
      ctx.roundRect(barX, barY, fillWidth, barH, 12);
      ctx.fill();
    }

    // 6. RENDER PANDAL STOPS LIST
    let currentY = headerHeight + progressSectionHeight + 15;
    stopsToRender.forEach((pandal, idx) => {
      const isVisited = visitedList.includes(pandal.id);

      // Row background card
      ctx.fillStyle = isVisited
        ? 'rgba(16, 185, 129, 0.12)'
        : idx % 2 === 0
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(255, 255, 255, 0.04)';
      ctx.beginPath();
      ctx.roundRect(padding, currentY, width - padding * 2, 78, 18);
      ctx.fill();

      // Border on row
      ctx.strokeStyle = isVisited ? 'rgba(52, 211, 153, 0.4)' : 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Stop Number or Checkmark Circle
      ctx.fillStyle = isVisited ? '#10B981' : '#FEF08A';
      ctx.beginPath();
      ctx.arc(padding + 42, currentY + 39, 24, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isVisited ? '#FFFFFF' : '#881337';
      ctx.font = '900 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isVisited ? '✓' : `${idx + 1}`, padding + 42, currentY + 48);

      // Pandal English & Bengali Name
      ctx.textAlign = 'left';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 27px sans-serif';
      const nameText = pandal.name.length > 28 ? pandal.name.slice(0, 27) + '…' : pandal.name;
      ctx.fillText(nameText, padding + 85, currentY + 36);

      ctx.fillStyle = '#FDE68A';
      ctx.font = 'normal 21px sans-serif';
      ctx.fillText(`${pandal.bengaliName} • ${pandal.area}`, padding + 85, currentY + 63);

      // Status Badge (Right aligned)
      ctx.textAlign = 'right';
      if (isVisited) {
        ctx.fillStyle = '#34D399';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText('✓ DARSHAN DONE', width - padding - 24, currentY + 38);

        ctx.fillStyle = '#A7F3D0';
        ctx.font = 'normal 18px sans-serif';
        ctx.fillText('দর্শন সম্পন্ন', width - padding - 24, currentY + 62);
      } else {
        ctx.fillStyle = '#FBBF24';
        ctx.font = 'bold 21px sans-serif';
        const wait = pandal.queueWaitMinutes ? `~${pandal.queueWaitMinutes}m queue` : 'Low queue';
        ctx.fillText(wait, width - padding - 24, currentY + 38);

        ctx.fillStyle = '#E2E8F0';
        ctx.font = 'normal 18px sans-serif';
        ctx.fillText(pandal.recommendationLevel || 'Recommended', width - padding - 24, currentY + 62);
      }

      currentY += stopItemHeight;
    });

    if (sequencePandals.length > stopsToRender.length) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FEF08A';
      ctx.font = 'italic bold 23px sans-serif';
      ctx.fillText(
        `+ ${sequencePandals.length - stopsToRender.length} more pandal stops in this complete circuit`,
        width / 2,
        currentY + 20
      );
    }

    // 7. FOOTER
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(254, 240, 138, 0.9)';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('✨ Track & Navigate Real-Time with PujaTrip • pujatrip.app ✨', width / 2, height - 90);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = '20px sans-serif';
    ctx.fillText('মায়ের কৃপায় আপনার ও আপনার পরিবারের শারদ পরিক্রমা আনন্দময় হোক • শুভ দুর্গোৎসব ২০২৬', width / 2, height - 55);

    // Save as Data URL
    try {
      const dataUrl = canvas.toDataURL('image/png');
      setGeneratedImageUrl(dataUrl);
    } catch (err) {
      console.error('Failed to convert canvas to data URL:', err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Generate image whenever opened or inputs change
  useEffect(() => {
    if (isOpen) {
      generateItineraryCanvas();
    }
  }, [isOpen, trip, sequencePandals, visitedList]);

  // Download image file
  const handleDownloadImage = () => {
    if (!generatedImageUrl) return;
    const link = document.createElement('a');
    const cleanName = trip.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    link.download = `pujatrip-${cleanName}-itinerary.png`;
    link.href = generatedImageUrl;
    link.click();
    playKanshorBell(0.8);
  };

  // Copy poster image directly to clipboard (for pasting in WhatsApp Web or Telegram)
  const handleCopyImageToClipboard = async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          setCopiedImageToast(true);
          playKanshorBell(0.8);
          setTimeout(() => setCopiedImageToast(false), 2500);
        } else {
          handleDownloadImage();
        }
      }, 'image/png');
    } catch {
      handleDownloadImage();
    }
  };

  // Native share poster image with WhatsApp support
  const handleSharePosterToWhatsApp = async () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `${trip.name}-puja-itinerary.png`, { type: 'image/png' });
      const textMsg = generateWhatsAppText();

      const shareData = {
        title: `PujaTrip Itinerary: ${trip.name}`,
        text: textMsg,
        files: [file],
      };

      if (navigator.canShare && navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData);
          playKanshorBell(0.8);
          playDhakHit('dha', 0.8);
          onClose();
          return;
        } catch (err: any) {
          if (err.name === 'AbortError') return;
        }
      }

      // If file sharing is not supported in current browser/context:
      // Download the poster and open WhatsApp web with the formatted text!
      handleDownloadImage();
      handleOpenWhatsApp();
    }, 'image/png');
  };

  if (!isOpen) return null;

  return (
    <div
      id="route-share-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="route-share-modal-content"
        className={`w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden max-h-[94vh] flex flex-col ${
          isDarkMode
            ? 'bg-[#1C1418] border-amber-500/30 text-white'
            : 'bg-white border-amber-200 text-stone-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#991B1B] via-[#DC2626] to-amber-600 text-white flex items-center justify-center shadow-md">
              <Share2 className="w-5 h-5 text-[#FEF08A]" />
            </div>
            <div>
              <h3 className="font-display font-black text-h3 leading-tight text-stone-900 dark:text-white">
                PujaTrip Itinerary Share
              </h3>
              <p className="font-bengali text-micro text-[#DC2626] dark:text-[#FEF08A] font-bold">
                হোয়াটসঅ্যাপে পাঠান বা পোস্টার ইমেজ ডাউনলোড করুন
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="p-2 bg-stone-100 dark:bg-stone-900/80 border-b border-stone-200 dark:border-stone-800 flex gap-1.5 shrink-0">
          <button
            onClick={() => {
              setActiveTab('image');
              if (!generatedImageUrl) generateItineraryCanvas();
            }}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-btn flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'image'
                ? 'bg-[#DC2626] text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Itinerary Poster (Canvas)</span>
          </button>

          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-btn flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp Text</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'image' ? (
            /* Image Poster Tab */
            <div className="space-y-4">
              {/* Darshan Completion Quick Pill */}
              <div className="p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/30 flex items-center justify-between gap-3 text-small">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="font-bold text-stone-800 dark:text-stone-200">
                    Darshan Progress: {completionPercentage}% ({visitedCount}/{sequencePandals.length})
                  </span>
                </div>
                <span className="text-micro font-bold text-[#DC2626] dark:text-[#FEF08A]">
                  Included on Poster
                </span>
              </div>

              {/* Poster Canvas Preview */}
              {isGeneratingImage ? (
                <div className="h-72 rounded-2xl bg-stone-100 dark:bg-stone-900 flex flex-col items-center justify-center gap-2 text-stone-500 text-small">
                  <div className="w-8 h-8 border-3 border-[#DC2626] border-t-transparent rounded-full animate-spin" />
                  <span>Generating high-res PujaTrip Itinerary poster...</span>
                </div>
              ) : generatedImageUrl ? (
                <div className="rounded-2xl overflow-hidden border-2 border-amber-400/50 shadow-xl bg-stone-950 flex items-center justify-center p-1">
                  <img
                    src={generatedImageUrl}
                    alt="PujaTrip Itinerary Poster"
                    className="w-full max-h-80 object-contain rounded-xl"
                  />
                </div>
              ) : null}

              {/* Main WhatsApp & Download Actions */}
              <div className="space-y-2">
                <button
                  id="btn-whatsapp-share-poster"
                  onClick={handleSharePosterToWhatsApp}
                  className="w-full py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] active:scale-[0.98] text-white font-bold text-btn flex items-center justify-center gap-2.5 shadow-lg transition-all cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5 fill-current" />
                  <span>Share Poster to WhatsApp</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleDownloadImage}
                    className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-[#DC2626] hover:brightness-110 active:scale-95 text-white font-bold text-btn flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PNG</span>
                  </button>

                  <button
                    onClick={handleCopyImageToClipboard}
                    className="py-2.5 px-3 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700 font-bold text-btn flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {copiedImageToast ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span>Image Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Image</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <p className="text-micro text-stone-500 dark:text-stone-400 text-center">
                High-resolution 1080px poster formatted for WhatsApp statuses, group chats, and photo galleries.
              </p>
            </div>
          ) : (
            /* WhatsApp Text Tab */
            <div className="space-y-3.5">
              {/* WhatsApp Action Hero Button */}
              <button
                id="btn-whatsapp-direct-share"
                onClick={handleOpenWhatsApp}
                className="w-full py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] active:scale-[0.98] text-white font-bold text-btn flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                <span>Open in WhatsApp & Send to Group</span>
              </button>

              {/* Formatted Text Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-micro font-bold text-stone-600 dark:text-stone-400">
                  <span>Formatted WhatsApp Itinerary Message:</span>
                  <button
                    onClick={handleCopyText}
                    className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    {copiedTextToast ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Text</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-3.5 rounded-2xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 font-mono text-small text-stone-800 dark:text-stone-200 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                  {generateWhatsAppText()}
                </div>
              </div>

              {/* Quick Trip Summary pill */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-small space-y-1">
                <div className="flex items-center gap-2 font-bold text-stone-800 dark:text-stone-200">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{trip.name}</span>
                </div>
                <div className="text-micro text-stone-600 dark:text-stone-400 flex flex-wrap gap-3 pt-0.5">
                  <span>📍 {sequencePandals.length} Stops</span>
                  <span>🚶 {plannedItinerary.summary.formattedTotalWalkingDistance} Walking</span>
                  <span>🏆 {completionPercentage}% Visited</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-micro text-stone-500 shrink-0">
          <span>PujaTrip Sharad Parikrama Itinerary</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
