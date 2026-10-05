/**
 * Authoritative Single Source of Truth for Durga Puja 2026 Festival Status
 * Timezone: Asia/Kolkata (IST: UTC+5:30)
 *
 * Ensures 100% mutual exclusivity between countdown and puja-day greetings.
 * Never displays "6 days left" together with "Maha Saptami".
 */

export type PujaStatusType =
  | 'COUNTDOWN'
  | 'MAHALAYA'
  | 'PRATIPADA'
  | 'DWITIYA'
  | 'TRITIYA'
  | 'CHATURTHI'
  | 'PANCHAMI'
  | 'SHASHTHI'
  | 'SAPTAMI'
  | 'ASHTAMI'
  | 'NAVAMI'
  | 'DASHAMI'
  | 'POST_PUJA';

export interface PujaFestivalStatus {
  type: PujaStatusType;
  bengaliText: string;
  englishText: string;
  date: string; // Formatted date e.g. "17 OCTOBER 2026"
  daysRemaining: number;
  dateStr: string; // YYYY-MM-DD
  isCountdown: boolean;
  isFestivalActive: boolean;
  isPostPuja: boolean;
}

const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBengaliNumber(num: number): string {
  return String(num)
    .split('')
    .map((char) => {
      const parsed = parseInt(char, 10);
      return isNaN(parsed) ? char : BENGALI_DIGITS[parsed];
    })
    .join('');
}

const MONTH_NAMES_EN = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

/**
 * Extract date parts reliably in Asia/Kolkata timezone.
 */
export function getKolkataDateComponents(inputDate?: Date | string): {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  dateStr: string; // YYYY-MM-DD
  formattedDate: string; // e.g. "17 OCTOBER 2026"
} {
  let dateObj: Date;
  if (!inputDate) {
    dateObj = new Date();
  } else if (typeof inputDate === 'string') {
    const parts = inputDate.split('-').map(Number);
    if (parts.length === 3) {
      dateObj = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 12, 0, 0));
    } else {
      dateObj = new Date(inputDate);
    }
  } else {
    dateObj = inputDate;
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });

  const parts = formatter.formatToParts(dateObj);
  let year = 2026;
  let month = 10;
  let day = 5;

  for (const part of parts) {
    if (part.type === 'year') year = parseInt(part.value, 10);
    if (part.type === 'month') month = parseInt(part.value, 10);
    if (part.type === 'day') day = parseInt(part.value, 10);
  }

  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const formattedDate = `${String(day).padStart(2, '0')} ${MONTH_NAMES_EN[month - 1]} ${year}`;

  return {
    year,
    month,
    day,
    dateStr,
    formattedDate,
  };
}

/**
 * Authoritative function to get the current festival status.
 *
 * Rules:
 * - BEFORE MAHALAYA (< 2026-10-10): COUNTDOWN only ("আর X দিন বাকি", "X DAYS TO MAHALAYA"). NO festival greeting.
 * - MAHALAYA (2026-10-10): "শুভ মহালয়া" / "SUBHO MAHALAYA". NO countdown.
 * - PRATIPADA to PANCHAMI (2026-10-11 to 2026-10-15): "শুভ প্রতিপদ", etc.
 * - SHASHTHI (2026-10-16 to 2026-10-17): "শুভ ষষ্ঠী" / "MAHA SHASHTHI"
 * - SAPTAMI (2026-10-18): "শুভ সপ্তমী" / "MAHA SAPTAMI"
 * - ASHTAMI (2026-10-19): "শুভ অষ্টমী" / "MAHA ASHTAMI"
 * - NAVAMI (2026-10-20): "শুভ নবমী" / "MAHA NAVAMI"
 * - DASHAMI (2026-10-21): "শুভ বিজয়া দশমী" / "VIJAYA DASHAMI"
 * - POST_PUJA (> 2026-10-21): "আসছে বছর আবার হবে ❤️" / "SEE YOU NEXT PUJA"
 */
export function getCurrentPujaStatus(currentDate?: Date | string): PujaFestivalStatus {
  const { dateStr, formattedDate } = getKolkataDateComponents(currentDate);

  const targetMahalayaDate = '2026-10-10';
  const finalDashamiDate = '2026-10-21';

  const [cy, cm, cd] = dateStr.split('-').map(Number);
  const [my, mm, md] = targetMahalayaDate.split('-').map(Number);
  const [dy, dm, dd] = finalDashamiDate.split('-').map(Number);

  const currentUtc = Date.UTC(cy, cm - 1, cd);
  const mahalayaUtc = Date.UTC(my, mm - 1, md);
  const dashamiUtc = Date.UTC(dy, dm - 1, dd);

  const daysUntilMahalaya = Math.round((mahalayaUtc - currentUtc) / 86400000);

  // 1. BEFORE MAHALAYA: Countdown ONLY
  if (daysUntilMahalaya > 0) {
    const bnCount = toBengaliNumber(daysUntilMahalaya);
    const dayWordEn = daysUntilMahalaya === 1 ? 'DAY' : 'DAYS';
    return {
      type: 'COUNTDOWN',
      bengaliText: `আর ${bnCount} দিন বাকি`,
      englishText: `${daysUntilMahalaya} ${dayWordEn} TO MAHALAYA`,
      date: formattedDate,
      daysRemaining: daysUntilMahalaya,
      dateStr,
      isCountdown: true,
      isFestivalActive: false,
      isPostPuja: false,
    };
  }

  // 2. MAHALAYA (Oct 10, 2026)
  if (dateStr === '2026-10-10') {
    return {
      type: 'MAHALAYA',
      bengaliText: 'শুভ মহালয়া',
      englishText: 'SUBHO MAHALAYA',
      date: formattedDate,
      daysRemaining: 0,
      dateStr,
      isCountdown: false,
      isFestivalActive: true,
      isPostPuja: false,
    };
  }

  // 3. PRATIPADA (Oct 11, 2026)
  if (dateStr === '2026-10-11') {
    return {
      type: 'PRATIPADA',
      bengaliText: 'শুভ প্রতিপদ',
      englishText: 'PRATIPADA',
      date: formattedDate,
      daysRemaining: 0,
      dateStr,
      isCountdown: false,
      isFestivalActive: true,
      isPostPuja: false,
    };
  }

  // 4. DWITIYA (Oct 12, 2026)
  if (dateStr === '2026-10-12') {
    return {
      type: 'DWITIYA',
      bengaliText: 'শুভ দ্বিতীয়া',
      englishText: 'DWITIYA',
      date: formattedDate,
      daysRemaining: 0,
      dateStr,
      isCountdown: false,
      isFestivalActive: true,
      isPostPuja: false,
    };
  }

  // 5. TRITIYA (Oct 13, 2026)
  if (dateStr === '2026-10-13') {
    return {
      type: 'TRITIYA',
      bengaliText: 'শুভ তৃতীয়া',
      englishText: 'TRITIYA',
      date: formattedDate,
      daysRemaining: 0,
      dateStr,
      isCountdown: false,
      isFestivalActive: true,
      isPostPuja: false,
    };
  }

  // 6. CHATURTHI (Oct 14, 2026)
  if (dateStr === '2026-10-14') {
    return {
      type: 'CHATURTHI',
      bengaliText: 'শুভ চতুর্থী',
      englishText: 'CHATURTHI',
      date: formattedDate,
      daysRemaining: 0,
      dateStr,
      isCountdown: false,
      isFestivalActive: true,
      isPostPuja: false,
    };
  }

  // 7. PANCHAMI (Oct 15, 2026)
  if (dateStr === '2026-10-15') {
    return {
      type: 'PANCHAMI',
      bengaliText: 'শুভ পঞ্চমী',
      englishText: 'PANCHAMI',
      date: formattedDate,
      daysRemaining: 0,
      dateStr,
      isCountdown: false,
      isFestivalActive: true,
      isPostPuja: false,
    };
  }

  // 8. SHASHTHI (Oct 16 & Oct 17, 2026)
  if (dateStr === '2026-10-16' || dateStr === '2026-10-17') {
    return {
      type: 'SHASHTHI',
      bengaliText: 'শুভ ষষ্ঠী',
      englishText: 'MAHA SHASHTHI',
      date: formattedDate,
      daysRemaining: 0,
      dateStr,
      isCountdown: false,
      isFestivalActive: true,
      isPostPuja: false,
    };
  }

  // 9. SAPTAMI (Oct 18, 2026)
  if (dateStr === '2026-10-18') {
    return {
      type: 'SAPTAMI',
      bengaliText: 'শুভ সপ্তমী',
      englishText: 'MAHA SAPTAMI',
      date: formattedDate,
      daysRemaining: 0,
      dateStr,
      isCountdown: false,
      isFestivalActive: true,
      isPostPuja: false,
    };
  }

  // 10. ASHTAMI (Oct 19, 2026)
  if (dateStr === '2026-10-19') {
    return {
      type: 'ASHTAMI',
      bengaliText: 'শুভ অষ্টমী',
      englishText: 'MAHA ASHTAMI',
      date: formattedDate,
      daysRemaining: 0,
      dateStr,
      isCountdown: false,
      isFestivalActive: true,
      isPostPuja: false,
    };
  }

  // 11. NAVAMI (Oct 20, 2026)
  if (dateStr === '2026-10-20') {
    return {
      type: 'NAVAMI',
      bengaliText: 'শুভ নবমী',
      englishText: 'MAHA NAVAMI',
      date: formattedDate,
      daysRemaining: 0,
      dateStr,
      isCountdown: false,
      isFestivalActive: true,
      isPostPuja: false,
    };
  }

  // 12. DASHAMI (Oct 21, 2026)
  if (dateStr === '2026-10-21') {
    return {
      type: 'DASHAMI',
      bengaliText: 'শুভ বিজয়া দশমী',
      englishText: 'VIJAYA DASHAMI',
      date: formattedDate,
      daysRemaining: 0,
      dateStr,
      isCountdown: false,
      isFestivalActive: true,
      isPostPuja: false,
    };
  }

  // 13. AFTER PUJA (> Oct 21, 2026)
  return {
    type: 'POST_PUJA',
    bengaliText: 'আসছে বছর আবার হবে ❤️',
    englishText: 'SEE YOU NEXT PUJA',
    date: formattedDate,
    daysRemaining: 0,
    dateStr,
    isCountdown: false,
    isFestivalActive: false,
    isPostPuja: true,
  };
}
