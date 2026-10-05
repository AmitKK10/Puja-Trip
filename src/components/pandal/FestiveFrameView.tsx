import React from 'react';
import { Pandal } from '../../types';
import { getCurrentPujaStatus, PujaFestivalStatus } from '../../utils/pujaDateStatus';
import { DurgaThirdEye } from '../common/BengaliMotifs';
import { DurgaFaceSilhouette } from '../common/DurgaFaceSilhouette';
import { PUJATRIP_WEBSITE_URL, DEVELOPER_PORTFOLIO_URL } from './FestiveFrameRenderer';
import { Globe, ExternalLink, MapPin, Briefcase } from 'lucide-react';

interface FestiveFrameViewProps {
  pandal: Pandal;
  customDate?: string;
  imageSrc?: string | null;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  isCameraLive?: boolean;
}

export const FestiveFrameView: React.FC<FestiveFrameViewProps> = ({
  pandal,
  customDate,
  imageSrc,
  videoRef,
  isCameraLive = false,
}) => {
  const status: PujaFestivalStatus = getCurrentPujaStatus(customDate);
  const cityName = pandal.city === 'kolkata' ? 'Kolkata' : 'Contai';

  return (
    <div
      id="festive-frame-container"
      className="relative w-full max-w-[420px] aspect-[9/16] mx-auto rounded-3xl overflow-hidden shadow-2xl border-4 border-[#F59E0B] bg-[#450712] select-none flex flex-col justify-between"
      style={{
        background: 'linear-gradient(180deg, #580816 0%, #7A0E22 12%, #35040D 45%, #500917 75%, #280208 100%)',
      }}
    >
      {/* 1. Top Decorative Festive Banner */}
      <div className="relative z-30 p-2.5 sm:p-3 bg-gradient-to-b from-[#5c0817]/95 via-[#700c1e]/90 to-transparent border-b-2 border-[#F59E0B]/60">
        <div className="flex items-center justify-between gap-1.5">
          {/* Logo & Brand text */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-11 rounded-xl bg-gradient-to-br from-[#DC2626] via-[#991B1B] to-[#78350F] p-1 border-2 border-amber-300 shadow-md flex items-center justify-center shrink-0">
              <DurgaThirdEye size={24} color="#FFFDF9" />
            </div>

            <div className="leading-tight">
              <div className="font-display font-black text-sm tracking-wider text-white">
                PUJATRIP
              </div>
              <div className="text-[8.5px] font-extrabold tracking-widest text-[#FEF08A] uppercase">
                KOLKATA & CONTAI
              </div>
              <div className="font-bengali-serif text-[11px] font-bold text-[#FDE68A] leading-none mt-0.5">
                শারদ পরিক্রমা
              </div>
            </div>
          </div>

          {/* Gold Divider */}
          <div className="h-8 w-[1.5px] bg-[#F59E0B]/60 shrink-0" />

          {/* Slogan */}
          <div className="text-right">
            <div className="font-bengali-serif font-bold text-[13px] sm:text-sm text-white drop-shadow-xs">
              মায়ের ডাকে পথে পথে...
            </div>
            <div className="flex items-center justify-end gap-1 mt-0.5 opacity-80">
              <span className="w-5 h-[1px] bg-[#FEF08A]" />
              <span className="w-1.5 h-1.5 rotate-45 bg-[#FEF08A]" />
              <span className="w-5 h-[1px] bg-[#FEF08A]" />
            </div>
          </div>

          {/* Premium Maa Durga Visual */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#991B1B]/80 via-[#7F1D1D]/90 to-[#450712] border-1.5 border-[#FEF08A]/70 p-0.5 flex items-center justify-center shrink-0 shadow-lg overflow-hidden">
            <img
              src="/assets/share/durga-devi.png"
              alt="Maa Durga"
              className="w-full h-full object-contain filter drop-shadow-xs"
            />
          </div>
        </div>
      </div>

      {/* 2. Central Photo Window with Inner Border & Vignette */}
      <div className="relative flex-1 mx-2.5 my-1 rounded-2xl overflow-hidden border-2 border-[#F59E0B] shadow-inner bg-black flex items-center justify-center">
        {/* Live video feed */}
        {isCameraLive && videoRef && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}

        {/* Captured photo */}
        {!isCameraLive && imageSrc && (
          <img
            src={imageSrc}
            alt={`Festive frame for ${pandal.name}`}
            className="w-full h-full object-cover"
          />
        )}

        {/* Soft dark vignette over the photo for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#200308]/90 via-transparent to-transparent pointer-events-none" />

        {/* Illuminated City Skyline silhouette along the bottom of the photo */}
        <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none opacity-85 overflow-hidden">
          <svg
            viewBox="0 0 500 80"
            className="w-full h-full object-cover text-[#FEF08A]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Howrah Bridge Silhouette */}
            <path
              d="M10 55 L220 55 M50 55 L50 20 L65 55 M170 55 L170 20 L155 55 M10 45 Q110 20 220 45 M50 20 Q110 30 170 20"
              stroke="#F59E0B"
              strokeWidth="2"
            />
            {/* Victoria Memorial Dome */}
            <path
              d="M270 55 L370 55 M270 55 L270 42 L370 42 L370 55 M320 26 A20 20 0 0 0 320 42 Z M320 26 L320 18"
              stroke="#FEF08A"
              strokeWidth="1.8"
              fill="rgba(254, 240, 138, 0.4)"
            />
            {/* River water ripples */}
            <line x1="20" y1="62" x2="180" y2="62" stroke="#FEF08A" strokeWidth="1" strokeOpacity="0.4" />
            <line x1="120" y1="68" x2="340" y2="68" stroke="#FEF08A" strokeWidth="1" strokeOpacity="0.5" />
            <line x1="40" y1="74" x2="260" y2="74" stroke="#FEF08A" strokeWidth="1" strokeOpacity="0.3" />
          </svg>
        </div>

        {/* 3. Bottom Overlays Inside Central Window */}
        <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-1.5 z-20 pointer-events-none">
          {/* Left: Dynamic Pandal Information Card */}
          <div className="flex-1 min-w-0 p-2 sm:p-2.5 rounded-xl bg-[#580816]/95 border border-[#F59E0B] shadow-lg backdrop-blur-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-5 h-5 rounded-full bg-red-600/80 border border-white/40 flex items-center justify-center shrink-0 text-white">
                <MapPin className="w-3 h-3 text-[#FEF08A]" />
              </div>
              <div className="min-w-0">
                <h4 className="font-display font-black text-xs sm:text-[13px] text-white truncate leading-tight">
                  {pandal.name}
                </h4>
                <p className="font-bengali text-[10px] text-[#FEF08A] font-bold truncate leading-tight mt-0.5">
                  {pandal.bengaliName} • {pandal.area || pandal.zoneLabel || cityName}
                </p>
                <p className="text-[8px] font-extrabold uppercase tracking-wider text-amber-200/90 leading-tight">
                  {cityName} • Durga Puja 2026
                </p>
              </div>
            </div>
          </div>

          {/* Right: Dynamic Festival Status Crest (MUTUALLY EXCLUSIVE) */}
          <div className="shrink-0 p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-[#FFFDF5] via-[#FEF9E6] to-[#FDE68A] border-2 border-[#D97706] shadow-lg text-center min-w-[125px]">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <span className="text-xs">🪔</span>
              <span className="font-bengali-serif font-black text-xs sm:text-sm text-[#991B1B] leading-none">
                {status.bengaliText}
              </span>
            </div>

            <div className="w-full h-[1px] bg-[#D97706]/40 my-0.5" />

            <div className="font-display font-black text-[9px] text-[#78350F] uppercase tracking-wider leading-tight">
              {status.englishText}
            </div>

            <div className="text-[8px] font-bold text-[#9A3412] leading-tight">
              {status.date}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Footer Strip with Scannable & Clickable QR Code Cards */}
      <div className="relative z-30 px-2 py-1.5 bg-gradient-to-t from-[#250308] via-[#3a050e] to-[#450712] border-t-2 border-[#F59E0B]/60">
        <div className="flex items-center justify-between gap-1 text-white">
          {/* Left Clickable QR Card: PujaTrip App */}
          <a
            href={PUJATRIP_WEBSITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open PujaTrip App"
            className="flex flex-col items-center p-1 rounded-xl bg-[#FFFDF5]/10 hover:bg-[#FFFDF5]/20 border border-[#F59E0B]/60 hover:border-[#F59E0B] shadow-xs transition-all active:scale-95 group cursor-pointer"
            title="Scan or click to open PujaTrip"
          >
            <div className="w-9 h-9 rounded-md bg-[#FFFDF5] p-0.5 border border-[#F59E0B] shadow-xs flex items-center justify-center">
              <img
                src="/assets/share/qr-pujatrip.png"
                alt="PujaTrip QR Code"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-display font-black text-[8px] text-white group-hover:text-[#FEF08A] transition-colors mt-0.5 tracking-wider uppercase flex items-center gap-0.5">
              OPEN PUJATRIP
              <ExternalLink className="w-2 h-2 text-amber-300 opacity-80" />
            </span>
          </a>

          {/* Center Hashtags */}
          <div className="text-center px-1 shrink-0">
            <div className="font-bengali text-[9.5px] font-bold text-[#FDE68A] leading-tight">
              #মায়েরডাকেপথেপথে
            </div>
            <div className="text-[8px] font-bold text-amber-200/80 leading-tight">
              #PujaTripMoments
            </div>
          </div>

          {/* Right Clickable QR Card: Developer Portfolio */}
          <a
            href={DEVELOPER_PORTFOLIO_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open Developer Portfolio of Amit Kiran Kar"
            className="flex flex-col items-center p-1 rounded-xl bg-[#FFFDF5]/10 hover:bg-[#FFFDF5]/20 border border-[#F59E0B]/60 hover:border-[#F59E0B] shadow-xs transition-all active:scale-95 group cursor-pointer"
            title="Scan or click to open Developer Portfolio"
          >
            <div className="w-9 h-9 rounded-md bg-[#FFFDF5] p-0.5 border border-[#F59E0B] shadow-xs flex items-center justify-center">
              <img
                src="/assets/share/qr-portfolio.png"
                alt="Developer Portfolio QR Code"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-display font-black text-[8px] text-white group-hover:text-[#FEF08A] transition-colors mt-0.5 tracking-wider uppercase flex items-center gap-0.5">
              <span className="truncate max-w-[85px]">DEVELOPER PORTFOLIO</span>
              <ExternalLink className="w-2 h-2 text-amber-300 opacity-80 shrink-0" />
            </span>
          </a>
        </div>
      </div>
    </div>
  );
};
