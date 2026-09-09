import React, { useState, useEffect, useRef } from 'react';
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
  ExternalLink,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  Footprints,
} from 'lucide-react';

interface RouteShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: TripPlan;
  sequencePandals: Pandal[];
  plannedItinerary: PlannedItinerary;
  activeCity: CityId;
  isDarkMode?: boolean;
}

export const RouteShareModal: React.FC<RouteShareModalProps> = ({
  isOpen,
  onClose,
  trip,
  sequencePandals,
  plannedItinerary,
  activeCity,
  isDarkMode = false,
}) => {
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'image'>('whatsapp');
  const [copiedTextToast, setCopiedTextToast] = useState(false);
  const [copiedImageToast, setCopiedImageToast] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate deep link
  const generateShareUrl = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://pujatrip.app';
    const stopIds = sequencePandals.map((p) => p.id).join(',');
    return `${baseUrl}/?city=${activeCity}&tripName=${encodeURIComponent(trip.name)}&stops=${stopIds}`;
  };

  // Generate formatted WhatsApp text summary
  const generateWhatsAppText = () => {
    const cityLabel = activeCity === 'kolkata' ? 'Kolkata' : 'Contai';
    const bengaliCity = activeCity === 'kolkata' ? 'কলকাতা' : 'কাঁথি';
    const shareUrl = generateShareUrl();

    let text = `🎉 *শুভ শারদীয়া! Join our Durga Puja Route: ${trip.name}*\n`;
    text += `📍 *City:* ${cityLabel} (${bengaliCity}) | 📅 *Date:* ${trip.date || 'Mahasaptami'}\n`;
    text += `⏰ *Timings:* ${plannedItinerary.summary.plannedStartTime} → ${plannedItinerary.summary.plannedEndTime}\n`;
    text += `🚶 *Total Walking:* ${plannedItinerary.summary.formattedTotalWalkingDistance} (${sequencePandals.length} pandal stops)\n\n`;
    text += `🏆 *PLANNED PANDAL ITINERARY:*\n`;

    sequencePandals.forEach((p, idx) => {
      const wait = p.queueWaitMinutes ? `~${p.queueWaitMinutes}m queue` : 'Low crowd';
      text += `${idx + 1}. *${p.name}* (${p.bengaliName})\n`;
      text += `   📍 ${p.area} • ⏱️ ${wait}\n`;
    });

    text += `\n✨ *Open, track and customize this route on PujaTrip:* \n${shareUrl}`;
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

  // Draw the festival itinerary image on canvas
  const generateItineraryCanvas = () => {
    setIsGeneratingImage(true);
    const canvas = document.createElement('canvas');
    canvasRef.current = canvas;

    // High resolution canvas for sharp text on mobile retina displays
    const width = 1080;
    const padding = 64;
    const headerHeight = 320;
    const stopItemHeight = 85;
    const stopsToRender = sequencePandals.slice(0, 8); // Render up to 8 key stops cleanly
    const contentHeight = stopsToRender.length * stopItemHeight;
    const footerHeight = 160;
    const height = headerHeight + contentHeight + footerHeight;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsGeneratingImage(false);
      return;
    }

    // 1. Festive Vermilion / Royal Red Gradient Background
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#881337'); // Rose 900
    bgGradient.addColorStop(0.4, '#991B1B'); // Red 800
    bgGradient.addColorStop(1, '#450A0A'); // Red 950
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // 2. Decorative Gold Border
    ctx.strokeStyle = '#FDE68A'; // Amber 200
    ctx.lineWidth = 6;
    ctx.strokeRect(28, 28, width - 56, height - 56);

    ctx.strokeStyle = 'rgba(253, 230, 138, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(38, 38, width - 76, height - 76);

    // 3. Corner Motif Accents
    const drawCornerAccent = (x: number, y: number) => {
      ctx.save();
      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
    drawCornerAccent(48, 48);
    drawCornerAccent(width - 48, 48);
    drawCornerAccent(48, height - 48);
    drawCornerAccent(width - 48, height - 48);

    // 4. Header: Logo & Festival Title
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FEF08A'; // Gold
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText('PUJATRIP • শারদ পরিক্রমা', width / 2, 95);

    // Trip Name
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 48px sans-serif';
    ctx.fillText(trip.name, width / 2, 160);

    // Bengali & City Tag
    const cityText = activeCity === 'kolkata' ? 'কলকাতা • KOLKATA' : 'কাঁথি • CONTAI';
    ctx.fillStyle = '#FDE68A';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(`${cityText} | 📅 ${trip.date || 'Durga Puja 2026'}`, width / 2, 205);

    // Metric Badges Strip
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.roundRect(padding, 235, width - padding * 2, 65, 20);
    ctx.fill();

    ctx.fillStyle = '#FEF08A';
    ctx.font = 'bold 24px sans-serif';
    const metricsString = `⏱️ ${plannedItinerary.summary.plannedStartTime} - ${plannedItinerary.summary.plannedEndTime}   •   📍 ${sequencePandals.length} Pandals   •   🚶 ${plannedItinerary.summary.formattedTotalWalkingDistance} Walking`;
    ctx.fillText(metricsString, width / 2, 276);

    // 5. Render Pandal Stops List
    let currentY = headerHeight + 10;
    stopsToRender.forEach((pandal, idx) => {
      // Row Background Pill
      ctx.fillStyle = idx % 2 === 0 ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)';
      ctx.beginPath();
      ctx.roundRect(padding, currentY, width - padding * 2, 70, 16);
      ctx.fill();

      // Stop Number Circle
      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(padding + 35, currentY + 35, 22, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#881337';
      ctx.font = '900 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${idx + 1}`, padding + 35, currentY + 43);

      // Pandal English & Bengali Name
      ctx.textAlign = 'left';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(pandal.name, padding + 75, currentY + 33);

      ctx.fillStyle = '#FDE68A';
      ctx.font = 'normal 20px sans-serif';
      ctx.fillText(`(${pandal.bengaliName})`, padding + 75, currentY + 58);

      // Area & Wait Time Badge (Right Aligned)
      ctx.textAlign = 'right';
      ctx.fillStyle = '#E2E8F0';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(pandal.area, width - padding - 20, currentY + 34);

      ctx.fillStyle = '#FBBF24';
      ctx.font = 'normal 18px sans-serif';
      const wait = pandal.queueWaitMinutes ? `~${pandal.queueWaitMinutes}m wait` : 'Low crowd';
      ctx.fillText(wait, width - padding - 20, currentY + 58);

      currentY += stopItemHeight;
    });

    if (sequencePandals.length > stopsToRender.length) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FEF08A';
      ctx.font = 'italic bold 22px sans-serif';
      ctx.fillText(
        `+ ${sequencePandals.length - stopsToRender.length} more pandals in the complete itinerary`,
        width / 2,
        currentY + 15
      );
    }

    // 6. Footer
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(254, 240, 138, 0.8)';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('✨ Plan and explore with PujaTrip • শারদ শুভেচ্ছা', width / 2, height - 80);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '16px sans-serif';
    ctx.fillText('pujatrip.app', width / 2, height - 50);

    // Save as Data URL
    const dataUrl = canvas.toDataURL('image/png');
    setGeneratedImageUrl(dataUrl);
    setIsGeneratingImage(false);
  };

  // Generate image once opened or tab switched
  useEffect(() => {
    if (isOpen) {
      generateItineraryCanvas();
    }
  }, [isOpen, trip, sequencePandals]);

  // Download image file
  const handleDownloadImage = () => {
    if (!generatedImageUrl) return;
    const link = document.createElement('a');
    link.download = `${trip.name.toLowerCase().replace(/\s+/g, '-')}-itinerary.png`;
    link.href = generatedImageUrl;
    link.click();
    playKanshorBell(0.8);
  };

  // Native share image with WhatsApp support
  const handleShareImageDevice = async () => {
    if (!canvasRef.current) return;
    try {
      const canvas = canvasRef.current;
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `${trip.name}-route.png`, { type: 'image/png' });
        const shareData = {
          title: `PujaTrip: ${trip.name}`,
          text: `Check out our Durga Puja Itinerary!\n${generateShareUrl()}`,
          files: [file],
        };

        if (navigator.canShare && navigator.canShare(shareData)) {
          await navigator.share(shareData);
          playKanshorBell(0.8);
          onClose();
        } else {
          // If files share isn't supported, trigger download + WhatsApp message
          handleDownloadImage();
          handleOpenWhatsApp();
        }
      }, 'image/png');
    } catch (err) {
      console.warn('Native share failed, fallback to download:', err);
      handleDownloadImage();
    }
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
        className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden max-h-[92vh] flex flex-col ${
          isDarkMode
            ? 'bg-[#1C1418] border-amber-500/30 text-white'
            : 'bg-white border-amber-200 text-stone-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-md">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-h3 leading-tight text-stone-900 dark:text-white">
                Share Trip Route
              </h3>
              <p className="font-bengali text-micro text-[#DC2626] dark:text-[#FEF08A] font-bold">
                হোয়াটসঅ্যাপ বা ছবিতে সফরসূচি পাঠান
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="p-2 bg-stone-100 dark:bg-stone-900/80 border-b border-stone-200 dark:border-stone-800 flex gap-1.5 shrink-0">
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-btn flex items-center justify-center gap-2 transition-all ${
              activeTab === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp Text</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('image');
              if (!generatedImageUrl) generateItineraryCanvas();
            }}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-btn flex items-center justify-center gap-2 transition-all ${
              activeTab === 'image'
                ? 'bg-[#DC2626] text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Shareable Image Card</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'whatsapp' ? (
            /* WhatsApp Tab */
            <div className="space-y-3.5">
              {/* WhatsApp Action Hero Button */}
              <button
                id="btn-whatsapp-direct-share"
                onClick={handleOpenWhatsApp}
                className="w-full py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] active:scale-[0.98] text-white font-bold text-btn flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                <span>Open in WhatsApp & Send to Group</span>
              </button>

              {/* Formatted Text Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-micro font-bold text-stone-600 dark:text-stone-400">
                  <span>Formatted WhatsApp Message Preview:</span>
                  <button
                    onClick={handleCopyText}
                    className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    {copiedTextToast ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
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
                  <span>⏰ {plannedItinerary.summary.plannedStartTime} - {plannedItinerary.summary.plannedEndTime}</span>
                </div>
              </div>
            </div>
          ) : (
            /* Image Tab */
            <div className="space-y-3.5">
              <p className="text-micro text-stone-600 dark:text-stone-400">
                Generated festive itinerary poster ready to share as an image on WhatsApp, Instagram, or save to your photo gallery:
              </p>

              {/* Poster Preview */}
              {generatedImageUrl ? (
                <div className="rounded-2xl overflow-hidden border-2 border-amber-400/40 shadow-xl bg-stone-950 flex items-center justify-center p-1">
                  <img
                    src={generatedImageUrl}
                    alt="Festive Durga Puja Itinerary"
                    className="w-full max-h-80 object-contain rounded-xl"
                  />
                </div>
              ) : (
                <div className="h-64 rounded-2xl bg-stone-100 dark:bg-stone-900 flex items-center justify-center text-stone-500 text-small">
                  Rendering Sharad Parikrama poster...
                </div>
              )}

              {/* Action Buttons for Image */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={handleDownloadImage}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-[#DC2626] hover:brightness-110 active:scale-95 text-white font-bold text-btn flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Image (PNG)</span>
                </button>

                <button
                  onClick={handleShareImageDevice}
                  className="py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] active:scale-95 text-white font-bold text-btn flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Share Image to WhatsApp</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-micro text-stone-500 shrink-0">
          <span>PujaTrip Sharad Parikrama Sharing</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
