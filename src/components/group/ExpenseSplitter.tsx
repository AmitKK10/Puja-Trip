import React, { useState, useMemo } from 'react';
import {
  TripPlan,
  TripMember,
  UserProfile,
  ExpenseCategory,
  TripExpenseRecord,
  ExpenseParticipantSplit,
} from '../../types';
import {
  addTripExpense,
  getTripExpenses,
  formatRupees,
  EXPENSE_CATEGORIES,
} from '../../services/groupExpenseService';
import { DEMO_PROFILES, FESTIVE_AVATARS } from '../../services/friendGroupService';
import { playKanshorBell, playDhakHit } from '../../utils/audioSynth';
import confetti from 'canvas-confetti';
import {
  Calculator,
  Plus,
  Receipt,
  Users,
  Check,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Clock,
  Trash2,
  Car,
  Utensils,
  Ticket,
  Coffee,
  Split,
  ChevronDown,
} from 'lucide-react';

interface ExpenseSplitterProps {
  trip: TripPlan;
  members: TripMember[];
  currentUser: UserProfile;
  isDarkMode: boolean;
  onExpenseAdded?: () => void;
}

interface CommonCostPreset {
  title: string;
  category: ExpenseCategory;
  suggestedAmount: number;
  icon: string;
  bengaliTitle: string;
}

const COMMON_COST_PRESETS: CommonCostPreset[] = [
  {
    title: 'Yellow Taxi / Uber',
    bengaliTitle: 'হলুদ ট্যাক্সি / ক্যাব',
    category: 'transport_cab',
    suggestedAmount: 480,
    icon: '🚕',
  },
  {
    title: 'Shared Auto / Toto',
    bengaliTitle: 'অটো / টোটো ভাড়া',
    category: 'transport_cab',
    suggestedAmount: 160,
    icon: '🛺',
  },
  {
    title: 'Kathi Rolls & Street Food',
    bengaliTitle: 'রোল ও স্ট্রিট ফুড',
    category: 'food',
    suggestedAmount: 650,
    icon: '🌯',
  },
  {
    title: 'Bhog Prasad & Dinner',
    bengaliTitle: 'ভোগ প্রসাদ ও রাতের খাবার',
    category: 'food',
    suggestedAmount: 900,
    icon: '🍛',
  },
  {
    title: 'Metro Smart Cards / Tokens',
    bengaliTitle: 'মেট্রো টিকিট',
    category: 'transport_transit',
    suggestedAmount: 120,
    icon: '🚇',
  },
  {
    title: 'Chai, Water & Telebhaja',
    bengaliTitle: 'চা, জল ও তেলেভাজা',
    category: 'snacks',
    suggestedAmount: 220,
    icon: '☕',
  },
];

export const ExpenseSplitter: React.FC<ExpenseSplitterProps> = ({
  trip,
  members,
  currentUser,
  isDarkMode,
  onExpenseAdded,
}) => {
  // Form State
  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('transport_cab');
  const [paidByUserId, setPaidByUserId] = useState<string>(currentUser.id);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(() =>
    members.map((m) => m.userId)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSplitFeedback, setLastSplitFeedback] = useState<{
    title: string;
    amount: number;
    perPerson: number;
    count: number;
  } | null>(null);

  // Recent Expenses for this trip
  const [recentExpenses, setRecentExpenses] = useState<TripExpenseRecord[]>(() =>
    getTripExpenses(trip.id)
  );

  const numericAmount = useMemo(() => {
    const parsed = parseFloat(amountStr);
    return isNaN(parsed) || parsed <= 0 ? 0 : parsed;
  }, [amountStr]);

  // Real-time automatic split calculation
  const splitCalculation = useMemo(() => {
    const participantCount = selectedMemberIds.length;
    if (participantCount === 0 || numericAmount <= 0) {
      return {
        amountPerPerson: 0,
        participantCount: 0,
        formattedSplit: '₹0',
      };
    }

    const perPerson = numericAmount / participantCount;
    return {
      amountPerPerson: perPerson,
      participantCount,
      formattedSplit: formatRupees(perPerson, true),
    };
  }, [numericAmount, selectedMemberIds.length]);

  // Toggle member participation in split
  const toggleMemberSelection = (userId: string) => {
    setSelectedMemberIds((prev) => {
      if (prev.includes(userId)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSelectAllMembers = () => {
    setSelectedMemberIds(members.map((m) => m.userId));
  };

  // Apply a quick preset
  const handleApplyPreset = (preset: CommonCostPreset) => {
    setTitle(preset.title);
    setCategory(preset.category);
    setAmountStr(preset.suggestedAmount.toString());
    playDhakHit('ta', 0.5);
  };

  // Submit expense
  const handleLogSplitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || numericAmount <= 0 || selectedMemberIds.length === 0) return;

    setIsSubmitting(true);
    try {
      const payerMember = members.find((m) => m.userId === paidByUserId);
      const payerProfile =
        payerMember?.profile ||
        DEMO_PROFILES.find((p) => p.id === paidByUserId) ||
        currentUser;

      const perPerson = numericAmount / selectedMemberIds.length;
      const splits: ExpenseParticipantSplit[] = selectedMemberIds.map((uId) => {
        const m = members.find((mem) => mem.userId === uId);
        const prof = m?.profile || DEMO_PROFILES.find((p) => p.id === uId);
        return {
          userId: uId,
          userName: prof?.displayName || 'Squad Member',
          bengaliName: prof?.bengaliName,
          avatarUrl: prof?.avatarUrl,
          amount: Math.round(perPerson * 100) / 100,
        };
      });

      const now = new Date();
      const newExpense = await addTripExpense({
        tripId: trip.id,
        title: title.trim(),
        amount: numericAmount,
        category,
        paidBy: paidByUserId,
        paidByName: payerProfile.displayName,
        paidByAvatar: payerProfile.avatarUrl,
        splitType: 'equal',
        splitBetween: selectedMemberIds,
        splits,
        date: now.toISOString().split('T')[0],
        time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        createdBy: currentUser.id,
      });

      // Feedback sound & confetti
      playKanshorBell(0.8);
      playDhakHit('dha', 0.7);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#DC2626', '#F59E0B', '#10B981', '#FEF08A'],
      });

      // Feedback banner
      setLastSplitFeedback({
        title: newExpense.title,
        amount: newExpense.amount,
        perPerson,
        count: selectedMemberIds.length,
      });

      // Refresh list
      setRecentExpenses(getTripExpenses(trip.id));
      setTitle('');
      setAmountStr('');

      onExpenseAdded?.();
    } catch (err) {
      console.error('Failed to log split expense:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4" id="expense-splitter-component">
      {/* Header Banner */}
      <div
        className={`p-4 rounded-3xl border shadow-sm space-y-2.5 ${
          isDarkMode
            ? 'bg-[#281B23] border-[#F59E0B]/20 text-white'
            : 'bg-white border-[#D97706]/20 text-stone-800'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#991B1B] to-[#DC2626] text-white flex items-center justify-center shadow-xs">
              <Calculator className="w-5 h-5 text-[#FEF08A]" />
            </div>
            <div>
              <h3 className="font-display font-black text-h3 text-[#881337] dark:text-[#FEF08A] leading-tight">
                Squad Expense Splitter
              </h3>
              <p className="text-micro text-stone-500 dark:text-stone-400 font-bengali">
                ট্যাক্সি, খাবার ও পুজোর খরচ সহজেই সমান ভাগে ভাগ করুন
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-micro text-stone-400 uppercase font-semibold block">Trip Squad</span>
            <span className="font-display font-bold text-small text-[#DC2626] dark:text-amber-400">
              {members.length} Members
            </span>
          </div>
        </div>

        {/* Quick Cost Presets Carousel */}
        <div className="pt-2 border-t border-stone-200/70 dark:border-stone-800/70">
          <span className="text-micro font-bold text-stone-500 flex items-center gap-1 mb-2">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Common Durga Puja Costs (Tap to autofill):</span>
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {COMMON_COST_PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className={`p-2 rounded-xl text-left border transition-all cursor-pointer hover:scale-[1.02] active:scale-98 ${
                  isDarkMode
                    ? 'bg-stone-800/80 border-stone-700 hover:border-amber-400/50'
                    : 'bg-stone-50 border-stone-200 hover:border-amber-400'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">{p.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-micro font-bold truncate text-stone-800 dark:text-stone-200">
                      {p.title}
                    </p>
                    <p className="text-[10px] text-stone-500 truncate font-bengali">
                      {p.bengaliTitle}
                    </p>
                  </div>
                  <span className="text-micro font-bold text-[#DC2626] dark:text-[#FEF08A] shrink-0">
                    ₹{p.suggestedAmount}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <form
        onSubmit={handleLogSplitExpense}
        className={`p-4 rounded-3xl border shadow-sm space-y-4 ${
          isDarkMode
            ? 'bg-[#1F171C] border-stone-800 text-white'
            : 'bg-white border-stone-200 text-stone-800'
        }`}
      >
        <div className="space-y-3">
          {/* Expense Description */}
          <div>
            <label className="block text-micro font-bold uppercase tracking-wider text-stone-500 mb-1">
              What was this expense for? (খরচের বিবরণ)
            </label>
            <input
              id="expense-title-input"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Yellow Taxi to Bagbazar or Arsalan Biryani"
              className="w-full px-3.5 py-2.5 rounded-2xl border text-small bg-stone-50 dark:bg-stone-800/70 border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#DC2626]/50 focus:border-[#DC2626] transition-all font-medium"
            />
          </div>

          {/* Amount & Category in a Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-micro font-bold uppercase tracking-wider text-stone-500 mb-1">
                Total Amount (মোট টাকা ₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-base text-stone-400">
                  ₹
                </span>
                <input
                  id="expense-amount-input"
                  type="number"
                  step="any"
                  min="1"
                  required
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-2xl border text-base font-bold tabular-nums bg-stone-50 dark:bg-stone-800/70 border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#DC2626]/50 focus:border-[#DC2626] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-micro font-bold uppercase tracking-wider text-stone-500 mb-1">
                Expense Category (বিভাগ)
              </label>
              <select
                id="expense-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full px-3.5 py-2.5 rounded-2xl border text-small font-semibold bg-stone-50 dark:bg-stone-800/70 border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-[#DC2626]/50 focus:border-[#DC2626] transition-all"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.label} ({c.bengaliLabel})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Paid By Selection */}
          <div>
            <label className="block text-micro font-bold uppercase tracking-wider text-stone-500 mb-1">
              Who Paid? (কে টাকা দিলেন)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {members.map((member) => {
                const profile =
                  member.profile ||
                  DEMO_PROFILES.find((p) => p.id === member.userId) ||
                  currentUser;
                const avatar =
                  FESTIVE_AVATARS.find((a) => a.id === profile.avatarUrl) || FESTIVE_AVATARS[0];
                const isSelected = paidByUserId === member.userId;

                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => setPaidByUserId(member.userId)}
                    className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/40 shadow-xs'
                        : isDarkMode
                        ? 'bg-stone-800/60 border-stone-700 text-stone-300 hover:bg-stone-800'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <span className="text-base">{avatar.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-micro font-bold truncate">
                        {profile.displayName.split(' ')[0]}
                      </p>
                      {member.userId === currentUser.id && (
                        <span className="text-[10px] text-stone-400 font-semibold block leading-tight">
                          (You)
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Split Between Members Checkbox Group */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-micro font-bold uppercase tracking-wider text-stone-500">
                Split Fairly Between ({selectedMemberIds.length}/{members.length})
              </label>
              <button
                type="button"
                onClick={handleSelectAllMembers}
                className="text-micro font-bold text-[#DC2626] dark:text-amber-400 hover:underline cursor-pointer"
              >
                Select All
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {members.map((member) => {
                const isChecked = selectedMemberIds.includes(member.userId);
                const profile =
                  member.profile ||
                  DEMO_PROFILES.find((p) => p.id === member.userId) ||
                  currentUser;
                const avatar =
                  FESTIVE_AVATARS.find((a) => a.id === profile.avatarUrl) || FESTIVE_AVATARS[0];

                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggleMemberSelection(member.userId)}
                    className={`p-2 rounded-xl border text-left flex items-center justify-between gap-1.5 transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-900 dark:text-emerald-200 shadow-2xs'
                        : 'opacity-50 bg-stone-100 dark:bg-stone-800/40 border-stone-300 dark:border-stone-700 text-stone-400'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span>{avatar.emoji}</span>
                      <span className="text-micro font-bold truncate">
                        {profile.displayName.split(' ')[0]}
                      </span>
                    </div>

                    <div
                      className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] shrink-0 ${
                        isChecked ? 'bg-emerald-600 text-white' : 'border border-stone-400'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Split Calculation Box */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            numericAmount > 0
              ? 'bg-gradient-to-br from-amber-500/10 via-red-500/10 to-stone-500/10 border-amber-500/40'
              : 'bg-stone-50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-700 opacity-80'
          }`}
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Split className="w-5 h-5 text-[#DC2626] dark:text-[#FEF08A]" />
              <div>
                <span className="text-micro font-bold uppercase tracking-wider text-stone-500 block">
                  Calculated Split Per Person
                </span>
                <span className="font-display font-black text-h2 sm:text-h1 text-[#881337] dark:text-[#FEF08A]">
                  {splitCalculation.formattedSplit}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-micro text-stone-500 block">Formula:</span>
              <span className="text-small font-bold font-mono text-stone-700 dark:text-stone-300">
                ₹{numericAmount || 0} ÷ {splitCalculation.participantCount} people
              </span>
            </div>
          </div>

          {numericAmount > 0 && selectedMemberIds.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-stone-200/80 dark:border-stone-700/80 text-micro text-stone-600 dark:text-stone-300 flex items-center justify-between">
              <span>
                Each of the {selectedMemberIds.length} members owes{' '}
                <strong className="text-emerald-700 dark:text-emerald-400">
                  {splitCalculation.formattedSplit}
                </strong>
              </span>
              <span className="text-[10px] text-stone-400">Auto-balanced</span>
            </div>
          )}
        </div>

        {/* Success Feedback Alert */}
        {lastSplitFeedback && (
          <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between gap-2 text-emerald-800 dark:text-emerald-200 text-small animate-fadeIn">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold">Logged {lastSplitFeedback.title}!</span>
                <span className="text-micro block opacity-90">
                  Total ₹{lastSplitFeedback.amount} split across {lastSplitFeedback.count} people (₹
                  {Math.round(lastSplitFeedback.perPerson * 100) / 100} each).
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setLastSplitFeedback(null)}
              className="text-micro font-bold underline shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Submit Button */}
        <button
          id="btn-log-split-expense"
          type="submit"
          disabled={!title.trim() || numericAmount <= 0 || isSubmitting}
          className={`w-full py-3 px-4 rounded-2xl font-bold text-btn flex items-center justify-center gap-2 transition-all ${
            !title.trim() || numericAmount <= 0 || isSubmitting
              ? 'bg-stone-200 dark:bg-stone-800 text-stone-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-600 via-[#DC2626] to-[#881337] text-white shadow-md hover:brightness-110 active:scale-98 cursor-pointer'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>
            {isSubmitting
              ? 'Splitting Expense...'
              : `Split & Log Expense (${splitCalculation.formattedSplit} / person)`}
          </span>
        </button>
      </form>

      {/* Recent Splits Log */}
      <div
        className={`p-4 rounded-3xl border shadow-sm space-y-3 ${
          isDarkMode
            ? 'bg-[#1F171C] border-stone-800 text-white'
            : 'bg-white border-stone-200 text-stone-800'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-amber-500" />
            <h4 className="font-display font-bold text-h4 text-[#881337] dark:text-[#FEF08A]">
              Recent Trip Splits ({recentExpenses.length})
            </h4>
          </div>
          <span className="text-micro text-stone-400 font-mono">Trip Ledger</span>
        </div>

        {recentExpenses.length === 0 ? (
          <div className="py-6 text-center text-stone-500 text-small">
            No expenses logged yet. Use the form above to split your first ride or meal!
          </div>
        ) : (
          <div className="space-y-2">
            {recentExpenses.slice(0, 5).map((exp) => {
              const perMember = exp.splitBetween.length > 0 ? exp.amount / exp.splitBetween.length : exp.amount;
              const catMeta = EXPENSE_CATEGORIES.find((c) => c.id === exp.category);

              return (
                <div
                  key={exp.id}
                  className="p-3 rounded-2xl border bg-stone-50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl shrink-0">{catMeta?.emoji || '🧾'}</span>
                    <div className="min-w-0">
                      <h5 className="font-bold text-small text-stone-900 dark:text-stone-100 truncate">
                        {exp.title}
                      </h5>
                      <p className="text-micro text-stone-500">
                        Paid by <strong className="text-stone-700 dark:text-stone-300">{exp.paidByName}</strong> •{' '}
                        {exp.splitBetween.length} in split
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-display font-black text-small text-[#DC2626] dark:text-[#FEF08A] block tabular-nums">
                      {formatRupees(exp.amount, true)}
                    </span>
                    <span className="text-[10px] text-stone-400 block tabular-nums">
                      {formatRupees(perMember, true)} each
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
