import React, { useState } from 'react';
import { EmergencyContactNumber, CityId, UserPreferences } from '../../types';
import { getOfficialEmergencyNumbers } from '../../services/safetyAndUtilitiesService';
import { DurgaThirdEye, ShankhaIcon, DhakIcon, AlpanaCorner } from './BengaliMotifs';
import {
  Phone,
  Shield,
  Heart,
  HelpCircle,
  Copy,
  Check,
  AlertTriangle,
  X,
  ExternalLink,
  ShieldAlert,
  Info,
  Sparkles,
} from 'lucide-react';
import { playKanshorBell } from '../../utils/audioSynth';

interface EmergencyInformationModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCity: CityId;
  userPrefs: UserPreferences;
}

export const EmergencyInformationModal: React.FC<EmergencyInformationModalProps> = ({
  isOpen,
  onClose,
  activeCity,
  userPrefs,
}) => {
  const isDarkMode = userPrefs.themeMode === 'mahasaptami_night';
  const emergencyNumbers = getOfficialEmergencyNumbers(activeCity);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'national' | 'police' | 'medical' | 'women_child'>('all');

  if (!isOpen) return null;

  const handleCopy = (num: EmergencyContactNumber) => {
    navigator.clipboard.writeText(num.number.replace(/-/g, ''));
    setCopiedId(num.id);
    playKanshorBell(0.4);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredNumbers = emergencyNumbers.filter((n) => {
    if (activeFilter === 'all') return true;
    return n.category === activeFilter;
  });

  return (
    <div
      id="emergency-info-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="emergency-info-modal-card"
        className={`w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden animate-scaleUp ${
          isDarkMode
            ? 'bg-[#1C1418] border-[#DC2626]/40 text-stone-100'
            : 'bg-[#FFFDF9] border-[#DC2626]/30 text-stone-900'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`relative p-5 text-white flex items-start justify-between shrink-0 overflow-hidden ${
            isDarkMode
              ? 'bg-gradient-to-r from-[#7F1D1D] via-[#991B1B] to-[#450A0A]'
              : 'bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#7F1D1D]'
          }`}
        >
          <AlpanaCorner position="top-right" size={42} color="#FDE68A" className="absolute top-1 right-1 opacity-20" />
          <AlpanaCorner position="bottom-left" size={42} color="#FDE68A" className="absolute bottom-1 left-1 opacity-20" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shadow-inner text-2xl">
              🚨
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/25 text-amber-200 text-micro uppercase font-bold tracking-wider">
                <ShieldAlert className="w-3 h-3 text-amber-300" />
                <span>Verified Official Numbers</span>
              </div>
              <h2 className="font-display font-black text-h2 text-white mt-0.5">Emergency Helpline</h2>
              <p className="font-bengali text-small text-amber-100">
                জরুরি সরকারি হেল্পলাইন ও সার্বক্ষণিক পুলিশ-মেডিকেল সহায়তা
              </p>
            </div>
          </div>

          <button
            id="close-emergency-info-btn"
            onClick={onClose}
            className="relative z-10 w-9 h-9 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filters */}
        <div className="p-3 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#251A20] flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {[
            { id: 'all', label: 'All Contacts', icon: '📋' },
            { id: 'national', label: 'National (112)', icon: '🚨' },
            { id: 'police', label: 'Police', icon: '🚓' },
            { id: 'medical', label: 'Medical', icon: '🏥' },
            { id: 'women_child', label: 'Women & Child', icon: '🛡️' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-small font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                activeFilter === tab.id
                  ? 'bg-[#DC2626] text-white shadow-sm'
                  : 'bg-white dark:bg-[#341F28] text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-100'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Important Notice Box */}
          <div
            className={`p-3.5 rounded-2xl border text-small flex items-start gap-3 ${
              isDarkMode
                ? 'bg-amber-950/30 border-amber-500/30 text-amber-200'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Direct Emergency Assistance</p>
              <p className="text-micro mt-0.5 opacity-90 leading-relaxed">
                Tap the call button to open your phone dialer directly. PujaTrip does not make automated calls or send SMS without your confirmation.
              </p>
            </div>
          </div>

          {/* Emergency Numbers List */}
          <div className="space-y-2.5">
            {filteredNumbers.map((num) => {
              const isCopied = copiedId === num.id;

              return (
                <div
                  key={num.id}
                  id={`emergency-card-${num.id}`}
                  className={`p-4 rounded-2xl border transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isDarkMode
                      ? 'bg-[#2A1C22] border-stone-800 hover:border-red-900/60'
                      : 'bg-white border-stone-200 hover:border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900/50 flex items-center justify-center text-xl shrink-0">
                      {num.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display font-bold text-h4 text-stone-900 dark:text-stone-100">
                          {num.title}
                        </h3>
                        {num.badge && (
                          <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300 text-micro font-black uppercase">
                            {num.badge}
                          </span>
                        )}
                        {num.is24x7 && (
                          <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-micro font-bold">
                            24x7
                          </span>
                        )}
                      </div>
                      <p className="font-bengali text-small text-[#991B1B] dark:text-amber-300 font-semibold mt-0.5">
                        {num.bengaliTitle}
                      </p>
                      <p className="text-micro text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                        {num.description}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      id={`copy-btn-${num.id}`}
                      onClick={() => handleCopy(num)}
                      className={`px-3 py-2 rounded-xl text-small font-bold border transition-colors flex items-center gap-1.5 ${
                        isCopied
                          ? 'bg-emerald-500 text-white border-emerald-600'
                          : 'bg-stone-100 dark:bg-[#341F28] hover:bg-stone-200 dark:hover:bg-[#452735] text-stone-700 dark:text-stone-200 border-stone-300 dark:border-stone-700'
                      }`}
                      title="Copy Number"
                    >
                      {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span className="font-mono text-small">{num.number}</span>
                    </button>

                    <a
                      id={`call-btn-${num.id}`}
                      href={`tel:${num.number.replace(/-/g, '')}`}
                      className="px-4 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-small shadow-sm transition-transform active:scale-95 flex items-center gap-1.5"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Call</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Crowd Safety Tips */}
          <div
            className={`p-4 rounded-2xl border ${
              isDarkMode
                ? 'bg-[#251A20] border-stone-800 text-stone-300'
                : 'bg-stone-50 border-stone-200 text-stone-700'
            }`}
          >
            <div className="flex items-center gap-2 font-display font-bold text-h4 text-[#991B1B] dark:text-[#FDE68A]">
              <Info className="w-4 h-4" />
              <span>Durga Puja Crowd Safety Guidelines</span>
            </div>
            <ul className="mt-2.5 space-y-1.5 text-small list-disc list-inside opacity-90 leading-relaxed">
              <li>Keep children's identification cards or emergency phone tags attached to clothing.</li>
              <li>Establish a predetermined squad meeting point before entering high-density pandal queues.</li>
              <li>Follow designated entry (Probesh) and exit (Prosthan) gates instructed by Kolkata Police & volunteers.</li>
              <li>Drink water regularly from verified bio-sanitation and KMC hydration stalls.</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#251A20] flex items-center justify-between shrink-0">
          <div className="text-micro text-stone-500 dark:text-stone-400">
            Official WB Emergency Services • 2026
          </div>
          <button
            id="emergency-done-btn"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold text-small hover:opacity-90"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
