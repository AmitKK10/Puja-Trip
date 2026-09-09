import React, { useState, useEffect, useMemo } from 'react';
import { TripPlan, TripMember, UserPreferences } from '../../types';
import {
  getTripExpenses,
  calculateGroupExpenseSummary,
  formatRupees,
} from '../../services/groupExpenseService';
import {
  getTripMembers,
  getCurrentUserProfile,
} from '../../services/friendGroupService';
import { playKanshorBell } from '../../utils/audioSynth';
import {
  Receipt,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
} from 'lucide-react';

interface CompactTripExpenseCardProps {
  tripId: string;
  onOpenExpenses: () => void;
  onQuickAddExpense?: () => void;
  userPrefs: UserPreferences;
}

export const CompactTripExpenseCard: React.FC<CompactTripExpenseCardProps> = ({
  tripId,
  onOpenExpenses,
  onQuickAddExpense,
  userPrefs,
}) => {
  const isDarkMode = userPrefs.themeMode === 'mahasaptami_night';
  const currentUser = getCurrentUserProfile();

  const [expenses, setExpenses] = useState(() => getTripExpenses(tripId));
  const [members, setMembers] = useState<TripMember[]>(() => getTripMembers(tripId));

  useEffect(() => {
    setExpenses(getTripExpenses(tripId));
    setMembers(getTripMembers(tripId));

    const handleBroadcast = (event: MessageEvent) => {
      if (event.data?.tripId === tripId) {
        setExpenses(getTripExpenses(tripId));
        setMembers(getTripMembers(tripId));
      }
    };

    const channel =
      typeof window !== 'undefined' && 'BroadcastChannel' in window
        ? new BroadcastChannel('pujatrip_group_sync_channel')
        : null;

    channel?.addEventListener('message', handleBroadcast);

    return () => {
      channel?.removeEventListener('message', handleBroadcast);
      channel?.close();
    };
  }, [tripId]);

  const summary = useMemo(() => {
    return calculateGroupExpenseSummary(tripId, expenses, members, currentUser.id);
  }, [tripId, expenses, members, currentUser.id]);

  const userNet = summary.currentUserBalance?.netBalance || 0;

  if (expenses.length === 0) {
    return null;
  }

  return (
    <div
      id="compact-trip-expense-card"
      onClick={onOpenExpenses}
      className={`p-3.5 sm:p-4 rounded-3xl border transition-all cursor-pointer hover:shadow-md active:scale-[0.99] group ${
        isDarkMode
          ? 'bg-gradient-to-r from-[#2B1724] via-[#20131B] to-[#1C1217] border-[#F59E0B]/30 hover:border-[#F59E0B]/50'
          : 'bg-gradient-to-r from-[#FFF9F2] via-[#FEF3C7]/40 to-[#FFFDF9] border-[#D97706]/30 hover:border-[#D97706]/50 shadow-xs'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left Icon & Spending stats */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#991B1B] to-[#DC2626] text-white flex items-center justify-center text-lg shadow-sm shrink-0">
            <Receipt className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#DC2626]">
                Squad Expenses • গ্রুপ খরচ
              </span>
              <span className="text-[10px] text-stone-400 font-bold">
                ({summary.totalExpensesCount} bills)
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-display font-black text-stone-900 dark:text-white tabular-nums">
                {summary.formattedTotalSpending}
              </span>
              <span className="text-micro text-stone-500 font-medium">total spent</span>
            </div>
          </div>
        </div>

        {/* Right: Personal balance badge & Arrow */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            {userNet > 0.01 ? (
              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-micro inline-flex items-center gap-1">
                <ArrowDownRight className="w-3 h-3" />
                <span>Get {formatRupees(userNet, true)}</span>
              </span>
            ) : userNet < -0.01 ? (
              <span className="px-2 py-0.5 rounded-lg bg-rose-500/15 text-rose-700 dark:text-rose-300 font-bold text-micro inline-flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />
                <span>Owe {formatRupees(Math.abs(userNet), true)}</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-lg bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-bold text-micro">
                Settled
              </span>
            )}
          </div>

          <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 group-hover:bg-[#DC2626] group-hover:text-white text-stone-500 flex items-center justify-center transition-colors">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
