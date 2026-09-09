import {
  TripExpenseRecord,
  ExpenseCategory,
  ExpenseSplitType,
  ExpenseParticipantSplit,
  MemberExpenseBalance,
  SmartSettlementTransaction,
  GroupExpenseCategoryStat,
  GroupExpenseDashboardSummary,
  TripMember,
  UserProfile,
} from '../types';
import { getSupabase } from './supabaseClient';
import { DEMO_PROFILES, FESTIVE_AVATARS, getTripGroup, getCurrentUserProfile } from './friendGroupService';

// ============================================================================
// CATEGORY METADATA
// ============================================================================
export interface ExpenseCategoryMeta {
  id: ExpenseCategory;
  label: string;
  bengaliLabel: string;
  emoji: string;
  colorClass: string;
  bgClass: string;
}

export const EXPENSE_CATEGORIES: ExpenseCategoryMeta[] = [
  {
    id: 'food',
    label: 'Food & Bhog',
    bengaliLabel: 'খাবার ও ভোগ',
    emoji: '🍴',
    colorClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-500/15 border-amber-500/30',
  },
  {
    id: 'transport_cab',
    label: 'Cab & Auto',
    bengaliLabel: 'ক্যাব ও অটো',
    emoji: '🚕',
    colorClass: 'text-yellow-600 dark:text-yellow-400',
    bgClass: 'bg-yellow-500/15 border-yellow-500/30',
  },
  {
    id: 'transport_transit',
    label: 'Metro & Bus',
    bengaliLabel: 'মেট্রো ও বাস',
    emoji: '🚇',
    colorClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-500/15 border-blue-500/30',
  },
  {
    id: 'tickets',
    label: 'VIP Passes & Tickets',
    bengaliLabel: 'ভিআইপি পাস ও টিকিট',
    emoji: '🎟️',
    colorClass: 'text-purple-600 dark:text-purple-400',
    bgClass: 'bg-purple-500/15 border-purple-500/30',
  },
  {
    id: 'shopping',
    label: 'Puja Shopping',
    bengaliLabel: 'শারদ কেনাকাটা',
    emoji: '🛍️',
    colorClass: 'text-pink-600 dark:text-pink-400',
    bgClass: 'bg-pink-500/15 border-pink-500/30',
  },
  {
    id: 'stay',
    label: 'Stay & Rest',
    bengaliLabel: 'হোটেল ও থাকার ব্যবস্থা',
    emoji: '🏨',
    colorClass: 'text-indigo-600 dark:text-indigo-400',
    bgClass: 'bg-indigo-500/15 border-indigo-500/30',
  },
  {
    id: 'snacks',
    label: 'Chai & Snacks',
    bengaliLabel: 'চা ও জলখাবার',
    emoji: '☕',
    colorClass: 'text-orange-600 dark:text-orange-400',
    bgClass: 'bg-orange-500/15 border-orange-500/30',
  },
  {
    id: 'other',
    label: 'Other Misc Expenses',
    bengaliLabel: 'অন্যান্য খরচ',
    emoji: '📦',
    colorClass: 'text-stone-600 dark:text-stone-400',
    bgClass: 'bg-stone-500/15 border-stone-500/30',
  },
];

export const getCategoryMeta = (category: ExpenseCategory): ExpenseCategoryMeta => {
  return (
    EXPENSE_CATEGORIES.find((c) => c.id === category) || {
      id: 'other',
      label: 'Other',
      bengaliLabel: 'অন্যান্য',
      emoji: '📦',
      colorClass: 'text-stone-600 dark:text-stone-400',
      bgClass: 'bg-stone-500/15 border-stone-500/30',
    }
  );
};

// ============================================================================
// CURRENCY & DECIMAL PRECISION HELPERS
// ============================================================================

/**
 * Format currency nicely (e.g. ₹5,850 or ₹266.67)
 */
export const formatRupees = (amount: number, includeDecimals: boolean = false): string => {
  const isWhole = Math.round(amount * 100) % 100 === 0;
  if (!includeDecimals && isWhole) {
    return `₹${Math.round(amount).toLocaleString('en-IN')}`;
  }
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Clean floating point arithmetic to 2 decimal places
 */
export const roundToTwoDecimals = (num: number): number => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

// Cross-tab broadcast channel for real-time sync
const groupBroadcastChannel =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('pujatrip_group_sync_channel')
    : null;

// Local storage key prefix
const LOCAL_STORAGE_EXPENSES_PREFIX = 'pujatrip_trip_expenses_v2_';

// ============================================================================
// SPLITTING ALGORITHMS (Exact Paise/Cent Precision)
// ============================================================================

/**
 * 1. EQUAL SPLIT
 * Divides total amount equally among participants, with paise rounding distributed
 * so sum(splits) is mathematically identical to totalAmount.
 */
export const calculateEqualSplits = (
  totalAmount: number,
  participantIds: string[],
  memberProfiles: Record<string, UserProfile>
): ExpenseParticipantSplit[] => {
  if (participantIds.length === 0 || totalAmount <= 0) return [];

  const totalPaise = Math.round(totalAmount * 100);
  const n = participantIds.length;
  const basePaise = Math.floor(totalPaise / n);
  const remainderPaise = totalPaise % n;

  return participantIds.map((userId, index) => {
    // First 'remainderPaise' participants get +1 paise to make total exact
    const paise = basePaise + (index < remainderPaise ? 1 : 0);
    const amount = roundToTwoDecimals(paise / 100);
    const profile = memberProfiles[userId] || DEMO_PROFILES.find((p) => p.id === userId);

    return {
      userId,
      userName: profile?.displayName || 'Friend',
      bengaliName: profile?.bengaliName,
      avatarUrl: profile?.avatarUrl,
      amount,
      percentage: roundToTwoDecimals((amount / totalAmount) * 100),
    };
  });
};

/**
 * 2. CUSTOM AMOUNT SPLIT
 * Assigns specified amounts to participants and validates balance.
 */
export const calculateCustomAmountSplits = (
  amounts: Record<string, number>, // userId -> exact amount
  memberProfiles: Record<string, UserProfile>
): ExpenseParticipantSplit[] => {
  return Object.entries(amounts).map(([userId, amt]) => {
    const profile = memberProfiles[userId] || DEMO_PROFILES.find((p) => p.id === userId);
    const rounded = roundToTwoDecimals(Math.max(0, amt || 0));
    return {
      userId,
      userName: profile?.displayName || 'Friend',
      bengaliName: profile?.bengaliName,
      avatarUrl: profile?.avatarUrl,
      amount: rounded,
    };
  });
};

/**
 * 3. PERCENTAGE SPLIT
 * Converts percentages to exact rupee amounts, with remainder paise adjustment.
 */
export const calculatePercentageSplits = (
  totalAmount: number,
  percentages: Record<string, number>, // userId -> percentage (e.g. 50, 25, 25)
  memberProfiles: Record<string, UserProfile>
): ExpenseParticipantSplit[] => {
  const userIds = Object.keys(percentages);
  if (userIds.length === 0 || totalAmount <= 0) return [];

  const totalPaise = Math.round(totalAmount * 100);
  let allocatedPaise = 0;

  const splits: ExpenseParticipantSplit[] = userIds.map((userId, idx) => {
    const pct = Math.max(0, percentages[userId] || 0);
    const profile = memberProfiles[userId] || DEMO_PROFILES.find((p) => p.id === userId);

    // If it's the last item, assign remaining paise to avoid rounding mismatch
    let paise = Math.round((totalPaise * pct) / 100);
    if (idx === userIds.length - 1) {
      paise = totalPaise - allocatedPaise;
    } else {
      allocatedPaise += paise;
    }

    const amount = roundToTwoDecimals(paise / 100);
    return {
      userId,
      userName: profile?.displayName || 'Friend',
      bengaliName: profile?.bengaliName,
      avatarUrl: profile?.avatarUrl,
      amount,
      percentage: pct,
    };
  });

  return splits;
};

// ============================================================================
// SMART SETTLEMENT (DEBT MINIMIZATION ALGORITHM)
// ============================================================================

/**
 * Calculates the minimal number of transactions required to settle all debts
 * across the friend group.
 * Example:
 * Instead of A -> B ₹100, B -> C ₹150, C -> A ₹50,
 * it simplifies to: B -> C ₹50, A -> C ₹50, etc.
 */
export const calculateSmartSettlements = (
  memberBalances: MemberExpenseBalance[]
): SmartSettlementTransaction[] => {
  // 1. Filter and deep copy debtors (net < 0) and creditors (net > 0)
  interface PersonNet {
    userId: string;
    userName: string;
    avatarUrl?: string;
    balance: number; // in paise for absolute integer precision
  }

  const debtors: PersonNet[] = [];
  const creditors: PersonNet[] = [];

  memberBalances.forEach((m) => {
    const paise = Math.round(m.netBalance * 100);
    if (paise < -1) {
      // owes money
      debtors.push({
        userId: m.userId,
        userName: m.userName,
        avatarUrl: m.avatarUrl,
        balance: paise, // negative
      });
    } else if (paise > 1) {
      // should receive money
      creditors.push({
        userId: m.userId,
        userName: m.userName,
        avatarUrl: m.avatarUrl,
        balance: paise, // positive
      });
    }
  });

  // Sort creditors descending (biggest recipient first) and debtors ascending (biggest debtor first)
  creditors.sort((a, b) => b.balance - a.balance);
  debtors.sort((a, b) => a.balance - b.balance);

  const transactions: SmartSettlementTransaction[] = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const debtAmountPaise = -debtor.balance;
    const creditAmountPaise = creditor.balance;

    const settledPaise = Math.min(debtAmountPaise, creditAmountPaise);
    const amount = roundToTwoDecimals(settledPaise / 100);

    if (amount > 0) {
      const fromName = debtor.userName.split(' ')[0];
      const toName = creditor.userName.split(' ')[0];

      transactions.push({
        id: `settle_${debtor.userId}_${creditor.userId}_${transactions.length + 1}`,
        fromUserId: debtor.userId,
        fromUserName: debtor.userName,
        fromUserAvatar: debtor.avatarUrl,
        toUserId: creditor.userId,
        toUserName: creditor.userName,
        toUserAvatar: creditor.avatarUrl,
        amount,
        explanation: `${fromName} pays ${toName} ${formatRupees(amount, true)} to settle group share`,
        bengaliExplanation: `${fromName} ${toName}-কে ${formatRupees(amount, true)} দিলে সব হিসাব মিটে যাবে`,
      });
    }

    debtor.balance += settledPaise;
    creditor.balance -= settledPaise;

    if (Math.abs(debtor.balance) < 1) {
      dIdx++;
    }
    if (Math.abs(creditor.balance) < 1) {
      cIdx++;
    }
  }

  return transactions;
};

// ============================================================================
// GROUP EXPENSE SUMMARY COMPUTATION
// ============================================================================

export const calculateGroupExpenseSummary = (
  tripId: string,
  expenses: TripExpenseRecord[],
  members: TripMember[],
  currentUserId?: string
): GroupExpenseDashboardSummary => {
  const activeUserId = currentUserId || getCurrentUserProfile().id;

  // 1. Total Trip Spending
  const totalTripSpending = roundToTwoDecimals(
    expenses.reduce((sum, exp) => sum + exp.amount, 0)
  );

  // 2. Member Balances (Paid, Owed, Net)
  const paidMap: Record<string, number> = {};
  const owedMap: Record<string, number> = {};

  // Ensure all current members are included in the balance ledger
  members.forEach((m) => {
    paidMap[m.userId] = 0;
    owedMap[m.userId] = 0;
  });

  expenses.forEach((exp) => {
    // Add to payer's total paid
    paidMap[exp.paidBy] = (paidMap[exp.paidBy] || 0) + exp.amount;

    // Add to each participant's total owed
    if (exp.splits && exp.splits.length > 0) {
      exp.splits.forEach((split) => {
        owedMap[split.userId] = (owedMap[split.userId] || 0) + split.amount;
      });
    } else if (exp.splitBetween && exp.splitBetween.length > 0) {
      // Fallback equal split calculation if splits array is absent
      const equalShare = roundToTwoDecimals(exp.amount / exp.splitBetween.length);
      exp.splitBetween.forEach((uId) => {
        owedMap[uId] = (owedMap[uId] || 0) + equalShare;
      });
    }
  });

  // Build member balance objects
  const memberBalances: MemberExpenseBalance[] = members.map((m) => {
    const profile = m.profile || DEMO_PROFILES.find((p) => p.id === m.userId);
    const totalPaid = roundToTwoDecimals(paidMap[m.userId] || 0);
    const totalOwed = roundToTwoDecimals(owedMap[m.userId] || 0);
    const netBalance = roundToTwoDecimals(totalPaid - totalOwed);

    return {
      userId: m.userId,
      userName: profile?.displayName || 'Friend',
      bengaliName: profile?.bengaliName,
      avatarUrl: profile?.avatarUrl,
      totalPaid,
      totalOwed,
      netBalance,
      isCurrentUser: m.userId === activeUserId,
    };
  });

  // Sort members: highest spender first
  memberBalances.sort((a, b) => b.totalPaid - a.totalPaid);

  // 3. Category Breakdown Stats
  const categoryTotalsMap: Record<ExpenseCategory, { total: number; count: number }> = {
    food: { total: 0, count: 0 },
    transport_cab: { total: 0, count: 0 },
    transport_transit: { total: 0, count: 0 },
    tickets: { total: 0, count: 0 },
    shopping: { total: 0, count: 0 },
    stay: { total: 0, count: 0 },
    snacks: { total: 0, count: 0 },
    other: { total: 0, count: 0 },
  };

  expenses.forEach((exp) => {
    const cat = categoryTotalsMap[exp.category] ? exp.category : 'other';
    categoryTotalsMap[cat].total += exp.amount;
    categoryTotalsMap[cat].count += 1;
  });

  const categoryStats: GroupExpenseCategoryStat[] = EXPENSE_CATEGORIES.map((catMeta) => {
    const catData = categoryTotalsMap[catMeta.id];
    const total = roundToTwoDecimals(catData.total);
    const percentage = totalTripSpending > 0 ? roundToTwoDecimals((total / totalTripSpending) * 100) : 0;

    return {
      category: catMeta.id,
      categoryLabel: catMeta.label,
      categoryBengaliLabel: catMeta.bengaliLabel,
      emoji: catMeta.emoji,
      total,
      percentage,
      count: catData.count,
    };
  }).filter((stat) => stat.total > 0 || totalTripSpending === 0);

  // Sort category stats by amount descending
  categoryStats.sort((a, b) => b.total - a.total);

  // 4. Smart Settlement Transactions
  const smartSettlements = calculateSmartSettlements(memberBalances);

  // 5. Current User Balance
  const currentUserBalance = memberBalances.find((m) => m.userId === activeUserId);

  // 6. Highest Spender
  const highestSpender =
    memberBalances.length > 0 && memberBalances[0].totalPaid > 0
      ? {
          userId: memberBalances[0].userId,
          userName: memberBalances[0].userName,
          amount: memberBalances[0].totalPaid,
        }
      : undefined;

  return {
    tripId,
    totalTripSpending,
    formattedTotalSpending: formatRupees(totalTripSpending),
    categoryStats,
    memberBalances,
    smartSettlements,
    currentUserBalance,
    totalExpensesCount: expenses.length,
    highestSpender,
  };
};

// ============================================================================
// PRE-SEEDED REALISTIC DEMO EXPENSES
// ============================================================================

const SEED_DEMO_EXPENSES_KOLKATA: TripExpenseRecord[] = [
  {
    id: 'exp_kol_1',
    tripId: 'group-kolkata-2026',
    title: 'Maha Saptami Bhojohori Manna Dinner',
    amount: 2400,
    category: 'food',
    paidBy: 'user_anirban_admin',
    paidByName: 'Anirban Mukhopadhyay',
    paidByAvatar: 'dhunuchi_dancer',
    splitType: 'equal',
    splitBetween: [
      'user_anirban_admin',
      'user_sourav_member',
      'user_sreemoyee_member',
      'user_sayantani_member',
    ],
    splits: [
      { userId: 'user_anirban_admin', userName: 'Anirban Mukhopadhyay', amount: 600, percentage: 25 },
      { userId: 'user_sourav_member', userName: 'Sourav Ganguly', amount: 600, percentage: 25 },
      { userId: 'user_sreemoyee_member', userName: 'Sreemoyee Sen', amount: 600, percentage: 25 },
      { userId: 'user_sayantani_member', userName: 'Sayantani Das', amount: 600, percentage: 25 },
    ],
    date: '2026-10-19',
    time: '20:30',
    pandalId: 'college-square',
    pandalName: 'College Square & Boipara',
    note: 'Traditional Bengali thali (Ilish, Chingri Malai, Kosha Mangsho) after College Square illuminated lake darshan.',
    createdAt: '2026-10-19T20:45:00Z',
    createdBy: 'user_anirban_admin',
  },
  {
    id: 'exp_kol_2',
    tripId: 'group-kolkata-2026',
    title: 'Yellow Taxi from Shyambazar to College Square',
    amount: 650,
    category: 'transport_cab',
    paidBy: 'user_sourav_member',
    paidByName: 'Sourav Ganguly',
    paidByAvatar: 'dhaki_drummer',
    splitType: 'equal',
    splitBetween: [
      'user_anirban_admin',
      'user_sourav_member',
      'user_sreemoyee_member',
      'user_sayantani_member',
    ],
    splits: [
      { userId: 'user_anirban_admin', userName: 'Anirban Mukhopadhyay', amount: 162.5, percentage: 25 },
      { userId: 'user_sourav_member', userName: 'Sourav Ganguly', amount: 162.5, percentage: 25 },
      { userId: 'user_sreemoyee_member', userName: 'Sreemoyee Sen', amount: 162.5, percentage: 25 },
      { userId: 'user_sayantani_member', userName: 'Sayantani Das', amount: 162.5, percentage: 25 },
    ],
    date: '2026-10-19',
    time: '18:45',
    pandalId: 'bagbazar-sarbojanin',
    pandalName: 'Bagbazar Sarbojanin',
    note: 'Festive night surcharge taxi connecting Bagbazar Ghat to Central Kolkata route.',
    createdAt: '2026-10-19T18:50:00Z',
    createdBy: 'user_sourav_member',
  },
  {
    id: 'exp_kol_3',
    tripId: 'group-kolkata-2026',
    title: 'College Street Kulhad Bharer Cha & Telebhaja',
    amount: 320,
    category: 'snacks',
    paidBy: 'user_sayantani_member',
    paidByName: 'Sayantani Das',
    paidByAvatar: 'sindoor_khela',
    splitType: 'equal',
    splitBetween: [
      'user_anirban_admin',
      'user_sourav_member',
      'user_sreemoyee_member',
      'user_sayantani_member',
    ],
    splits: [
      { userId: 'user_anirban_admin', userName: 'Anirban Mukhopadhyay', amount: 80, percentage: 25 },
      { userId: 'user_sourav_member', userName: 'Sourav Ganguly', amount: 80, percentage: 25 },
      { userId: 'user_sreemoyee_member', userName: 'Sreemoyee Sen', amount: 80, percentage: 25 },
      { userId: 'user_sayantani_member', userName: 'Sayantani Das', amount: 80, percentage: 25 },
    ],
    date: '2026-10-19',
    time: '19:40',
    pandalId: 'college-square',
    pandalName: 'College Square & Boipara',
    note: 'Special elaichi tea and beguni adda near Presidency University gate.',
    createdAt: '2026-10-19T19:45:00Z',
    createdBy: 'user_sayantani_member',
  },
  {
    id: 'exp_kol_4',
    tripId: 'group-kolkata-2026',
    title: 'Special VIP Darshan Passes (Santosh Mitra Sq)',
    amount: 1500,
    category: 'tickets',
    paidBy: 'user_anirban_admin',
    paidByName: 'Anirban Mukhopadhyay',
    paidByAvatar: 'dhunuchi_dancer',
    splitType: 'equal',
    splitBetween: [
      'user_anirban_admin',
      'user_sourav_member',
      'user_sreemoyee_member',
    ],
    splits: [
      { userId: 'user_anirban_admin', userName: 'Anirban Mukhopadhyay', amount: 500, percentage: 33.33 },
      { userId: 'user_sourav_member', userName: 'Sourav Ganguly', amount: 500, percentage: 33.33 },
      { userId: 'user_sreemoyee_member', userName: 'Sreemoyee Sen', amount: 500, percentage: 33.34 },
    ],
    date: '2026-10-19',
    time: '21:15',
    pandalId: 'santosh-mitra-square',
    pandalName: 'Santosh Mitra Square',
    note: 'Fast-track passes to bypass the 90-minute rush queue for Sphere illumination.',
    createdAt: '2026-10-19T21:20:00Z',
    createdBy: 'user_anirban_admin',
  },
  {
    id: 'exp_kol_5',
    tripId: 'group-kolkata-2026',
    title: 'Kumartuli Dokra & Terracotta Souvenirs',
    amount: 980,
    category: 'shopping',
    paidBy: 'user_sreemoyee_member',
    paidByName: 'Sreemoyee Sen',
    paidByAvatar: 'alpana_artist',
    splitType: 'custom_amount',
    splitBetween: ['user_sreemoyee_member', 'user_anirban_admin'],
    splits: [
      { userId: 'user_sreemoyee_member', userName: 'Sreemoyee Sen', amount: 580 },
      { userId: 'user_anirban_admin', userName: 'Anirban Mukhopadhyay', amount: 400 },
    ],
    date: '2026-10-19',
    time: '17:30',
    pandalId: 'shobhabazar-rajbari',
    pandalName: 'Shobhabazar Rajbari',
    note: 'Artisan handcrafted brass Mahishasuramardini mementos from Bagbazar lane.',
    createdAt: '2026-10-19T17:35:00Z',
    createdBy: 'user_sreemoyee_member',
  },
];

const SEED_DEMO_EXPENSES_CONTAI: TripExpenseRecord[] = [
  {
    id: 'exp_con_1',
    tripId: 'group-contai-2026',
    title: 'Contai Coastal Fresh Fish & Bhog Lunch',
    amount: 1200,
    category: 'food',
    paidBy: 'user_anirban_admin',
    paidByName: 'Anirban Mukhopadhyay',
    paidByAvatar: 'dhunuchi_dancer',
    splitType: 'equal',
    splitBetween: ['user_anirban_admin', 'user_debojyoti_member'],
    splits: [
      { userId: 'user_anirban_admin', userName: 'Anirban Mukhopadhyay', amount: 600, percentage: 50 },
      { userId: 'user_debojyoti_member', userName: 'Debojyoti Roy', amount: 600, percentage: 50 },
    ],
    date: '2026-10-20',
    time: '14:00',
    pandalId: 'contai-central-bus-stand',
    pandalName: 'Contai Central Bus Stand',
    note: 'Kaju-Kishmish Pulao and Coastal Betki meal near Central Bus stand.',
    createdAt: '2026-10-20T14:15:00Z',
    createdBy: 'user_anirban_admin',
  },
  {
    id: 'exp_con_2',
    tripId: 'group-contai-2026',
    title: 'Toto E-Rickshaw Town Circuit Pass',
    amount: 350,
    category: 'transport_cab',
    paidBy: 'user_debojyoti_member',
    paidByName: 'Debojyoti Roy',
    paidByAvatar: 'conch_blower',
    splitType: 'equal',
    splitBetween: ['user_anirban_admin', 'user_debojyoti_member'],
    splits: [
      { userId: 'user_anirban_admin', userName: 'Anirban Mukhopadhyay', amount: 175, percentage: 50 },
      { userId: 'user_debojyoti_member', userName: 'Debojyoti Roy', amount: 175, percentage: 50 },
    ],
    date: '2026-10-20',
    time: '17:30',
    pandalId: 'contai-sabuj-sangha',
    pandalName: 'Contai Sabuj Sangha Ground',
    note: 'Reserved local Toto for visiting 4 town pandals without foot fatigue.',
    createdAt: '2026-10-20T17:35:00Z',
    createdBy: 'user_debojyoti_member',
  },
];

// ============================================================================
// EXPENSE STORAGE & CRUD OPERATIONS
// ============================================================================

export const getTripExpenses = (tripId: string): TripExpenseRecord[] => {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_EXPENSES_PREFIX}${tripId}`);
    if (raw) {
      const parsed: TripExpenseRecord[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading trip expenses:', err);
  }

  // Pre-seed if initial demo trip
  if (tripId === 'group-kolkata-2026') {
    saveStoredExpenses(tripId, SEED_DEMO_EXPENSES_KOLKATA);
    return SEED_DEMO_EXPENSES_KOLKATA;
  } else if (tripId === 'group-contai-2026') {
    saveStoredExpenses(tripId, SEED_DEMO_EXPENSES_CONTAI);
    return SEED_DEMO_EXPENSES_CONTAI;
  }

  return [];
};

const saveStoredExpenses = (tripId: string, expenses: TripExpenseRecord[]): void => {
  try {
    localStorage.setItem(
      `${LOCAL_STORAGE_EXPENSES_PREFIX}${tripId}`,
      JSON.stringify(expenses)
    );
  } catch (err) {
    console.warn('Error writing trip expenses:', err);
  }
};

/**
 * Add a new group expense
 */
export const addTripExpense = async (
  expenseData: Omit<TripExpenseRecord, 'id' | 'createdAt'>
): Promise<TripExpenseRecord> => {
  // Validate total amount
  if (!expenseData.amount || expenseData.amount <= 0 || isNaN(expenseData.amount)) {
    throw new Error('Expense amount must be greater than zero.');
  }

  const tripId = expenseData.tripId;
  const currentExpenses = getTripExpenses(tripId);
  const now = new Date().toISOString();
  const newId = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const newExpense: TripExpenseRecord = {
    ...expenseData,
    id: newId,
    amount: roundToTwoDecimals(expenseData.amount),
    createdAt: now,
    updatedAt: now,
  };

  currentExpenses.unshift(newExpense);
  saveStoredExpenses(tripId, currentExpenses);

  // Sync to Supabase if configured
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('expenses').insert({
        id: newId.startsWith('exp_') ? undefined : newId,
        trip_id: tripId,
        paid_by: newExpense.paidBy,
        amount: newExpense.amount,
        title: newExpense.title,
        category: newExpense.category,
        split_between: newExpense.splitBetween,
      });
    } catch (err) {
      console.warn('Supabase expense insert error:', err);
    }
  }

  // Broadcast to other tabs & active realtime listeners
  groupBroadcastChannel?.postMessage({
    type: 'EXPENSE_ADDED',
    tripId,
    expense: newExpense,
  });

  return newExpense;
};

/**
 * Update an existing group expense
 */
export const updateTripExpense = async (
  expenseId: string,
  updates: Partial<TripExpenseRecord>,
  currentUserId: string
): Promise<TripExpenseRecord> => {
  const tripId = updates.tripId;
  if (!tripId) throw new Error('Trip ID is required to update expense');

  const currentExpenses = getTripExpenses(tripId);
  const targetIdx = currentExpenses.findIndex((e) => e.id === expenseId);

  if (targetIdx === -1) {
    throw new Error('Expense not found');
  }

  const existing = currentExpenses[targetIdx];

  // Permission check: only creator, payer, or group admin can edit
  const group = getTripGroup(tripId);
  const isAdmin = group?.myRole === 'admin' || group?.createdBy === currentUserId;
  const isCreator = existing.createdBy === currentUserId || existing.paidBy === currentUserId;

  if (!isAdmin && !isCreator) {
    throw new Error('You do not have permission to edit this expense.');
  }

  const updated: TripExpenseRecord = {
    ...existing,
    ...updates,
    amount: updates.amount ? roundToTwoDecimals(updates.amount) : existing.amount,
    updatedAt: new Date().toISOString(),
  };

  currentExpenses[targetIdx] = updated;
  saveStoredExpenses(tripId, currentExpenses);

  // Sync with Supabase
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase
        .from('expenses')
        .update({
          title: updated.title,
          amount: updated.amount,
          category: updated.category,
          paid_by: updated.paidBy,
          split_between: updated.splitBetween,
        })
        .eq('id', expenseId);
    } catch (err) {
      console.warn('Supabase expense update error:', err);
    }
  }

  // Broadcast realtime update
  groupBroadcastChannel?.postMessage({
    type: 'EXPENSE_UPDATED',
    tripId,
    expense: updated,
  });

  return updated;
};

/**
 * Delete an expense
 */
export const deleteTripExpense = async (
  expenseId: string,
  currentUserId: string,
  tripId: string
): Promise<{ success: boolean; error?: string }> => {
  const currentExpenses = getTripExpenses(tripId);
  const target = currentExpenses.find((e) => e.id === expenseId);

  if (!target) {
    return { success: false, error: 'Expense not found' };
  }

  // Permission check
  const group = getTripGroup(tripId);
  const isAdmin = group?.myRole === 'admin' || group?.createdBy === currentUserId;
  const isCreator = target.createdBy === currentUserId || target.paidBy === currentUserId;

  if (!isAdmin && !isCreator) {
    return { success: false, error: 'You do not have permission to delete this expense.' };
  }

  const filtered = currentExpenses.filter((e) => e.id !== expenseId);
  saveStoredExpenses(tripId, filtered);

  // Supabase delete
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('expenses').delete().eq('id', expenseId);
    } catch (err) {
      console.warn('Supabase expense delete error:', err);
    }
  }

  // Broadcast realtime update
  groupBroadcastChannel?.postMessage({
    type: 'EXPENSE_DELETED',
    tripId,
    expenseId,
  });

  return { success: true };
};

// ============================================================================
// WHATSAPP / CLIPBOARD SHARE TEXT GENERATOR
// ============================================================================

export const generateWhatsAppSettlementText = (
  summary: GroupExpenseDashboardSummary,
  tripName: string
): string => {
  const lines: string[] = [];
  lines.push(`🎉 *${tripName} — PujaTrip Expense Summary* 🪔`);
  lines.push(`💰 *Total Spent:* ${summary.formattedTotalSpending}`);
  lines.push('');

  // Category Breakdown
  lines.push('📊 *Category Breakdown:*');
  summary.categoryStats.forEach((cat) => {
    lines.push(`• ${cat.emoji} ${cat.categoryLabel}: ${formatRupees(cat.total)} (${cat.percentage}%)`);
  });
  lines.push('');

  // Individual Contributions
  lines.push('👥 *Member Contributions:*');
  summary.memberBalances.forEach((m) => {
    const net = m.netBalance;
    const netStr =
      net > 0.01
        ? `receives ${formatRupees(net, true)}`
        : net < -0.01
        ? `owes ${formatRupees(Math.abs(net), true)}`
        : 'settled';
    lines.push(`• ${m.userName}: Paid ${formatRupees(m.totalPaid)} | Share: ${formatRupees(m.totalOwed)} (${netStr})`);
  });
  lines.push('');

  // Smart Settlements
  if (summary.smartSettlements.length > 0) {
    lines.push('⚡ *Simplified Settlement Plan:*');
    summary.smartSettlements.forEach((s, idx) => {
      lines.push(`${idx + 1}. *${s.fromUserName}* ➡️ pays *${s.toUserName}* ${formatRupees(s.amount, true)}`);
    });
    lines.push('');
    lines.push('💡 *Tip:* Pay directly to friends via UPI and clear balances!');
  } else {
    lines.push('✨ *All balances are perfectly settled!* No transactions required.');
  }

  lines.push('\n_Calculated with PujaTrip Group Splitting_ 🌸');
  return lines.join('\n');
};
