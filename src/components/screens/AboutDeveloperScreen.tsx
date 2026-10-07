import React from 'react';
import { UserPreferences } from '../../types';
import { DurgaThirdEye, AlpanaCorner, AlpanaDivider } from '../common/BengaliMotifs';
import { DEVELOPER_PHOTO_DATA_URL, DEVELOPER_PHOTO_URL } from '../../data/developerPhoto';
import {
  ArrowLeft,
  ExternalLink,
  Mail,
  Briefcase,
  GraduationCap,
  Code2,
  Layers,
  Award,
  Sparkles,
  CheckCircle2,
  Globe,
  Github,
  Linkedin,
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  MessageCircle,
  Terminal,
  MapPin,
  Calendar,
  FolderGit2,
  Flame,
  Star,
} from 'lucide-react';

interface AboutDeveloperScreenProps {
  userPrefs: UserPreferences;
  onBack: () => void;
}

export const AboutDeveloperScreen: React.FC<AboutDeveloperScreenProps> = ({
  userPrefs,
  onBack,
}) => {
  const isDarkMode = userPrefs.themeMode === 'mahasaptami_night';

  const socialLinks = [
    {
      name: 'WhatsApp',
      label: '+91 9563574862',
      url: 'https://wa.me/919563574862?text=Hello%20Amit%2C%20I%20found%20your%20profile%20through%20PujaTrip.',
      icon: MessageCircle,
      color: 'text-emerald-500 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      borderColor: 'border-emerald-500/30',
    },
    {
      name: 'Portfolio',
      label: 'amitkirankar.vercel.app',
      url: 'https://amitkirankar.vercel.app/',
      icon: Globe,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/10 dark:bg-amber-500/15',
      borderColor: 'border-amber-500/30',
    },
    {
      name: 'GitHub',
      label: 'github.com/AmitKK10',
      url: 'https://github.com/AmitKK10',
      icon: Github,
      color: 'text-stone-900 dark:text-stone-100',
      bgColor: 'bg-stone-500/10 dark:bg-stone-500/20',
      borderColor: 'border-stone-400/30',
    },
    {
      name: 'LinkedIn',
      label: 'linkedin.com/in/amit-kiran-kar',
      url: 'https://www.linkedin.com/in/amit-kiran-kar-975744277?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app',
      icon: Linkedin,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/10 dark:bg-blue-500/15',
      borderColor: 'border-blue-500/30',
    },
    {
      name: 'Instagram',
      label: '@amit_kiran_kar_10',
      url: 'https://www.instagram.com/amit_kiran_kar_10?stkn=dWN0bGwwNmU4cXRo',
      icon: Instagram,
      color: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-pink-500/10 dark:bg-pink-500/15',
      borderColor: 'border-pink-500/30',
    },
    {
      name: 'Facebook',
      label: 'Kingsumanamitkirankar10',
      url: 'https://www.facebook.com/Kingsumanamitkirankar10/',
      icon: Facebook,
      color: 'text-blue-700 dark:text-blue-300',
      bgColor: 'bg-blue-600/10 dark:bg-blue-600/15',
      borderColor: 'border-blue-600/30',
    },
    {
      name: 'YouTube',
      label: '@amitkirankar1007',
      url: 'https://youtube.com/@amitkirankar1007?si=hAOjAKONX82lddHb',
      icon: Youtube,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-500/10 dark:bg-red-500/15',
      borderColor: 'border-red-500/30',
    },
    {
      name: 'X (Twitter)',
      label: '@AmitKK1007',
      url: 'https://x.com/AmitKK1007',
      icon: Twitter,
      color: 'text-stone-800 dark:text-stone-200',
      bgColor: 'bg-stone-800/10 dark:bg-stone-300/10',
      borderColor: 'border-stone-500/30',
    },
  ];

  const skillGroups = [
    {
      category: 'Frontend',
      categoryBn: 'ফ্রন্টএন্ড',
      skills: ['React.js', 'Redux Toolkit', 'JavaScript / ES6+'],
      badgeColor: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20',
    },
    {
      category: 'Backend',
      categoryBn: 'ব্যাকএন্ড',
      skills: ['Node.js', 'Express.js', 'REST APIs'],
      badgeColor: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20',
    },
    {
      category: 'Database & Infrastructure',
      categoryBn: 'ডাটাবেস ও টুলস',
      skills: ['MongoDB', 'MySQL', 'Git', 'GitHub'],
      badgeColor: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20',
    },
    {
      category: 'Computer Science',
      categoryBn: 'কম্পিউটার সায়েন্স',
      skills: ['DSA', 'DBMS', 'OOPs', 'Operating Systems'],
      badgeColor: 'bg-purple-500/10 text-purple-800 dark:text-purple-300 border-purple-500/20',
    },
  ];

  return (
    <div id="about-developer-screen" className="space-y-4 pb-12 animate-fadeIn">
      {/* 1. Top Navigation Bar */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBack}
          aria-label="Back to settings"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#281B23] text-stone-700 dark:text-stone-200 font-bold text-small shadow-xs hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#DC2626]" />
          <span>Back to Settings</span>
          <span className="font-bengali text-micro text-stone-500 dark:text-stone-400 font-semibold">• সেটিংস</span>
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-micro font-bold text-amber-800 dark:text-amber-300">
          <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span>Developer Profile</span>
        </div>
      </div>

      {/* 2. Developer Hero Profile Card */}
      <section
        id="developer-hero-card"
        className={`relative overflow-hidden rounded-3xl p-5 border shadow-lg ${
          isDarkMode
            ? 'bg-gradient-to-br from-[#3B1324] via-[#2A1721] to-[#1C1217] border-[#F59E0B]/30 text-white'
            : 'bg-gradient-to-br from-[#881337] via-[#991B1B] to-[#7F1D1D] border-[#FDE68A]/30 text-white'
        }`}
      >
        <AlpanaCorner
          position="top-right"
          size={52}
          color="#FDE68A"
          className="absolute top-1 right-1 opacity-25 pointer-events-none"
        />

        <div className="relative z-10 space-y-4">
          <div className="flex items-start gap-4">
            {/* Developer Avatar Badge */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#FEF08A] via-[#F59E0B] to-[#DC2626] p-1 shadow-lg flex items-center justify-center ring-2 ring-amber-300/40">
                <img
                  src={DEVELOPER_PHOTO_DATA_URL}
                  alt="Amit Kiran Kar"
                  className="w-full h-full rounded-full object-cover object-center shadow-inner border border-amber-200/50"
                  loading="eager"
                  onError={(e) => {
                    // Fallback to static asset url if data url fails
                    const target = e.currentTarget;
                    if (target.src !== window.location.origin + DEVELOPER_PHOTO_URL) {
                      target.src = DEVELOPER_PHOTO_URL;
                    }
                  }}
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white dark:border-[#2A121A] flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            {/* Profile Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-black text-h1 sm:text-2xl text-white tracking-tight uppercase">
                  Amit Kiran Kar
                </h1>
              </div>

              <p className="font-bengali-serif text-small sm:text-body text-[#FEF08A] font-bold mt-0.5">
                অমিত কিরণ কর • সফটওয়্যার ইঞ্জিনিয়ার
              </p>

              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-xs text-micro font-bold text-amber-100 border border-white/20">
                  <Terminal className="w-3 h-3 text-[#FEF08A]" />
                  Software Engineer
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/25 text-micro font-bold text-[#FDE68A] border border-amber-400/30">
                  MERN Stack Developer
                </span>
              </div>
            </div>
          </div>

          {/* Tagline */}
          <div className="p-3 rounded-2xl bg-black/25 backdrop-blur-xs border border-white/15">
            <p className="text-small text-stone-100 font-medium italic leading-relaxed">
              &ldquo;Building practical, scalable and user-focused web applications.&rdquo;
            </p>
          </div>

          {/* Prominent Portfolio Button */}
          <div>
            <a
              href="https://amitkirankar.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#FEF08A] via-[#F59E0B] to-[#D97706] text-stone-950 font-display font-black text-body shadow-md hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <Globe className="w-4 h-4 text-stone-900 group-hover:rotate-12 transition-transform" />
              <span>Visit My Portfolio →</span>
              <ExternalLink className="w-3.5 h-3.5 text-stone-900 opacity-80" />
            </a>
          </div>
        </div>
      </section>

      {/* 3. About Me */}
      <section
        id="about-me-section"
        className={`p-4 sm:p-5 rounded-3xl border shadow-sm space-y-2.5 ${
          isDarkMode
            ? 'bg-[#281B23] border-[#F59E0B]/20 text-white'
            : 'bg-white border-[#D97706]/20 text-stone-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-red-500/15 text-[#DC2626] flex items-center justify-center">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display font-bold text-h3 text-[#881337] dark:text-[#FEF08A]">
              About Me • পরিচিতি
            </h2>
          </div>
        </div>

        <p className="text-body text-stone-700 dark:text-stone-200 leading-relaxed font-medium">
          Amit Kiran Kar is a Software Engineer and MERN Stack Developer focused on building scalable,
          maintainable and real-time web applications. He enjoys solving engineering problems,
          building practical products and creating polished user experiences.
        </p>

        <p className="font-bengali text-small text-stone-600 dark:text-stone-300 leading-relaxed">
          বাস্তবমুখী প্রযুক্তি সমস্যা সমাধান, পরিচ্ছন্ন কোড আর্কিটেকচার এবং ব্যবহারকারীর সুবিধার কথা চিন্তা করে আধুনিক ওয়েব অ্যাপ্লিকেশন তৈরিতে তিনি নিষ্ঠার সাথে কাজ করেন।
        </p>
      </section>

      {/* 4. Professional Experience & Education (2-col on desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Experience */}
        <section
          id="experience-section"
          className={`p-4 sm:p-5 rounded-3xl border shadow-sm space-y-3.5 ${
            isDarkMode
              ? 'bg-[#281B23] border-[#F59E0B]/20 text-white'
              : 'bg-white border-[#D97706]/20 text-stone-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-[#D97706] flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-h3 text-[#881337] dark:text-[#FEF08A]">
                Professional Experience
              </h2>
              <span className="font-bengali text-micro text-stone-500 dark:text-stone-400 font-semibold">পেশাগত অভিজ্ঞতা</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-stone-800 space-y-2.5">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h3 className="font-display font-black text-body text-stone-900 dark:text-white">
                  Software Developer
                </h3>
                <p className="text-small font-bold text-[#DC2626] dark:text-amber-400">
                  Fiber Max Services Pvt. Ltd.
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-micro font-bold border border-emerald-500/30">
                Present
              </span>
            </div>

            <div className="flex items-center gap-3 text-micro text-stone-500 dark:text-stone-400 font-semibold flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#D97706]" />
                May 2026 – Present
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#DC2626]" />
                Rourkela, Odisha
              </span>
            </div>

            <ul className="space-y-1.5 pt-1 text-small text-stone-600 dark:text-stone-300 font-medium list-disc list-inside">
              <li>MERN stack development</li>
              <li>RESTful API development</li>
              <li>Backend logic and database management</li>
              <li>Reusable frontend/backend components</li>
              <li>Application performance and debugging</li>
              <li>Agile/Scrum collaboration</li>
            </ul>
          </div>
        </section>

        {/* Education */}
        <section
          id="education-section"
          className={`p-4 sm:p-5 rounded-3xl border shadow-sm space-y-3.5 ${
            isDarkMode
              ? 'bg-[#281B23] border-[#F59E0B]/20 text-white'
              : 'bg-white border-[#D97706]/20 text-stone-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-h3 text-[#881337] dark:text-[#FEF08A]">
                Education
              </h2>
              <span className="font-bengali text-micro text-stone-500 dark:text-stone-400 font-semibold">শিক্ষাগত যোগ্যতা</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-stone-800 space-y-2.5">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h3 className="font-display font-black text-body text-stone-900 dark:text-white">
                  B.Tech in Information Technology
                </h3>
                <p className="text-small font-bold text-stone-700 dark:text-stone-300">
                  Netaji Subhash Engineering College
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 text-micro font-bold border border-amber-500/30">
                CGPA: 8.07
              </span>
            </div>

            <div className="flex items-center gap-3 text-micro text-stone-500 dark:text-stone-400 font-semibold">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#D97706]" />
                2022 – 2026
              </span>
            </div>

            <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-micro font-medium text-stone-600 dark:text-stone-400">
              <span>Department of Information Technology</span>
              <span className="font-bold text-[#991B1B] dark:text-[#FEF08A]">Kolkata, WB</span>
            </div>
          </div>
        </section>
      </div>

      {/* 5. Technical Skills */}
      <section
        id="technical-skills-section"
        className={`p-4 sm:p-5 rounded-3xl border shadow-sm space-y-3.5 ${
          isDarkMode
            ? 'bg-[#281B23] border-[#F59E0B]/20 text-white'
            : 'bg-white border-[#D97706]/20 text-stone-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display font-bold text-h3 text-[#881337] dark:text-[#FEF08A]">
              Technical Skills • প্রযুক্তিগত দক্ষতা
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {skillGroups.map((group, idx) => (
            <div
              key={idx}
              className="p-3 rounded-2xl bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-stone-800 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-small text-stone-900 dark:text-white">
                  {group.category}
                </span>
                <span className="font-bengali text-micro text-stone-500 dark:text-stone-400">
                  {group.categoryBn}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {group.skills.map((skill, sIdx) => (
                  <span
                    key={sIdx}
                    className={`px-2.5 py-1 rounded-xl text-micro font-bold border shadow-2xs ${group.badgeColor}`}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Featured Projects */}
      <section
        id="projects-section"
        className={`p-4 sm:p-5 rounded-3xl border shadow-sm space-y-3.5 ${
          isDarkMode
            ? 'bg-[#281B23] border-[#F59E0B]/20 text-white'
            : 'bg-white border-[#D97706]/20 text-stone-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-red-500/15 text-[#DC2626] flex items-center justify-center">
            <FolderGit2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display font-bold text-h3 text-[#881337] dark:text-[#FEF08A]">
              Featured Projects • প্রজেক্টসমূহ
            </h2>
          </div>
        </div>

        <div className="space-y-3">
          {/* 1. PujaTrip Flagship Project */}
          <div
            className={`p-4 rounded-2xl border shadow-xs relative overflow-hidden ${
              isDarkMode
                ? 'bg-gradient-to-br from-[#3B1324]/60 via-[#281B23] to-[#1C1418] border-[#F59E0B]/40'
                : 'bg-gradient-to-br from-[#FFF5F5] via-[#FFFDF9] to-[#FEF3C7]/40 border-[#DC2626]/30'
            }`}
          >
            <div className="flex items-start justify-between gap-2 flex-wrap mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#991B1B] p-1 flex items-center justify-center shrink-0">
                  <DurgaThirdEye size={20} color="#FFFDF9" />
                </div>
                <h3 className="font-display font-black text-body sm:text-h3 text-stone-900 dark:text-white">
                  PujaTrip
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-300 text-micro font-black uppercase tracking-wider border border-amber-500/40 animate-pulse">
                Active App
              </span>
            </div>

            <p className="text-small font-bold text-[#DC2626] dark:text-amber-300">
              &ldquo;Kolkata & Contai Durga Puja Trip Companion&rdquo;
            </p>

            <p className="text-small text-stone-600 dark:text-stone-300 font-medium mt-1 leading-relaxed">
              A comprehensive mobile-first trip hopping companion tailored for festival enthusiasts across Kolkata and coastal Contai.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-1.5 pt-2.5">
              {[
                'Trip planning',
                'Pandal discovery',
                'Smart routes',
                'Squad/group management',
                'Live location',
                'Crowd intelligence',
                'Expenses',
                'Weather',
                'Safety utilities',
                'PWA/offline support',
              ].map((feat, fIdx) => (
                <span
                  key={fIdx}
                  className="px-2 py-0.5 rounded-lg bg-white dark:bg-black/40 text-micro font-bold text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800 shadow-2xs"
                >
                  ✓ {feat}
                </span>
              ))}
            </div>
          </div>

          {/* 2. Offer Bridge & Pizza Dispatch Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Offer Bridge */}
            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-stone-800 space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-body text-stone-900 dark:text-white">
                  Offer Bridge
                </h3>
                <span className="text-micro font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                  Fintech
                </span>
              </div>
              <p className="text-small font-semibold text-[#D97706]">
                Fintech Escrow Platform
              </p>
              <p className="text-micro text-stone-600 dark:text-stone-400 font-medium leading-relaxed">
                Secure transaction escrow system facilitating trusted multi-party financial exchanges with real-time state verification.
              </p>
            </div>

            {/* Pizza Dispatch */}
            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-stone-800 space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-body text-stone-900 dark:text-white">
                  Pizza Dispatch
                </h3>
                <span className="text-micro font-bold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/20">
                  Real-Time
                </span>
              </div>
              <p className="text-small font-semibold text-[#DC2626] dark:text-orange-400">
                Real-time Ordering App
              </p>
              <p className="text-micro text-stone-600 dark:text-stone-400 font-medium leading-relaxed">
                Full-stack ordering workflow featuring dynamic dispatch queues, real-time status tracking, and reactive UI updates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Coding Profiles */}
      <section
        id="coding-profiles-section"
        className={`p-4 sm:p-5 rounded-3xl border shadow-sm space-y-3.5 ${
          isDarkMode
            ? 'bg-[#281B23] border-[#F59E0B]/20 text-white'
            : 'bg-white border-[#D97706]/20 text-stone-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-[#D97706] flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display font-bold text-h3 text-[#881337] dark:text-[#FEF08A]">
              Coding Profiles & Achievements
            </h2>
            <span className="font-bengali text-micro text-stone-500 dark:text-stone-400 font-semibold">সমস্যা সমাধান ও কোডিং স্কোর</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* LeetCode */}
          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-black/30 border border-amber-300/40 dark:border-stone-800 text-center space-y-1 shadow-2xs">
            <span className="text-xl block">⚡</span>
            <span className="font-display font-bold text-small text-stone-900 dark:text-white block">
              LeetCode
            </span>
            <span className="font-black text-body text-[#D97706] block tabular-nums">
              150+ problems
            </span>
            <span className="text-micro text-stone-500 dark:text-stone-400 block font-medium">
              Data Structures & Algorithms
            </span>
          </div>

          {/* GeeksforGeeks */}
          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-black/30 border border-emerald-300/40 dark:border-stone-800 text-center space-y-1 shadow-2xs">
            <span className="text-xl block">🟢</span>
            <span className="font-display font-bold text-small text-stone-900 dark:text-white block">
              GeeksforGeeks
            </span>
            <span className="font-black text-body text-emerald-600 dark:text-emerald-400 block tabular-nums">
              300+ problems
            </span>
            <span className="text-micro text-stone-500 dark:text-stone-400 block font-medium">
              Competitive Programming
            </span>
          </div>

          {/* HackerRank */}
          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-black/30 border border-blue-300/40 dark:border-stone-800 text-center space-y-1 shadow-2xs">
            <span className="text-xl block">⭐</span>
            <span className="font-display font-bold text-small text-stone-900 dark:text-white block">
              HackerRank
            </span>
            <span className="font-black text-body text-blue-600 dark:text-blue-400 block">
              3-Star SQL Badge
            </span>
            <span className="text-micro text-stone-500 dark:text-stone-400 block font-medium">
              Database Querying & Analysis
            </span>
          </div>
        </div>
      </section>

      {/* 8. Connect With Me (Social & Professional Links) */}
      <section
        id="connect-with-me-section"
        className={`p-4 sm:p-5 rounded-3xl border shadow-sm space-y-3.5 ${
          isDarkMode
            ? 'bg-[#281B23] border-[#F59E0B]/20 text-white'
            : 'bg-white border-[#D97706]/20 text-stone-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display font-bold text-h3 text-[#881337] dark:text-[#FEF08A]">
              Connect With Me • যোগাযোগ ও সামাজিক মাধ্যম
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {socialLinks.map((item, idx) => {
            const Icon = item.icon;
            return (
              <a
                key={idx}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${item.name} profile`}
                className={`p-3 rounded-2xl border transition-all hover:scale-[1.02] shadow-2xs flex items-center justify-between gap-3 ${
                  isDarkMode
                    ? 'bg-black/30 hover:bg-black/50 border-stone-800 text-white'
                    : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-900'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.bgColor} ${item.color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-display font-bold text-small block truncate">
                      {item.name}
                    </span>
                    <span className="text-micro text-stone-500 dark:text-stone-400 block truncate">
                      {item.label}
                    </span>
                  </div>
                </div>

                <ExternalLink className="w-4 h-4 text-stone-400 shrink-0" />
              </a>
            );
          })}
        </div>
      </section>

      {/* 9. Contact Card */}
      <section
        id="contact-card"
        className={`p-4 sm:p-5 rounded-3xl border shadow-sm space-y-3 ${
          isDarkMode
            ? 'bg-gradient-to-br from-[#3B1324]/50 to-[#281B23] border-[#DC2626]/30 text-white'
            : 'bg-gradient-to-br from-[#FFF5F5] to-orange-50 border-red-200 text-stone-900'
        }`}
      >
        <div className="flex items-center gap-2 text-[#991B1B] dark:text-[#FEF08A]">
          <Mail className="w-5 h-5 text-[#DC2626]" />
          <h2 className="font-display font-black text-h3">
            Let&rsquo;s Connect • যোগাযোগ
          </h2>
        </div>

        <p className="text-small text-stone-600 dark:text-stone-300 font-medium leading-relaxed">
          Whether you have an interesting software opportunity, engineering question, or feedback on PujaTrip, feel free to reach out via email:
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-black/30 border border-stone-200 dark:border-stone-800 shadow-2xs">
          <div>
            <span className="text-micro font-bold text-stone-400 uppercase tracking-wider block">
              Direct Developer Email
            </span>
            <span className="font-mono font-bold text-small text-stone-900 dark:text-white select-all">
              amitkiran1007@gmail.com
            </span>
          </div>

          <a
            href="mailto:amitkiran1007@gmail.com"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#991B1B] to-[#DC2626] text-white font-bold text-btn shadow-xs hover:brightness-110 active:scale-95 transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Mail className="w-4 h-4" />
            <span>Send Email</span>
          </a>
        </div>
      </section>

      {/* 10. Developer Footer */}
      <footer className="text-center space-y-2 pt-3">
        <AlpanaDivider color="#D97706" className="w-36 mx-auto opacity-50" />

        <p className="font-display font-bold text-small text-stone-800 dark:text-stone-200">
          Designed & developed by Amit Kiran Kar
        </p>

        <p className="text-micro text-stone-500 dark:text-stone-400">
          © 2026 PujaTrip • All rights reserved.
        </p>

        <p className="text-micro font-medium text-[#991B1B] dark:text-[#FEF08A] font-bengali">
          Made with ❤️ for Durga Puja journeys in Kolkata & Contai.
        </p>
      </footer>
    </div>
  );
};
