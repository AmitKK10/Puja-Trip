import React, { useState, useMemo } from 'react';
import { CityId, UserPreferences, UserWalkingEnergyConfig } from '../../types';
import { getPuja2026CalendarItems } from '../../data/festivalCalendar2026';
import { DurgaThirdEye, DhakIcon, ShankhaIcon, AlpanaCorner, AlpanaDivider } from '../common/BengaliMotifs';
import { DEVELOPER_PHOTO_DATA_URL, DEVELOPER_PHOTO_URL } from '../../data/developerPhoto';
import { PWAInstallCard } from '../common/PWAInstallCard';
import { playKanshorBell, playDhakHit } from '../../utils/audioSynth';
import {
  getWalkingEnergyConfig,
  saveWalkingEnergyConfig,
} from '../../services/walkingEnergyService';
import {
  MapPin,
  Moon,
  Sun,
  Volume2,
  Globe,
  Wifi,
  WifiOff,
  ShieldAlert,
  PhoneCall,
  Calendar,
  Ticket,
  Info,
  Sparkles,
  ChevronRight,
  Heart,
  Footprints,
  Coffee,
  Users,
  CheckCircle2,
} from 'lucide-react';

interface SettingsScreenProps {
  userPrefs: UserPreferences;
  onUpdatePrefs: (updater: (prev: UserPreferences) => UserPreferences) => void;
  onCityChange: (city: CityId) => void;
  onOpenSplash: () => void;
  onOpenDeveloper?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  userPrefs,
  onUpdatePrefs,
  onCityChange,
  onOpenSplash,
  onOpenDeveloper,
}) => {
  const isDarkMode = userPrefs.themeMode === 'mahasaptami_night';
  const [walkingConfig, setWalkingConfig] = useState<UserWalkingEnergyConfig>(() =>
    getWalkingEnergyConfig()
  );
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  const handleWalkingConfigChange = (patch: Partial<UserWalkingEnergyConfig>) => {
    const updated = saveWalkingEnergyConfig(patch);
    setWalkingConfig(updated);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2000);
  };

  const pujaCalendar = useMemo(() => getPuja2026CalendarItems(), []);

  return (
    <div id="settings-screen" className="space-y-4 pb-12 animate-fadeIn">
      {/* Header Profile Card */}
      <div
        className={`p-4 sm:p-5 rounded-3xl border shadow-lg relative overflow-hidden ${
          isDarkMode
            ? 'bg-gradient-to-br from-[#3B1324] via-[#281B23] to-[#1C1418] border-[#F59E0B]/30 text-white'
            : 'bg-gradient-to-br from-[#881337] via-[#991B1B] to-[#7F1D1D] border-[#FDE68A]/30 text-white'
        }`}
      >
        <AlpanaCorner position="top-right" size={42} color="#FDE68A" className="absolute top-1 right-1 opacity-25" />

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center p-2 shadow-inner">
            <DurgaThirdEye size={36} color="#FFFDF9" />
          </div>
          <div>
            <h2 className="font-display font-black text-h1 text-white">PujaTrip Settings</h2>
            <p className="font-bengali-serif text-h4 text-[#FEF08A] font-bold">
              শারদ পরিক্রমা ও অ্যাপ সেটিংস
            </p>
          </div>
        </div>
      </div>

      {/* PWA Standalone App Installation & Status */}
      <PWAInstallCard variant="settings" isDarkMode={isDarkMode} />

      {/* 1. City & Region Preference */}
      <div
        className={`p-4 rounded-3xl border shadow-sm space-y-3 ${
          isDarkMode ? 'bg-[#281B23] border-[#F59E0B]/20 text-white' : 'bg-white border-[#D97706]/20 text-stone-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#DC2626]" />
          <h3 className="font-display font-bold text-h3 text-[#881337] dark:text-[#FEF08A]">
            Active Region / City (শহর নির্বাচন)
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => onCityChange('kolkata')}
            className={`p-3 rounded-2xl border text-center transition-all ${
              userPrefs.activeCity === 'kolkata'
                ? 'bg-gradient-to-r from-[#991B1B] to-[#DC2626] text-white border-[#FEF08A]/40 shadow-sm font-bold'
                : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
            }`}
          >
            <span className="font-display block text-h3 font-bold">Kolkata</span>
            <span className="font-bengali-serif text-small font-bold opacity-90">কলকাতা</span>
          </button>

          <button
            onClick={() => onCityChange('contai')}
            className={`p-3 rounded-2xl border text-center transition-all ${
              userPrefs.activeCity === 'contai'
                ? 'bg-gradient-to-r from-[#B45309] to-[#D97706] text-white border-[#FEF08A]/40 shadow-sm font-bold'
                : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
            }`}
          >
            <span className="font-display block text-h3 font-bold">Contai (Kanthi)</span>
            <span className="font-bengali-serif text-small font-bold opacity-90">কাঁথি</span>
          </button>
        </div>
      </div>

      {/* 2. Visual Theme Customization */}
      <div
        className={`p-4 rounded-3xl border shadow-sm space-y-3 ${
          isDarkMode ? 'bg-[#281B23] border-[#F59E0B]/20 text-white' : 'bg-white border-[#D97706]/20 text-stone-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <Moon className="w-4 h-4 text-[#D97706]" />
          <h3 className="font-display font-bold text-h3 text-[#881337] dark:text-[#FEF08A]">
            Visual Theme Atmosphere
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-2 text-btn font-semibold">
          <button
            onClick={() => onUpdatePrefs((p) => ({ ...p, themeMode: 'festive_vermilion' }))}
            className={`p-2.5 rounded-2xl border text-center flex flex-col items-center gap-1 transition-all ${
              userPrefs.themeMode === 'festive_vermilion'
                ? 'bg-[#991B1B] text-white border-[#FEF08A] shadow-sm font-bold'
                : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 text-stone-700 dark:text-stone-300'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-[#DC2626] border border-white" />
            <span className="text-small font-bold">Vermilion</span>
            <span className="text-micro font-bengali opacity-80">সিঁদুর লাল</span>
          </button>

          <button
            onClick={() => onUpdatePrefs((p) => ({ ...p, themeMode: 'mahasaptami_night' }))}
            className={`p-2.5 rounded-2xl border text-center flex flex-col items-center gap-1 transition-all ${
              userPrefs.themeMode === 'mahasaptami_night'
                ? 'bg-[#1C1418] text-[#FEF08A] border-[#F59E0B] shadow-sm font-bold'
                : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 text-stone-700 dark:text-stone-300'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-[#281B23] border border-[#F59E0B]" />
            <span className="text-small font-bold">Pujo Night</span>
            <span className="text-micro font-bengali opacity-80">রাতের আলো</span>
          </button>

          <button
            onClick={() => onUpdatePrefs((p) => ({ ...p, themeMode: 'kora_cream' }))}
            className={`p-2.5 rounded-2xl border text-center flex flex-col items-center gap-1 transition-all ${
              userPrefs.themeMode === 'kora_cream'
                ? 'bg-[#F7F3E8] text-[#881337] border-[#D97706] shadow-sm font-bold'
                : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 text-stone-700 dark:text-stone-300'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-[#FDFBF7] border border-[#D97706]" />
            <span className="text-small font-bold">Kora Cotton</span>
            <span className="text-micro font-bengali opacity-80">কোরা শাড়ি</span>
          </button>
        </div>
      </div>

      {/* 3. Audio & Dhak Rhythm Settings */}
      <div
        className={`p-4 rounded-3xl border shadow-sm space-y-3 ${
          isDarkMode ? 'bg-[#281B23] border-[#F59E0B]/20 text-white' : 'bg-white border-[#D97706]/20 text-stone-800'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DhakIcon size={20} />
            <h3 className="font-display font-bold text-h3 text-[#881337] dark:text-[#FEF08A]">
              Bengali Dhak & Sound FX
            </h3>
          </div>
          <button
            onClick={() => playKanshorBell(0.6)}
            className="text-btn text-[#DC2626] font-bold hover:underline"
          >
            Test Bell 🔔
          </button>
        </div>

        <div className="flex items-center justify-between text-small pt-1">
          <span className="text-stone-600 dark:text-stone-300">Milestone Dhak & Confetti Celebrations</span>
          <input
            type="checkbox"
            checked={userPrefs.soundEnabled}
            onChange={(e) => onUpdatePrefs((p) => ({ ...p, soundEnabled: e.target.checked }))}
            className="w-4 h-4 accent-[#991B1B]"
          />
        </div>
      </div>

      {/* 4. Walking & Energy Intelligence Limits (Requirement 3) */}
      <div
        id="walking-energy-config-section"
        className={`p-4 rounded-3xl border shadow-sm space-y-4 ${
          isDarkMode
            ? 'bg-[#281B23] border-[#F59E0B]/20 text-white'
            : 'bg-white border-[#D97706]/20 text-stone-800'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Footprints className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-h3 text-[#881337] dark:text-[#FEF08A]">
                Walking & Energy Limits (হাঁটার সীমা নিয়ন্ত্রণ)
              </h3>
              <p className="font-bengali text-micro text-stone-500 dark:text-stone-400">
                ক্লান্তিহীন আনন্দ ও সঠিক পরিভ্রমণ
              </p>
            </div>
          </div>

          {isSavedNotice && (
            <span className="text-micro font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Saved</span>
            </span>
          )}
        </div>

        {/* Sliders & Configurations */}
        <div className="space-y-4 pt-1">
          {/* Maximum Daily Walking Limit */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-small">
              <span className="font-semibold text-stone-700 dark:text-stone-200">
                Maximum Daily Walking Target
              </span>
              <span className="font-display font-black text-amber-700 dark:text-amber-400 tabular-nums">
                {walkingConfig.maxWalkingLimitKm} km
              </span>
            </div>
            <input
              type="range"
              min="4"
              max="16"
              step="0.5"
              value={walkingConfig.maxWalkingLimitKm}
              onChange={(e) =>
                handleWalkingConfigChange({ maxWalkingLimitKm: parseFloat(e.target.value) })
              }
              className="w-full accent-[#DC2626]"
            />
            <p className="text-micro text-stone-500">
              Trigger 80% advisory (at {(walkingConfig.maxWalkingLimitKm * 0.8).toFixed(1)} km) & prioritize transit when reached.
            </p>
          </div>

          {/* Comfortable Limit */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-small">
              <span className="font-semibold text-stone-700 dark:text-stone-200">
                Comfortable Walking Limit
              </span>
              <span className="font-display font-black text-amber-700 dark:text-amber-400 tabular-nums">
                {walkingConfig.comfortableWalkingLimitKm} km
              </span>
            </div>
            <input
              type="range"
              min="3"
              max="12"
              step="0.5"
              value={walkingConfig.comfortableWalkingLimitKm}
              onChange={(e) =>
                handleWalkingConfigChange({ comfortableWalkingLimitKm: parseFloat(e.target.value) })
              }
              className="w-full accent-[#D97706]"
            />
            <p className="text-micro text-stone-500">
              Pacing threshold before recommending Metro or Auto for longer legs.
            </p>
          </div>

          {/* Max Continuous Walking Mins */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-small">
              <span className="font-semibold text-stone-700 dark:text-stone-200">
                Continuous Walking Alert Threshold
              </span>
              <span className="font-display font-black text-teal-700 dark:text-teal-400 tabular-nums">
                {walkingConfig.maxContinuousWalkingMins} mins
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[30, 45, 60, 90].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => handleWalkingConfigChange({ maxContinuousWalkingMins: mins })}
                  className={`py-1.5 rounded-xl text-small font-bold border transition-all ${
                    walkingConfig.maxContinuousWalkingMins === mins
                      ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                      : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
            <p className="text-micro text-stone-500">
              Notifies you to take a tea/mishti break when walking non-stop without rest.
            </p>
          </div>

          {/* Share with Squad toggle */}
          <div className="pt-2 border-t border-stone-200/60 dark:border-stone-800 flex items-center justify-between text-small">
            <div>
              <span className="font-semibold text-stone-700 dark:text-stone-200 block">
                Share Walking Activity with Squad
              </span>
              <span className="text-micro text-stone-500">
                Allow friends in Group View to see your approximate km & steps.
              </span>
            </div>
            <input
              type="checkbox"
              checked={walkingConfig.shareWalkingStats}
              onChange={(e) =>
                handleWalkingConfigChange({ shareWalkingStats: e.target.checked })
              }
              className="w-4 h-4 accent-[#991B1B]"
            />
          </div>

          {/* Non-medical Disclaimer */}
          <div className="pt-1 flex items-start gap-1.5 text-[11px] text-stone-400">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              Disclaimer: Walking metrics are non-medical approximations calculated from GPS displacement and route steps.
            </span>
          </div>
        </div>
      </div>

      {/* 4. Emergency Puja Police & Medical Helpline Numbers */}
      <div
        id="emergency-contacts-section"
        className={`p-4 rounded-3xl border shadow-sm space-y-3 ${
          isDarkMode
            ? 'bg-gradient-to-br from-[#3B1324]/60 to-[#281B23] border-red-500/30 text-white'
            : 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200 text-stone-900'
        }`}
      >
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <ShieldAlert className="w-5 h-5" />
          <h3 className="font-display font-black text-h4 uppercase tracking-wider">
            Official 24x7 Puja Helplines (জরুরী সহায়তা)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-small">
          <a
            href="tel:100"
            className="flex items-center justify-between p-2.5 rounded-2xl bg-white dark:bg-black/30 border border-stone-200 dark:border-stone-800 shadow-sm"
          >
            <div>
              <span className="font-bold block text-small">Kolkata Police Puja Control Room</span>
              <span className="text-micro text-stone-500">Toll-Free Emergency</span>
            </div>
            <span className="font-black text-[#DC2626] bg-red-100 dark:bg-red-950/60 px-2.5 py-1 rounded-xl tabular-nums text-btn">
              100 / 1090
            </span>
          </a>

          <a
            href="tel:03220255100"
            className="flex items-center justify-between p-2.5 rounded-2xl bg-white dark:bg-black/30 border border-stone-200 dark:border-stone-800 shadow-sm"
          >
            <div>
              <span className="font-bold block text-small">Contai Police Station (Purba Medinipur)</span>
              <span className="text-micro text-stone-500">Kanthi Town Hub</span>
            </div>
            <span className="font-black text-[#D97706] bg-amber-100 dark:bg-amber-950/60 px-2.5 py-1 rounded-xl tabular-nums text-btn">
              03220-255100
            </span>
          </a>

          <a
            href="tel:1091"
            className="flex items-center justify-between p-2.5 rounded-2xl bg-white dark:bg-black/30 border border-stone-200 dark:border-stone-800 shadow-sm"
          >
            <div>
              <span className="font-bold block text-small">Women Safety Mitra (Tejaswini)</span>
              <span className="text-micro text-stone-500">24x7 Night Patrol Team</span>
            </div>
            <span className="font-black text-purple-600 bg-purple-100 dark:bg-purple-950/60 px-2.5 py-1 rounded-xl tabular-nums text-btn">
              1091
            </span>
          </a>

          <a
            href="tel:102"
            className="flex items-center justify-between p-2.5 rounded-2xl bg-white dark:bg-black/30 border border-stone-200 dark:border-stone-800 shadow-sm"
          >
            <div>
              <span className="font-bold block text-small">Ambulance & Medical Booth</span>
              <span className="text-micro text-stone-500">Red Cross & Mobile Clinic</span>
            </div>
            <span className="font-black text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-1 rounded-xl tabular-nums text-btn">
              102
            </span>
          </a>
        </div>
      </div>

      {/* 5. Puja Tithi Calendar Guide */}
      <div
        className={`p-4 rounded-3xl border shadow-sm space-y-3 ${
          isDarkMode ? 'bg-[#281B23] border-[#F59E0B]/20 text-white' : 'bg-white border-[#D97706]/20 text-stone-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#D97706]" />
          <h3 className="font-display font-bold text-h3 text-[#881337] dark:text-[#FEF08A]">
            Durga Puja 2026 Tithi Calendar
          </h3>
        </div>

        <div className="space-y-1.5 text-small">
          {pujaCalendar.map((item, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-xl flex items-center justify-between ${
                item.date.includes('Today')
                  ? 'bg-[#991B1B]/15 border border-[#DC2626]/30 font-semibold'
                  : 'bg-stone-50 dark:bg-stone-800/40'
              }`}
            >
              <div>
                <span className="font-bold text-stone-900 dark:text-white text-small">{item.day}</span>
                <span className="font-bengali-serif text-micro text-[#DC2626] ml-1.5 font-bold">({item.bn})</span>
                <p className="text-micro text-stone-500">{item.ritual}</p>
              </div>
              <span className="text-micro font-bold text-[#D97706] shrink-0 tabular-nums">{item.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 6. About Developer Section */}
      <div
        id="about-developer-settings-card"
        onClick={onOpenDeveloper}
        className={`p-4 rounded-3xl border shadow-sm transition-all cursor-pointer hover:shadow-md hover:scale-[1.01] ${
          isDarkMode
            ? 'bg-gradient-to-br from-[#3B1324]/70 via-[#281B23] to-[#1C1418] border-[#F59E0B]/30 text-white'
            : 'bg-gradient-to-br from-[#FFF5F5] via-[#FFFDF9] to-[#FEF3C7]/40 border-[#DC2626]/20 text-stone-900'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Developer avatar */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#991B1B] via-[#DC2626] to-[#B45309] p-0.5 flex items-center justify-center shrink-0 shadow-md ring-1 ring-amber-300/40">
              <img
                src={DEVELOPER_PHOTO_DATA_URL}
                alt="Amit Kiran Kar"
                className="w-full h-full rounded-full object-cover object-center shadow-inner"
                loading="lazy"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src !== window.location.origin + DEVELOPER_PHOTO_URL) {
                    target.src = DEVELOPER_PHOTO_URL;
                  }
                }}
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-display font-black text-h3 text-stone-950 dark:text-white truncate">
                  About Developer
                </span>
                <span className="text-micro font-bold bg-[#DC2626]/10 text-[#991B1B] dark:text-[#FEF08A] px-2 py-0.5 rounded-full border border-[#DC2626]/20">
                  Amit Kiran Kar
                </span>
              </div>
              <p className="font-bengali text-small text-[#991B1B] dark:text-[#FEF08A] font-bold truncate">
                ডেভেলপার পরিচিতি • Software Engineer & MERN Developer
              </p>
              <p className="text-micro text-stone-500 dark:text-stone-400 truncate mt-0.5">
                Building practical, scalable and user-focused web applications.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-1 text-[#DC2626] dark:text-[#FEF08A] font-bold text-btn">
            <span className="hidden sm:inline">View Profile</span>
            <ChevronRight className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 7. Restart Splash / Reset & About */}
      <div className="text-center space-y-2 pt-2">
        <button
          onClick={onOpenSplash}
          className="text-btn font-bold text-[#DC2626] hover:underline"
        >
          View Opening Screen Again (পুনরায় সূচনা পাতা দেখুন)
        </button>

        <AlpanaDivider color="#D97706" className="w-40 mx-auto opacity-50" />

        {/* Small "Built by Amit Kiran Kar" entry at bottom of Settings */}
        <div className="pt-1">
          <button
            onClick={onOpenDeveloper}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-small font-display font-bold text-stone-800 dark:text-stone-200 hover:text-[#DC2626] dark:hover:text-[#FEF08A] transition-colors cursor-pointer"
          >
            <span>Built by Amit Kiran Kar</span>
            <span className="text-micro text-stone-400 font-normal">• About Developer →</span>
          </button>
        </div>

        <p className="text-micro text-stone-400 font-bengali max-w-md mx-auto leading-relaxed">
          PujaTrip • পূজাত্রিপ • Dedicated to the clay sculptors of Kumartuli, folk artists of Midnapore, and the immortal spirit of Bengal.
        </p>
      </div>
    </div>
  );
};
