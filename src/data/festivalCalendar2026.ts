/**
 * Central Source of Truth for Kolkata / Bengal Durga Puja 2026 Calendar
 * Timezone: Asia/Kolkata (IST: UTC+5:30)
 *
 * Source of truth:
 * - Oct 10, 2026: Mahalaya (মহালয়া - শুভ মহালয়া)
 * - Oct 11, 2026: Pratipada (প্রতিপদ - শুভ প্রতিপদ)
 * - Oct 12, 2026: Dwitiya (দ্বিতীয়া - শুভ দ্বিতীয়া)
 * - Oct 13, 2026: Tritiya (তৃতীয়া - শুভ তৃতীয়া)
 * - Oct 14, 2026: Chaturthi (চতুর্থী - শুভ চতুর্থী)
 * - Oct 15, 2026: Panchami (পঞ্চমী - শুভ পঞ্চমী)
 * - Oct 16, 2026: Maha Shashthi (মহা ষষ্ঠী - শুভ মহা ষষ্ঠী) • Bodhon
 * - Oct 17, 2026: Maha Shashthi (মহা ষষ্ঠী - শুভ মহা ষষ্ঠী) • Kalparambha, Akal Bodhon, Amantran & Adhibas
 * - Oct 18, 2026: Maha Saptami (মহা সপ্তমী - শুভ সপ্তমী) • Nabapatrika Snan (Kola Bou) & Saptami Puja
 * - Oct 19, 2026: Maha Ashtami (মহা অষ্টমী - শুভ অষ্টমী) • Kumari Puja & Sandhi Puja (108 Lotus & Dhuno)
 * - Oct 20, 2026: Maha Navami (মহা নবমী - শুভ নবমী) • Maha Aarti, Navami Homa & Dhunuchi Naach
 * - Oct 21, 2026: Vijayadashami (বিজয়া দশমী - শুভ বিজয়া দশমী) • Sindoor Khela, Bisarjan & Shubho Bijoya
 */

import { PujaTithiInfo } from '../types';

export interface DurgaPujaFestivalDay {
  dateStr: string; // '2026-10-10'
  displayDate: string; // 'Oct 10'
  dayName: string;
  bengaliDayName: string;
  greetingBn: string;
  greetingEn: string;
  description: string;
  bengaliDescription?: string;
  tithi: string;
  bengaliTithi: string;
  anjaliTimings: string;
  sandhiPujaTimings?: string;
  specialRitual: string;
  dhunuchiChallenge: string;
  highlightLeftLabel: string;
  highlightLeftContent: string;
  highlightRightLabel: string;
  highlightRightContent: string;
}

export interface DynamicTithiInfo extends PujaTithiInfo {
  greetingBn: string;
  greetingEn: string;
  headerGreeting: string;
  headerSubtext: string;
  highlightLeftLabel: string;
  highlightLeftContent: string;
  highlightRightLabel: string;
  highlightRightContent: string;
  daysUntilMahalaya?: number;
  isBeforeMahalaya?: boolean;
  isTodayFestival?: boolean;
  festivalDateStr?: string;
}

/**
 * Bengali numeral conversion
 */
export function toBengaliNumeral(num: number): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num)
    .split('')
    .map((char) => {
      const parsed = parseInt(char, 10);
      return isNaN(parsed) ? char : bengaliDigits[parsed];
    })
    .join('');
}

/**
 * Timezone-safe date extraction in Asia/Kolkata (IST: UTC+5:30).
 * Prevents UTC shifting issues when running in different browser / server zones.
 */
export function getKolkataDateParts(inputDate: Date = new Date()): {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  dateString: string; // 'YYYY-MM-DD'
  formattedLongDate: string; // 'October 10, 2026'
  formattedShortDate: string; // 'Oct 10'
} {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });

  const parts = formatter.formatToParts(inputDate);
  let year = 2026;
  let month = 10;
  let day = 10;

  for (const part of parts) {
    if (part.type === 'year') year = parseInt(part.value, 10);
    if (part.type === 'month') month = parseInt(part.value, 10);
    if (part.type === 'day') day = parseInt(part.value, 10);
  }

  const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const shortMonthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const formattedLongDate = `${monthNames[month - 1]} ${day}, ${year}`;
  const formattedShortDate = `${shortMonthNames[month - 1]} ${String(day).padStart(2, '0')}`;

  return {
    year,
    month,
    day,
    dateString,
    formattedLongDate,
    formattedShortDate,
  };
}

/**
 * Calculates Kolkata calendar day difference between two 'YYYY-MM-DD' strings.
 */
export function getKolkataDayDifference(fromDateStr: string, toDateStr: string): number {
  const [fy, fm, fd] = fromDateStr.split('-').map(Number);
  const [ty, tm, td] = toDateStr.split('-').map(Number);
  const fromUTC = Date.UTC(fy, fm - 1, fd);
  const toUTC = Date.UTC(ty, tm - 1, td);
  return Math.round((toUTC - fromUTC) / 86400000);
}

/**
 * 2026 Durga Puja Festival Days (Source of Truth)
 */
export const durgaPuja2026Dates: Record<string, DurgaPujaFestivalDay> = {
  '2026-10-10': {
    dateStr: '2026-10-10',
    displayDate: 'Oct 10',
    dayName: 'Mahalaya',
    bengaliDayName: 'মহালয়া',
    greetingBn: 'শুভ মহালয়া',
    greetingEn: 'Subho Mahalaya',
    description: 'Chakkhu Daan & Tarpan at Hooghly River',
    bengaliDescription: 'চক্ষুদান ও গঙ্গাবক্ষে পিতৃপুরুষের তর্পণ',
    tithi: 'Amavasya • Chakkhu Daan & Pitri Tarpan',
    bengaliTithi: 'অমাবস্যা তিথি • মহালয়া ও পিতৃ তর্পণ',
    anjaliTimings: '05:30 AM - 08:00 AM (Tarpan at Hooghly Ghats)',
    specialRitual: 'Chakkhu Daan & Tarpan at Hooghly River',
    dhunuchiChallenge: 'Birendra Krishna Bhadra Mahishasuramardini dawn broadcast',
    highlightLeftLabel: 'Pushpanjali & Tarpan',
    highlightLeftContent: '05:30 AM - 08:00 AM (Hooghly River Tarpan)',
    highlightRightLabel: 'Devi Bodhon Prep',
    highlightRightContent: 'Chakkhu Daan of Devi Durga across Kumartuli & Mandaps',
  },
  '2026-10-11': {
    dateStr: '2026-10-11',
    displayDate: 'Oct 11',
    dayName: 'Pratipada',
    bengaliDayName: 'প্রতিপদ',
    greetingBn: 'শুভ প্রতিপদ',
    greetingEn: 'Subho Prothoma',
    description: 'Shukla Pratipada • Ghat Sthapana & Devi Paksha Beginning',
    bengaliDescription: 'শুক্লা প্রতিপদ • ঘট স্থাপন ও দেবী পক্ষের সূচনা',
    tithi: 'Shukla Pratipada • 1st Lunar Day of Devi Paksha',
    bengaliTithi: 'শুক্লা প্রতিপদ তিথি • দেবী পক্ষ',
    anjaliTimings: '07:30 AM - 09:30 AM',
    specialRitual: 'Ghat Sthapana & Devi Paksha Invocations',
    dhunuchiChallenge: 'Devi Vandana and initial pandal illumination trials',
    highlightLeftLabel: 'Ghat Sthapana & Vandana',
    highlightLeftContent: 'Devi Paksha begins with ceremonial Ghat Sthapana',
    highlightRightLabel: 'Pandal Illuminations',
    highlightRightContent: 'Lighting trials active across North & South Kolkata',
  },
  '2026-10-12': {
    dateStr: '2026-10-12',
    displayDate: 'Oct 12',
    dayName: 'Dwitiya',
    bengaliDayName: 'দ্বিতীয়া',
    greetingBn: 'শুভ দ্বিতীয়া',
    greetingEn: 'Subho Dwitiya',
    description: 'Dwitiya Tithi • Chandra Darshan & Mandap Decoration Prep',
    bengaliDescription: 'দ্বিতীয়া তিথি • চন্দ্র দর্শন ও মণ্ডপ অলঙ্করণ',
    tithi: 'Shukla Dwitiya • 2nd Lunar Day of Devi Paksha',
    bengaliTithi: 'শুক্লা দ্বিতীয়া তিথি • দেবী পক্ষ',
    anjaliTimings: '08:00 AM - 09:30 AM',
    specialRitual: 'Mandap Decoration & Idol Unveiling Prep',
    dhunuchiChallenge: 'Heritage bonedi bari traditional preparation darshan',
    highlightLeftLabel: 'Mandap Darshan',
    highlightLeftContent: 'Early preview of theme installations & artisan craft',
    highlightRightLabel: 'Evening Aarti',
    highlightRightContent: 'Starts 06:45 PM with traditional Dhak rhythms',
  },
  '2026-10-13': {
    dateStr: '2026-10-13',
    displayDate: 'Oct 13',
    dayName: 'Tritiya',
    bengaliDayName: 'তৃতীয়া',
    greetingBn: 'শুভ তৃতীয়া',
    greetingEn: 'Subho Tritiya',
    description: 'Tritiya Tithi • Early VIP Pandal Previews & Lighting Trials',
    bengaliDescription: 'তৃতীয়া তিথি • মণ্ডপ উদ্বোধন ও আলোকসজ্জা প্রদর্শনী',
    tithi: 'Shukla Tritiya • 3rd Lunar Day of Devi Paksha',
    bengaliTithi: 'শুক্লা তৃতীয়া তিথি • দেবী পক্ষ',
    anjaliTimings: '08:00 AM - 10:00 AM',
    specialRitual: 'VIP Mandap Invocations & Illumination Showcase',
    dhunuchiChallenge: 'Low-crowd photography hours (02:00 PM - 05:00 PM)',
    highlightLeftLabel: 'VIP Mandap Previews',
    highlightLeftContent: 'Zero-queue time window for major architectural themes',
    highlightRightLabel: 'Chandannagar Lights',
    highlightRightContent: 'Illumination corridors active from 06:30 PM',
  },
  '2026-10-14': {
    dateStr: '2026-10-14',
    displayDate: 'Oct 14',
    dayName: 'Chaturthi',
    bengaliDayName: 'চতুর্থী',
    greetingBn: 'শুভ চতুর্থী',
    greetingEn: 'Subho Chaturthi',
    description: 'Chaturthi Tithi • Public Pandal Openings Across Kolkata',
    bengaliDescription: 'চতুর্থী তিথি • সার্বজনীন মণ্ডপ উদ্বোধন',
    tithi: 'Shukla Chaturthi • 4th Lunar Day of Devi Paksha',
    bengaliTithi: 'শুক্লা চতুর্থী তিথি • দেবী পক্ষ',
    anjaliTimings: '08:00 AM - 10:00 AM',
    specialRitual: 'Public Invocations & Anandamela Preparation',
    dhunuchiChallenge: 'Evening Anandamela food fair & street adda',
    highlightLeftLabel: 'Public Openings',
    highlightLeftContent: 'Major city circuits open for hopping from 4:00 PM',
    highlightRightLabel: 'Food & Anandamela',
    highlightRightContent: 'Traditional Bengali food stalls and street adda',
  },
  '2026-10-15': {
    dateStr: '2026-10-15',
    displayDate: 'Oct 15',
    dayName: 'Panchami',
    bengaliDayName: 'পঞ্চমী',
    greetingBn: 'শুভ পঞ্চমী',
    greetingEn: 'Subho Panchami',
    description: 'Panchami Tithi • Anandamela, Evening Aarti & Food Stalls',
    bengaliDescription: 'পঞ্চমী তিথি • আনন্দমেলা, সন্ধ্যারতি ও উৎসবের শুভ সূচনা',
    tithi: 'Shukla Panchami • 5th Lunar Day of Devi Paksha',
    bengaliTithi: 'শুক্লা পঞ্চমী তিথি • দেবী পক্ষ',
    anjaliTimings: '08:00 AM - 10:15 AM',
    specialRitual: 'Anandamela & Devi Invocations',
    dhunuchiChallenge: 'Panchami night hopping before peak surge queues',
    highlightLeftLabel: 'Anandamela Feast',
    highlightLeftContent: 'Homemade pitha, chops & community food stalls',
    highlightRightLabel: 'Evening Aarti',
    highlightRightContent: 'Twin Dhak percussion & temple bell invocations',
  },
  '2026-10-16': {
    dateStr: '2026-10-16',
    displayDate: 'Oct 16',
    dayName: 'Maha Shashthi',
    bengaliDayName: 'মহা ষষ্ঠী',
    greetingBn: 'শুভ মহা ষষ্ঠী',
    greetingEn: 'Subho Maha Shashthi',
    description: 'Bodhon',
    bengaliDescription: 'বোধন',
    tithi: 'Shukla Shashthi • Devi Bodhon',
    bengaliTithi: 'শুক্লা ষষ্ঠী তিথি • দেবী বোধন',
    anjaliTimings: '08:00 AM - 10:00 AM (Morning Pushpanjali)',
    specialRitual: 'Devi Bodhon & Prana Pratishtha',
    dhunuchiChallenge: 'Evening Dhunuchi Naach begins after 7:15 PM Aarti',
    highlightLeftLabel: 'Devi Bodhon',
    highlightLeftContent: '08:00 AM - 10:00 AM (Bodhon & Prana Pratishtha)',
    highlightRightLabel: 'Evening Dhunuchi Aarti',
    highlightRightContent: 'Starts 07:15 PM with twin Dhak rhythms',
  },
  '2026-10-17': {
    dateStr: '2026-10-17',
    displayDate: 'Oct 17',
    dayName: 'Maha Shashthi',
    bengaliDayName: 'মহা ষষ্ঠী',
    greetingBn: 'শুভ মহা ষষ্ঠী',
    greetingEn: 'Subho Maha Shashthi',
    description: 'Kalparambha, Akal Bodhon, Amantran & Adhibas',
    bengaliDescription: 'কল্পারম্ভ, অকালের বোধন, আমন্ত্রণ ও অধিবাস',
    tithi: 'Shukla Shashthi • Kalparambha & Adhibas',
    bengaliTithi: 'শুক্লা ষষ্ঠী তিথি • কল্পারম্ভ, অকালের বোধন ও অধিবাস',
    anjaliTimings: '08:00 AM - 10:15 AM (Kalparambha & Shashthi Puja)',
    specialRitual: 'Kalparambha, Akal Bodhon, Amantran & Adhibas',
    dhunuchiChallenge: 'Special Shashthi Adhibas with Dhak, Kanshor & Shankha',
    highlightLeftLabel: 'কল্পারম্ভ ও অধিবাস',
    highlightLeftContent: 'Kalparambha, Akal Bodhon, Amantran & Adhibas',
    highlightRightLabel: 'Evening Dhunuchi Aarti',
    highlightRightContent: 'Shashthi Adhibas Aarti with Dhak & Kanshor',
  },
  '2026-10-18': {
    dateStr: '2026-10-18',
    displayDate: 'Oct 18',
    dayName: 'Maha Saptami',
    bengaliDayName: 'মহা সপ্তমী',
    greetingBn: 'শুভ সপ্তমী',
    greetingEn: 'Subho Saptami',
    description: 'Nabapatrika Snan (Kola Bou) & Saptami Puja',
    bengaliDescription: 'নবপত্রিকা স্নান (কলাবউ) ও সপ্তমী পূজা',
    tithi: 'Shukla Saptami • 7th Lunar Day of Devi Paksha',
    bengaliTithi: 'শুক্লা সপ্তমী তিথি • দেবী পক্ষ',
    anjaliTimings: '08:30 AM - 10:15 AM (Morning Pushpanjali)',
    sandhiPujaTimings: 'Tomorrow 05:42 PM - 06:30 PM (Maha Ashtami)',
    specialRitual: 'Nabapatrika Pravesh & Snan (Kola Bou Snan at Bagbazar Ghat)',
    dhunuchiChallenge: 'Evening Dhunuchi Naach begins after 7:30 PM Aarti across major pandals',
    highlightLeftLabel: 'Pushpanjali & Kola Bou Snan',
    highlightLeftContent: '08:30 AM - 10:15 AM (Morning Pushpanjali)',
    highlightRightLabel: 'Evening Dhunuchi Aarti',
    highlightRightContent: 'Starts 07:15 PM with twin Dhak',
  },
  '2026-10-19': {
    dateStr: '2026-10-19',
    displayDate: 'Oct 19',
    dayName: 'Maha Ashtami',
    bengaliDayName: 'মহা অষ্টমী',
    greetingBn: 'শুভ অষ্টমী',
    greetingEn: 'Subho Ashtami',
    description: 'Kumari Puja & Sandhi Puja (108 Lotus & Dhuno)',
    bengaliDescription: 'কুমারী পূজা ও সন্ধিপূজা (১০৮ পদ্ম ও ধুনো)',
    tithi: 'Shukla Ashtami • Kumari Puja & Sandhi Puja',
    bengaliTithi: 'শুক্লা অষ্টমী তিথি • কুমারী পূজা ও সন্ধিপূজা',
    anjaliTimings: '09:00 AM - 11:00 AM (Ashtami Pushpanjali)',
    sandhiPujaTimings: '05:42 PM - 06:30 PM (Sandhi Puja & 108 Pradeep Lighting)',
    specialRitual: 'Kumari Puja (Morning) & Sandhi Puja (Evening 108 Deepam)',
    dhunuchiChallenge: 'Sandhi Puja 108 Lotus, Dhuno & 108 Pradeep Aarti',
    highlightLeftLabel: 'Pushpanjali & Kumari Puja',
    highlightLeftContent: '09:00 AM - 11:00 AM (Ashtami Pushpanjali)',
    highlightRightLabel: 'সন্ধিপূজা (Sandhi Puja)',
    highlightRightContent: '05:42 PM - 06:30 PM (108 Lotus & Pradeep Lighting)',
  },
  '2026-10-20': {
    dateStr: '2026-10-20',
    displayDate: 'Oct 20',
    dayName: 'Maha Navami',
    bengaliDayName: 'মহা নবমী',
    greetingBn: 'শুভ নবমী',
    greetingEn: 'Subho Navami',
    description: 'Maha Aarti, Navami Homa & Dhunuchi Naach',
    bengaliDescription: 'মহা আরতি, নবমী হোম ও ধুনুচি নাচ',
    tithi: 'Shukla Navami • Maha Aarti & Homa',
    bengaliTithi: 'শুক্লা নবমী তিথি • মহা আরতি ও যজ্ঞ',
    anjaliTimings: '09:30 AM - 11:30 AM (Navami Pushpanjali)',
    specialRitual: 'Maha Aarti, Navami Homa & Grand Dhunuchi Naach',
    dhunuchiChallenge: 'Grand Dhunuchi Naach competitions after 7:30 PM Aarti',
    highlightLeftLabel: 'Navami Homa & Pushpanjali',
    highlightLeftContent: '09:30 AM - 11:30 AM (Navami Pushpanjali)',
    highlightRightLabel: 'Grand Dhunuchi Naach',
    highlightRightContent: 'Maha Aarti, Navami Homa & Dhunuchi Naach',
  },
  '2026-10-21': {
    dateStr: '2026-10-21',
    displayDate: 'Oct 21',
    dayName: 'Vijayadashami',
    bengaliDayName: 'বিজয়া দশমী',
    greetingBn: 'শুভ বিজয়া দশমী',
    greetingEn: 'Subho Bijoya Dashami',
    description: 'Sindoor Khela, Bisarjan & Shubho Bijoya',
    bengaliDescription: 'সিঁদুর খেলা, বিসর্জন ও শুভ বিজয়া',
    tithi: 'Shukla Dashami • Devi Baran & Bisarjan',
    bengaliTithi: 'শুক্লা দশমী তিথি • দেবী বরণ ও বিসর্জন',
    anjaliTimings: '10:00 AM - 01:00 PM (Devi Baran & Sindoor Khela)',
    specialRitual: 'Sindoor Khela, Bisarjan & Shubho Bijoya',
    dhunuchiChallenge: 'Immersion procession (Bisarjan) along Hooghly river ghats',
    highlightLeftLabel: 'Sindoor Khela & Baran',
    highlightLeftContent: '10:00 AM - 01:00 PM (Devi Baran & Sindoor)',
    highlightRightLabel: 'Ghat Bisarjan Procession',
    highlightRightContent: 'Sindoor Khela, Bisarjan & Shubho Bijoya',
  },
};

export const DURGA_PUJA_2026_DATES = durgaPuja2026Dates;

/**
 * Returns dynamic festival / tithi info according to current Asia/Kolkata date.
 */
export function getTodayTithiInfo(customDate?: Date | string): DynamicTithiInfo {
  let kolkataDateInfo;
  if (typeof customDate === 'string') {
    const [y, m, d] = customDate.split('-').map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    kolkataDateInfo = getKolkataDateParts(dateObj);
  } else {
    kolkataDateInfo = getKolkataDateParts(customDate || new Date());
  }

  const currentDateStr = kolkataDateInfo.dateString;
  const mahalayaDateStr = '2026-10-10';
  const daysUntilMahalaya = getKolkataDayDifference(currentDateStr, mahalayaDateStr);

  // 1. Before October 10: Dynamic Mahalaya Countdown
  if (daysUntilMahalaya > 0) {
    const bnCount = toBengaliNumeral(daysUntilMahalaya);
    const dayWordEn = daysUntilMahalaya === 1 ? 'Day' : 'Days';
    return {
      dayName: `${daysUntilMahalaya} ${dayWordEn} to Mahalaya`,
      bengaliDayName: `মহালয়ার আর ${bnCount} দিন বাকি`,
      tithi: `Devi Paksha Arrival • ${daysUntilMahalaya} ${dayWordEn} until Mahalaya`,
      bengaliTithi: 'পিতৃপক্ষ • দেবী পক্ষের আগমনী কাউন্টডাউন',
      dateStr: kolkataDateInfo.formattedLongDate,
      anjaliTimings: '05:30 AM - 08:00 AM (Upcoming Mahalaya Tarpan on Oct 10)',
      specialRitual: 'Chakkhu Daan & Tarpan at Hooghly River (Oct 10)',
      dhunuchiChallenge: `Countdown to Mahishasuramardini dawn broadcast & Dhunuchi Naach (${daysUntilMahalaya} ${dayWordEn.toLowerCase()} left)`,
      greetingBn: `মহালয়ার আর ${bnCount} দিন বাকি`,
      greetingEn: `${daysUntilMahalaya} ${dayWordEn} to Mahalaya`,
      headerGreeting: `মহালয়ার আর ${bnCount} দিন বাকি`,
      headerSubtext: `${daysUntilMahalaya} ${dayWordEn} to Mahalaya • শারদোৎসব ২০২৬`,
      highlightLeftLabel: 'Mahalaya Countdown',
      highlightLeftContent: `Target: October 10, 2026 • Chakkhu Daan & Tarpan`,
      highlightRightLabel: 'Sharad Parikrama 2026',
      highlightRightContent: `${daysUntilMahalaya} ${dayWordEn.toLowerCase()} left until Devi Paksha commences`,
      daysUntilMahalaya,
      isBeforeMahalaya: true,
      isTodayFestival: false,
      festivalDateStr: currentDateStr,
    };
  }

  // 2. On October 10: Mahalaya is TODAY
  if (currentDateStr === mahalayaDateStr) {
    const day = durgaPuja2026Dates[mahalayaDateStr];
    return {
      dayName: 'Mahalaya (Today)',
      bengaliDayName: day.greetingBn, // 'শুভ মহালয়া'
      tithi: day.tithi,
      bengaliTithi: day.bengaliTithi,
      dateStr: kolkataDateInfo.formattedLongDate,
      anjaliTimings: day.anjaliTimings,
      specialRitual: day.specialRitual,
      dhunuchiChallenge: day.dhunuchiChallenge,
      greetingBn: day.greetingBn,
      greetingEn: day.greetingEn,
      headerGreeting: `${day.greetingBn} • Mahalaya Live`,
      headerSubtext: 'Tarpan at Hooghly & Chakkhu Daan of Devi',
      highlightLeftLabel: day.highlightLeftLabel,
      highlightLeftContent: day.highlightLeftContent,
      highlightRightLabel: day.highlightRightLabel,
      highlightRightContent: day.highlightRightContent,
      daysUntilMahalaya: 0,
      isBeforeMahalaya: false,
      isTodayFestival: true,
      festivalDateStr: currentDateStr,
    };
  }

  // 3. During the Puja Days: Oct 11 through Oct 21
  const festivalDay = durgaPuja2026Dates[currentDateStr];
  if (festivalDay) {
    return {
      dayName: `${festivalDay.dayName} (Today)`,
      bengaliDayName: festivalDay.greetingBn,
      tithi: festivalDay.tithi,
      bengaliTithi: festivalDay.bengaliTithi,
      dateStr: kolkataDateInfo.formattedLongDate,
      anjaliTimings: festivalDay.anjaliTimings,
      sandhiPujaTimings: festivalDay.sandhiPujaTimings,
      specialRitual: festivalDay.specialRitual,
      dhunuchiChallenge: festivalDay.dhunuchiChallenge,
      greetingBn: festivalDay.greetingBn,
      greetingEn: festivalDay.greetingEn,
      headerGreeting: `${festivalDay.greetingBn} • ${festivalDay.dayName} Live`,
      headerSubtext: festivalDay.description,
      highlightLeftLabel: festivalDay.highlightLeftLabel,
      highlightLeftContent: festivalDay.highlightLeftContent,
      highlightRightLabel: festivalDay.highlightRightLabel,
      highlightRightContent: festivalDay.highlightRightContent,
      daysUntilMahalaya: 0,
      isBeforeMahalaya: false,
      isTodayFestival: true,
      festivalDateStr: currentDateStr,
    };
  }

  // 4. After October 21: Post-festival Bijoya greetings
  return {
    dayName: 'Subho Bijoya Greetings',
    bengaliDayName: 'শুভ বিজয়া',
    tithi: 'Shukla Ekadashi • Festive Season Continues',
    bengaliTithi: 'একাদশী • শারদোৎসব স্মৃতি ও মিষ্টিমুখ',
    dateStr: kolkataDateInfo.formattedLongDate,
    anjaliTimings: 'Shubho Bijoya Greetings & Sweet Distribution',
    specialRitual: 'Shubho Bijoya adda & preparation for Kojagari Lakshmi Puja',
    dhunuchiChallenge: 'Sharing memories and festival photographs of Puja 2026',
    greetingBn: 'শুভ বিজয়া',
    greetingEn: 'Subho Bijoya',
    headerGreeting: 'শুভ বিজয়া • Subho Bijoya Greetings',
    headerSubtext: 'শারদ শুভেচ্ছা ও মিষ্টিমুখ • Durga Puja 2026',
    highlightLeftLabel: 'Shubho Bijoya',
    highlightLeftContent: 'শুভ বিজয়ার আন্তরিক প্রীতি ও শুভেচ্ছা',
    highlightRightLabel: 'Puja 2026 Wrap',
    highlightRightContent: 'Sweet distribution, adda & sweet memories of Puja 2026',
    daysUntilMahalaya: 0,
    isBeforeMahalaya: false,
    isTodayFestival: false,
    festivalDateStr: currentDateStr,
  };
}

/**
 * Puja Tithi Calendar items for SettingsScreen.
 * Reflects the exact 2026 sequence:
 * - Oct 10: Mahalaya
 * - Oct 16: Maha Shashthi (Bodhon)
 * - Oct 17: Maha Shashthi (Kalparambha, Akal Bodhon, Amantran & Adhibas)
 * - Oct 18: Maha Saptami (Nabapatrika Snan & Saptami Puja)
 * - Oct 19: Maha Ashtami (Kumari Puja & Sandhi Puja)
 * - Oct 20: Maha Navami (Maha Aarti, Navami Homa & Dhunuchi Naach)
 * - Oct 21: Vijayadashami (Sindoor Khela, Bisarjan & Shubho Bijoya)
 */
export function getPuja2026CalendarItems(todayDateStr?: string): Array<{
  day: string;
  bn: string;
  date: string;
  ritual: string;
}> {
  const currentKolkataDate = todayDateStr || getKolkataDateParts().dateString;

  const calendarItems = [
    {
      day: 'Mahalaya',
      bn: 'মহালয়া',
      dateStr: '2026-10-10',
      displayDate: 'Oct 10',
      ritual: 'Chakkhu Daan & Tarpan at Hooghly River',
    },
    {
      day: 'Maha Shashthi',
      bn: 'মহা ষষ্ঠী',
      dateStr: '2026-10-16',
      displayDate: 'Oct 16',
      ritual: 'Bodhon',
    },
    {
      day: 'Maha Shashthi',
      bn: 'মহা ষষ্ঠী',
      dateStr: '2026-10-17',
      displayDate: 'Oct 17',
      ritual: 'Kalparambha, Akal Bodhon, Amantran & Adhibas',
    },
    {
      day: 'Maha Saptami',
      bn: 'মহা সপ্তমী',
      dateStr: '2026-10-18',
      displayDate: 'Oct 18',
      ritual: 'Nabapatrika Snan (Kola Bou) & Saptami Puja',
    },
    {
      day: 'Maha Ashtami',
      bn: 'মহা অষ্টমী',
      dateStr: '2026-10-19',
      displayDate: 'Oct 19',
      ritual: 'Kumari Puja & Sandhi Puja (108 Lotus & Dhuno)',
    },
    {
      day: 'Maha Navami',
      bn: 'মহা নবমী',
      dateStr: '2026-10-20',
      displayDate: 'Oct 20',
      ritual: 'Maha Aarti, Navami Homa & Dhunuchi Naach',
    },
    {
      day: 'Vijayadashami',
      bn: 'বিজয়া দশমী',
      dateStr: '2026-10-21',
      displayDate: 'Oct 21',
      ritual: 'Sindoor Khela, Bisarjan & Shubho Bijoya',
    },
  ];

  return calendarItems.map((item) => ({
    day: item.day,
    bn: item.bn,
    date: item.dateStr === currentKolkataDate ? `${item.displayDate} (Today)` : item.displayDate,
    ritual: item.ritual,
  }));
}
