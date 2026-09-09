import React, { useState } from 'react';
import { CityId } from '../../types';
import { DurgaThirdEye, ShankhaIcon, AlpanaCorner, AlpanaDivider } from '../common/BengaliMotifs';
import { playKanshorBell } from '../../utils/audioSynth';
import { Sparkles, MapPin, ArrowRight } from 'lucide-react';

interface SplashScreenProps {
  onStartApp: (chosenCity: CityId) => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onStartApp }) => {
  const [selectedCity, setSelectedCity] = useState<CityId>('kolkata');

  return (
    <div
      id="splash-screen"
      className="min-h-screen bg-gradient-to-b from-[#881337] via-[#991B1B] to-[#1C1418] text-white flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden select-none"
    >
      {/* Decorative Corner Alpana motifs */}
      <AlpanaCorner position="top-left" size={60} color="#FDE68A" className="absolute top-2 left-2 opacity-30" />
      <AlpanaCorner position="top-right" size={60} color="#FDE68A" className="absolute top-2 right-2 opacity-30" />
      <AlpanaCorner position="bottom-left" size={60} color="#FDE68A" className="absolute bottom-2 left-2 opacity-30" />
      <AlpanaCorner position="bottom-right" size={60} color="#FDE68A" className="absolute bottom-2 right-2 opacity-30" />

      {/* Floating background glowing orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 bg-[#F59E0B]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 left-10 w-48 h-48 bg-[#DC2626]/30 rounded-full blur-2xl pointer-events-none" />

      {/* Top Tagline */}
      <div className="pt-6 text-center relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-micro font-bold text-[#FEF08A] tracking-wider uppercase">
          <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span className="font-bengali tracking-wide font-bold">শারদোৎসব ২০২৬ • PWA Edition</span>
        </div>
      </div>

      {/* Centerpiece Visual & Branding */}
      <div className="my-auto py-6 flex flex-col items-center text-center relative z-10 max-w-sm mx-auto">
        {/* Devi Trinayan with radiating halo */}
        <div className="relative mb-4 flex items-center justify-center">
          <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-[#B45309] via-[#DC2626] to-[#FDE68A] p-0.5 shadow-2xl shadow-[#DC2626]/50 animate-festive-pulse">
            <div className="w-full h-full rounded-full bg-[#1C1418] flex items-center justify-center p-3">
              <DurgaThirdEye size={72} color="#FFFDF9" />
            </div>
          </div>
          {/* Subtle orbiting icon */}
          <div className="absolute -top-2 -right-2 w-9 h-9 rounded-full bg-[#DC2626] border-2 border-[#FEF08A] flex items-center justify-center shadow-lg">
            <ShankhaIcon size={20} />
          </div>
        </div>

        {/* Brand Name & Typography */}
        <h1 className="font-display font-black text-hero sm:text-[36px] tracking-tight text-white drop-shadow-md">
          Puja<span className="text-[#F59E0B]">Trip</span>
        </h1>
        <div className="font-bengali-serif text-h1 font-bold text-[#FEF08A] mt-1 tracking-wide drop-shadow-sm">
          পূজাত্রিপ পরিক্রমা
        </div>
        <p className="text-body text-stone-200 mt-2 font-normal leading-relaxed max-w-xs">
          Private Durga Puja pandal-hopping companion with live queue times, metro navigation & curated trails.
        </p>

        <AlpanaDivider color="#FDE68A" className="w-48 opacity-60 my-4" />

        {/* City Selection Toggle */}
        <div className="w-full bg-black/40 backdrop-blur-md p-3.5 rounded-2xl border border-[#F59E0B]/30 shadow-xl mt-2">
          <div className="text-h4 font-bold text-[#FEF08A] mb-2.5 flex items-center justify-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Select Your Pandal Hopping City:</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Kolkata Option */}
            <button
              id="splash-city-kolkata"
              onClick={() => setSelectedCity('kolkata')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                selectedCity === 'kolkata'
                  ? 'bg-gradient-to-b from-[#DC2626] to-[#991B1B] border-[#FEF08A] text-white shadow-lg ring-2 ring-[#FEF08A]/40'
                  : 'bg-white/5 border-white/10 text-stone-300 hover:bg-white/10'
              }`}
            >
              <span className="font-display font-bold text-h3">Kolkata</span>
              <span className="font-bengali text-small font-semibold opacity-95">কলকাতা</span>
              <span className="text-micro text-amber-200/80">North • South • Salt Lake</span>
            </button>

            {/* Contai Option */}
            <button
              id="splash-city-contai"
              onClick={() => setSelectedCity('contai')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                selectedCity === 'contai'
                  ? 'bg-gradient-to-b from-[#D97706] to-[#B45309] border-[#FEF08A] text-white shadow-lg ring-2 ring-[#FEF08A]/40'
                  : 'bg-white/5 border-white/10 text-stone-300 hover:bg-white/10'
              }`}
            >
              <span className="font-display font-bold text-h3">Contai (Kanthi)</span>
              <span className="font-bengali text-small font-semibold opacity-95">কাঁথি</span>
              <span className="text-micro text-amber-200/80">Central • Coastal • Folk</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom CTA Button */}
      <div className="pb-4 relative z-10 max-w-sm mx-auto w-full">
        <button
          id="splash-start-btn"
          onClick={() => {
            playKanshorBell(0.4);
            onStartApp(selectedCity);
          }}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#F59E0B] via-[#FBBF24] to-[#F59E0B] text-[#78350F] font-bold text-base shadow-xl shadow-[#F59E0B]/30 flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all"
        >
          <span className="font-display font-black tracking-wide text-h3">Enter PujaTrip</span>
          <span className="font-bengali font-bold text-h4 text-[#78350F]">• পূজাত্রিপ শুরু</span>
          <ArrowRight className="w-4 h-4 ml-0.5" />
        </button>

        <p className="text-micro text-center text-stone-300 mt-2.5 font-bengali font-medium">
          বলো দুর্গা মাই কি... জয়! • Shubho Sharadiya
        </p>
      </div>
    </div>
  );
};
