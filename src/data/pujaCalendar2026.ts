/**
 * Durga Puja 2026 Festival Calendar
 * Timezone: Asia/Kolkata (IST, UTC+5:30)
 *
 * Official Dates: October 10 to October 21, 2026
 * Note: October 17 includes the specific 'Kalparambha, Akal Bodhon, Amantran & Adhibas'
 * description without duplicating Saptami (which falls on October 18).
 */

export interface PujaCalendarDay {
  date: string; // 'YYYY-MM-DD'
  englishName: string;
  bengaliName: string;
  description: string;
  dayOfWeek?: string;
  ritualHighlight?: string;
}

/**
 * Array of objects representing the Durga Puja 2026 dates (October 10 to October 21, 2026)
 * calculated and standardized using Asia/Kolkata timezone logic.
 */
export const pujaCalendar2026: PujaCalendarDay[] = [
  {
    date: '2026-10-10',
    englishName: 'Mahalaya',
    bengaliName: 'মহালয়া',
    description: 'Chakkhu Daan & Tarpan at Hooghly River',
    dayOfWeek: 'Saturday',
    ritualHighlight: 'Dawn Pitri Tarpan at Ganga Ghats & Chakkhu Daan of Devi Durga',
  },
  {
    date: '2026-10-11',
    englishName: 'Pratipada',
    bengaliName: 'প্রতিপদ',
    description: 'Ghat Sthapana & Devi Paksha Beginning',
    dayOfWeek: 'Sunday',
    ritualHighlight: 'Devi Paksha begins with ceremonial Ghat Sthapana and Kalash Puja',
  },
  {
    date: '2026-10-12',
    englishName: 'Dwitiya',
    bengaliName: 'দ্বিতীয়া',
    description: 'Chandra Darshan & Mandap Decoration Prep',
    dayOfWeek: 'Monday',
    ritualHighlight: 'Chandra Darshan and final traditional artisan craftsmanship',
  },
  {
    date: '2026-10-13',
    englishName: 'Tritiya',
    bengaliName: 'তৃতীয়া',
    description: 'VIP Mandap Invocations & Illumination Showcase',
    dayOfWeek: 'Tuesday',
    ritualHighlight: 'Early preview of theme installations and Chandannagar lighting trials',
  },
  {
    date: '2026-10-14',
    englishName: 'Chaturthi',
    bengaliName: 'চতুর্থী',
    description: 'Public Pandal Openings Across Kolkata',
    dayOfWeek: 'Wednesday',
    ritualHighlight: 'Public inauguration of major North and South Kolkata mandaps',
  },
  {
    date: '2026-10-15',
    englishName: 'Panchami',
    bengaliName: 'পঞ্চমী',
    description: 'Anandamela, Evening Aarti & Food Stalls',
    dayOfWeek: 'Thursday',
    ritualHighlight: 'Anandamela evening food carnival and twin Dhak percussion',
  },
  {
    date: '2026-10-16',
    englishName: 'Maha Shashthi',
    bengaliName: 'মহা ষষ্ঠী',
    description: 'Bodhon',
    dayOfWeek: 'Friday',
    ritualHighlight: 'Devi Bodhon and Prana Pratishtha ritual at Bilva tree',
  },
  {
    date: '2026-10-17',
    englishName: 'Maha Shashthi',
    bengaliName: 'মহা ষষ্ঠী',
    description: 'Kalparambha, Akal Bodhon, Amantran & Adhibas',
    dayOfWeek: 'Saturday',
    ritualHighlight: 'Kalparambha, Akal Bodhon, Amantran & Adhibas ritual ceremonies',
  },
  {
    date: '2026-10-18',
    englishName: 'Maha Saptami',
    bengaliName: 'মহা সপ্তমী',
    description: 'Nabapatrika Snan (Kola Bou) & Saptami Puja',
    dayOfWeek: 'Sunday',
    ritualHighlight: 'Nabapatrika Pravesh & Kola Bou Snan at Bagbazar & Hooghly Ghats',
  },
  {
    date: '2026-10-19',
    englishName: 'Maha Ashtami',
    bengaliName: 'মহা অষ্টমী',
    description: 'Kumari Puja & Sandhi Puja (108 Lotus & Dhuno)',
    dayOfWeek: 'Monday',
    ritualHighlight: 'Kumari Puja morning, Sandhi Puja with 108 Lotuses and 108 Pradeeps',
  },
  {
    date: '2026-10-20',
    englishName: 'Maha Navami',
    bengaliName: 'মহা নবমী',
    description: 'Maha Aarti, Navami Homa & Dhunuchi Naach',
    dayOfWeek: 'Tuesday',
    ritualHighlight: 'Navami Homa, Grand Dhunuchi Naach competitions and Maha Aarti',
  },
  {
    date: '2026-10-21',
    englishName: 'Vijayadashami',
    bengaliName: 'বিজয়া দশমী',
    description: 'Sindoor Khela, Bisarjan & Shubho Bijoya',
    dayOfWeek: 'Wednesday',
    ritualHighlight: 'Devi Baran, Sindoor Khela, Ganga Ghat Bisarjan processions and Shubho Bijoya',
  },
];

export const DURGA_PUJA_2026_DAYS = pujaCalendar2026;
export const durgaPuja2026CalendarList = pujaCalendar2026;
export default pujaCalendar2026;

/**
 * Helper to convert numbers to Bengali numerals
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
 * Returns the current date in Asia/Kolkata timezone.
 * Uses Intl.DateTimeFormat with timeZone: 'Asia/Kolkata' to prevent UTC date shifting.
 */
export function getKolkataDate(referenceDate: Date = new Date()): {
  year: number;
  month: number;
  day: number;
  dateStr: string; // 'YYYY-MM-DD'
  formattedText: string;
} {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });

  const parts = formatter.formatToParts(referenceDate);
  let year = 2026;
  let month = 10;
  let day = 10;

  for (const part of parts) {
    if (part.type === 'year') year = parseInt(part.value, 10);
    if (part.type === 'month') month = parseInt(part.value, 10);
    if (part.type === 'day') day = parseInt(part.value, 10);
  }

  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const formattedText = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(referenceDate);

  return {
    year,
    month,
    day,
    dateStr,
    formattedText,
  };
}

export interface MahalayaCountdownState {
  status: 'countdown' | 'today' | 'passed';
  daysRemaining: number;
  isCountdown: boolean;
  isToday: boolean;
  isPassed: boolean;
  currentKolkataDateStr: string;
  targetDateStr: string; // '2026-10-10'
  bengaliNumeralDays: string;
  badgeLabel: string; // '31 DAYS LEFT', 'TODAY', or 'PASSED'
  headlineEn: string;
  headlineBn: string;
  subtextEn: string;
  subtextBn: string;
}

/**
 * Calculates the dynamic Mahalaya countdown for October 10, 2026 in Asia/Kolkata timezone.
 * - Before October 10, 2026: status is 'countdown', daysRemaining > 0
 * - On October 10, 2026: status is 'today', badge is 'TODAY'
 * - After October 10, 2026: status is 'passed', component is hidden / transitioned
 */
export function getMahalayaCountdown(customDate?: Date | string): MahalayaCountdownState {
  let kolkataDateInfo;
  if (typeof customDate === 'string') {
    const [y, m, d] = customDate.split('-').map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    kolkataDateInfo = getKolkataDate(dateObj);
  } else {
    kolkataDateInfo = getKolkataDate(customDate || new Date());
  }

  const targetDateStr = '2026-10-10'; // Mahalaya 2026
  const [cy, cm, cd] = kolkataDateInfo.dateStr.split('-').map(Number);
  const [ty, tm, td] = targetDateStr.split('-').map(Number);

  const currentMs = Date.UTC(cy, cm - 1, cd);
  const targetMs = Date.UTC(ty, tm - 1, td);
  const daysDiff = Math.round((targetMs - currentMs) / 86400000);

  if (daysDiff > 0) {
    const bnCount = toBengaliNumeral(daysDiff);
    const dayLabel = daysDiff === 1 ? 'Day' : 'Days';
    return {
      status: 'countdown',
      daysRemaining: daysDiff,
      isCountdown: true,
      isToday: false,
      isPassed: false,
      currentKolkataDateStr: kolkataDateInfo.dateStr,
      targetDateStr,
      bengaliNumeralDays: bnCount,
      badgeLabel: `${daysDiff} ${dayLabel.toUpperCase()} LEFT`,
      headlineEn: `${daysDiff} ${dayLabel} to Mahalaya`,
      headlineBn: `মহালয়ার আর ${bnCount} দিন বাকি`,
      subtextEn: 'Target: October 10, 2026 (Asia/Kolkata) • Dawn Tarpan & Chakkhu Daan',
      subtextBn: 'পিতৃপক্ষ সমাপ্তি ও দেবীপক্ষের শুভ আগমনী • ভোর ৪টায় মহিষাসুরমর্দিনী',
    };
  }

  if (daysDiff === 0) {
    return {
      status: 'today',
      daysRemaining: 0,
      isCountdown: false,
      isToday: true,
      isPassed: false,
      currentKolkataDateStr: kolkataDateInfo.dateStr,
      targetDateStr,
      bengaliNumeralDays: '০',
      badgeLabel: 'TODAY',
      headlineEn: 'Mahalaya is TODAY • October 10, 2026',
      headlineBn: 'শুভ মহালয়া • আজ মহালয়া',
      subtextEn: 'Tarpan at Hooghly River & Chakkhu Daan across Kumartuli & Mandaps',
      subtextBn: 'চক্ষুদান ও গঙ্গাবক্ষে পিতৃপুরুষের পুণ্য তর্পণ',
    };
  }

  return {
    status: 'passed',
    daysRemaining: 0,
    isCountdown: false,
    isToday: false,
    isPassed: true,
    currentKolkataDateStr: kolkataDateInfo.dateStr,
    targetDateStr,
    bengaliNumeralDays: '০',
    badgeLabel: 'PASSED',
    headlineEn: 'Devi Paksha is Active',
    headlineBn: 'দেবীপক্ষ চলমান',
    subtextEn: 'Mahalaya has concluded, Durga Puja festivities are now underway.',
    subtextBn: 'শারদোৎসব ২০২৬ পরিক্রমা চলমান।',
  };
}
