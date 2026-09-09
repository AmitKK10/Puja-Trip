import React, { useState, useEffect } from 'react';
import {
  TripExpenseRecord,
  ExpenseCategory,
  ExpenseSplitType,
  ExpenseParticipantSplit,
  TripMember,
  UserProfile,
  UserPreferences,
  Pandal,
} from '../../types';
import {
  EXPENSE_CATEGORIES,
  calculateEqualSplits,
  calculateCustomAmountSplits,
  calculatePercentageSplits,
  formatRupees,
  roundToTwoDecimals,
} from '../../services/groupExpenseService';
import { FESTIVE_AVATARS, DEMO_PROFILES } from '../../services/friendGroupService';
import { DurgaThirdEye, ShankhaIcon, DhakIcon } from '../common/BengaliMotifs';
import { playKanshorBell } from '../../utils/audioSynth';
import confetti from 'canvas-confetti';
import {
  X,
  Plus,
  Receipt,
  Users,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Camera,
  Upload,
  Check,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Info,
  DollarSign,
  Percent,
} from 'lucide-react';

interface AddExpenseModalProps {
  tripId: string;
  members: TripMember[];
  currentUserId: string;
  tripPandals?: Pandal[];
  editingExpense?: TripExpenseRecord | null;
  onSave: (expenseData: Omit<TripExpenseRecord, 'id' | 'createdAt'>) => Promise<void>;
  onClose: () => void;
  userPrefs: UserPreferences;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  tripId,
  members,
  currentUserId,
  tripPandals = [],
  editingExpense,
  onSave,
  onClose,
  userPrefs,
}) => {
  const isDarkMode = userPrefs.themeMode === 'mahasaptami_night';

  // Build quick map of member profiles
  const memberProfilesMap = React.useMemo(() => {
    const map: Record<string, UserProfile> = {};
    members.forEach((m) => {
      if (m.profile) map[m.userId] = m.profile;
    });
    return map;
  }, [members]);

  // Form states
  const [title, setTitle] = useState(editingExpense?.title || '');
  const [amountStr, setAmountStr] = useState(editingExpense ? String(editingExpense.amount) : '');
  const [category, setCategory] = useState<ExpenseCategory>(editingExpense?.category || 'food');
  const [paidBy, setPaidBy] = useState<string>(editingExpense?.paidBy || currentUserId);
  const [splitType, setSplitType] = useState<ExpenseSplitType>(editingExpense?.splitType || 'equal');

  // Participants selection (by default all members)
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>(() => {
    if (editingExpense) return editingExpense.splitBetween;
    return members.map((m) => m.userId);
  });

  // Custom Amount state (userId -> amount string)
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>(() => {
    if (editingExpense && editingExpense.splitType === 'custom_amount') {
      const map: Record<string, string> = {};
      editingExpense.splits.forEach((s) => {
        map[s.userId] = String(s.amount);
      });
      return map;
    }
    return {};
  });

  // Custom Percentage state (userId -> percentage string)
  const [customPercentages, setCustomPercentages] = useState<Record<string, string>>(() => {
    if (editingExpense && editingExpense.splitType === 'percentage') {
      const map: Record<string, string> = {};
      editingExpense.splits.forEach((s) => {
        map[s.userId] = String(s.percentage || 0);
      });
      return map;
    }
    return {};
  });

  const [date, setDate] = useState(
    editingExpense?.date || new Date().toISOString().split('T')[0]
  );
  const [time, setTime] = useState(
    editingExpense?.time ||
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  );
  const [selectedPandalId, setSelectedPandalId] = useState(editingExpense?.pandalId || '');
  const [customLocationName, setCustomLocationName] = useState(
    editingExpense?.pandalName || ''
  );
  const [note, setNote] = useState(editingExpense?.note || '');
  const [receiptPhotoUrl, setReceiptPhotoUrl] = useState<string | undefined>(
    editingExpense?.receiptPhotoUrl
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Numeric amount
  const parsedAmount = parseFloat(amountStr) || 0;

  // Toggle participant selection
  const handleToggleParticipant = (userId: string) => {
    setSelectedParticipantIds((prev) => {
      if (prev.includes(userId)) {
        // Prevent deselecting all
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  // Select all or none
  const handleSelectAllParticipants = () => {
    setSelectedParticipantIds(members.map((m) => m.userId));
  };

  // Live split calculation & validation
  const calculatedSplits = React.useMemo<ExpenseParticipantSplit[]>(() => {
    if (parsedAmount <= 0 || selectedParticipantIds.length === 0) return [];

    if (splitType === 'equal') {
      return calculateEqualSplits(parsedAmount, selectedParticipantIds, memberProfilesMap);
    }

    if (splitType === 'custom_amount') {
      const numAmounts: Record<string, number> = {};
      selectedParticipantIds.forEach((id) => {
        numAmounts[id] = parseFloat(customAmounts[id] || '0') || 0;
      });
      return calculateCustomAmountSplits(numAmounts, memberProfilesMap);
    }

    if (splitType === 'percentage') {
      const numPcts: Record<string, number> = {};
      selectedParticipantIds.forEach((id) => {
        numPcts[id] = parseFloat(customPercentages[id] || '0') || 0;
      });
      return calculatePercentageSplits(parsedAmount, numPcts, memberProfilesMap);
    }

    return [];
  }, [
    parsedAmount,
    splitType,
    selectedParticipantIds,
    customAmounts,
    customPercentages,
    memberProfilesMap,
  ]);

  // Validation calculations for custom amount & percentage
  const customAmountSum = React.useMemo(() => {
    if (splitType !== 'custom_amount') return parsedAmount;
    return selectedParticipantIds.reduce(
      (sum, id) => sum + (parseFloat(customAmounts[id] || '0') || 0),
      0
    );
  }, [splitType, selectedParticipantIds, customAmounts, parsedAmount]);

  const customPercentageSum = React.useMemo(() => {
    if (splitType !== 'percentage') return 100;
    return selectedParticipantIds.reduce(
      (sum, id) => sum + (parseFloat(customPercentages[id] || '0') || 0),
      0
    );
  }, [splitType, selectedParticipantIds, customPercentages]);

  const customAmountDiff = roundToTwoDecimals(parsedAmount - customAmountSum);
  const customPercentageDiff = roundToTwoDecimals(100 - customPercentageSum);

  // Auto-distribute equally for custom amounts or percentages on first switch
  const handleAutoDistributeCustom = () => {
    if (selectedParticipantIds.length === 0 || parsedAmount <= 0) return;
    const n = selectedParticipantIds.length;

    if (splitType === 'custom_amount') {
      const equalSplits = calculateEqualSplits(parsedAmount, selectedParticipantIds, memberProfilesMap);
      const newMap: Record<string, string> = {};
      equalSplits.forEach((s) => {
        newMap[s.userId] = String(s.amount);
      });
      setCustomAmounts(newMap);
    } else if (splitType === 'percentage') {
      const basePct = roundToTwoDecimals(100 / n);
      const newMap: Record<string, string> = {};
      selectedParticipantIds.forEach((id, idx) => {
        if (idx === n - 1) {
          const sumSoFar = roundToTwoDecimals(basePct * (n - 1));
          newMap[id] = String(roundToTwoDecimals(100 - sumSoFar));
        } else {
          newMap[id] = String(basePct);
        }
      });
      setCustomPercentages(newMap);
    }
  };

  // Pre-configured sample receipt images for realistic demonstration
  const SAMPLE_RECEIPT_PRESETS = [
    {
      id: 'receipt_food',
      label: '🍽️ Restaurant Thali Bill',
      data: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="260" viewBox="0 0 400 260"><rect width="400" height="260" fill="%23fffdf7" rx="16" stroke="%23d97706" stroke-width="2"/><text x="200" y="45" font-family="sans-serif" font-weight="bold" font-size="20" fill="%23881337" text-anchor="middle">Bhojohori Manna — Maha Saptami</text><text x="200" y="70" font-family="sans-serif" font-size="12" fill="%23666" text-anchor="middle">College Street Branch • Bill %234892</text><line x1="30" y1="85" x2="370" y2="85" stroke="%23e5e7eb" stroke-width="1.5"/><text x="40" y="115" font-family="sans-serif" font-size="14" fill="%231f2937">Special Ilish & Chingri Thali (4x)</text><text x="360" y="115" font-family="sans-serif" font-size="14" font-weight="bold" fill="%231f2937" text-anchor="end">₹2,400.00</text><text x="40" y="145" font-family="sans-serif" font-size="14" fill="%231f2937">Mishti Doi & Rosogolla (4x)</text><text x="360" y="145" font-family="sans-serif" font-size="14" font-weight="bold" fill="%231f2937" text-anchor="end">Included</text><line x1="30" y1="165" x2="370" y2="165" stroke="%231f2937" stroke-width="1" stroke-dasharray="4"/><text x="40" y="200" font-family="sans-serif" font-size="18" font-weight="bold" fill="%23dc2626">TOTAL PAID (PAID BY CASH/CARD)</text><text x="360" y="200" font-family="sans-serif" font-size="20" font-weight="bold" fill="%23dc2626" text-anchor="end">₹2,400.00</text><text x="200" y="235" font-family="sans-serif" font-size="11" fill="%239ca3af" text-anchor="middle">Verified on PujaTrip Squad Split</text></svg>',
    },
    {
      id: 'receipt_cab',
      label: '🚕 Taxi Fare Receipt',
      data: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="260" viewBox="0 0 400 260"><rect width="400" height="260" fill="%23fffdf7" rx="16" stroke="%23ca8a04" stroke-width="2"/><text x="200" y="45" font-family="sans-serif" font-weight="bold" font-size="20" fill="%23854d0e" text-anchor="middle">Kolkata Yellow Cab Night Fare</text><text x="200" y="70" font-family="sans-serif" font-size="12" fill="%23666" text-anchor="middle">Shyambazar ➔ College Square • WB04-7812</text><line x1="30" y1="85" x2="370" y2="85" stroke="%23e5e7eb" stroke-width="1.5"/><text x="40" y="115" font-family="sans-serif" font-size="14" fill="%231f2937">Meter Fare (6.2 km)</text><text x="360" y="115" font-family="sans-serif" font-size="14" font-weight="bold" fill="%231f2937" text-anchor="end">₹450.00</text><text x="40" y="145" font-family="sans-serif" font-size="14" fill="%231f2937">Festive Night Rush Surcharge</text><text x="360" y="145" font-family="sans-serif" font-size="14" font-weight="bold" fill="%231f2937" text-anchor="end">₹200.00</text><line x1="30" y1="165" x2="370" y2="165" stroke="%231f2937" stroke-width="1" stroke-dasharray="4"/><text x="40" y="200" font-family="sans-serif" font-size="18" font-weight="bold" fill="%23b45309">TOTAL CAB CHARGE</text><text x="360" y="200" font-family="sans-serif" font-size="20" font-weight="bold" fill="%23b45309" text-anchor="end">₹650.00</text><text x="200" y="235" font-family="sans-serif" font-size="11" fill="%239ca3af" text-anchor="middle">Verified on PujaTrip Squad Split</text></svg>',
    },
  ];

  // Handle Receipt File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMessage('Receipt photo must be under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setReceiptPhotoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Please enter an expense description (e.g. Dinner, Taxi, Passes).');
      return;
    }

    if (parsedAmount <= 0 || isNaN(parsedAmount)) {
      setErrorMessage('Please enter a valid expense amount greater than ₹0.');
      return;
    }

    if (selectedParticipantIds.length === 0) {
      setErrorMessage('Please select at least one participant sharing this expense.');
      return;
    }

    // Split-specific validations
    if (splitType === 'custom_amount') {
      if (Math.abs(customAmountDiff) > 0.05) {
        setErrorMessage(
          `Custom split amounts must sum to ${formatRupees(parsedAmount)}. Currently: ${formatRupees(
            customAmountSum
          )} (${customAmountDiff > 0 ? `₹${customAmountDiff} remaining` : `₹${Math.abs(customAmountDiff)} over`})`
        );
        return;
      }
    } else if (splitType === 'percentage') {
      if (Math.abs(customPercentageDiff) > 0.1) {
        setErrorMessage(
          `Percentages must total exactly 100%. Currently: ${customPercentageSum}% (${
            customPercentageDiff > 0
              ? `${customPercentageDiff}% remaining`
              : `${Math.abs(customPercentageDiff)}% over`
          })`
        );
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payerProfile = memberProfilesMap[paidBy] || DEMO_PROFILES.find((p) => p.id === paidBy);
      const payerName = payerProfile?.displayName || 'Friend';
      const payerAvatar = payerProfile?.avatarUrl || 'dhunuchi_dancer';

      const resolvedPandal = tripPandals.find((p) => p.id === selectedPandalId);
      const locationLabel =
        customLocationName.trim() ||
        (resolvedPandal ? `${resolvedPandal.name} (${resolvedPandal.area})` : undefined);

      await onSave({
        tripId,
        title: title.trim(),
        amount: parsedAmount,
        category,
        paidBy,
        paidByName: payerName,
        paidByAvatar: payerAvatar,
        splitType,
        splitBetween: selectedParticipantIds,
        splits: calculatedSplits,
        date,
        time,
        note: note.trim() || undefined,
        pandalId: selectedPandalId || undefined,
        pandalName: locationLabel,
        receiptPhotoUrl,
        createdBy: editingExpense ? editingExpense.createdBy : currentUserId,
      });

      playKanshorBell(0.8);
      confetti({
        particleCount: 25,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#DC2626', '#F59E0B', '#10B981'],
      });

      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Find Payer profile
  const currentPayer = memberProfilesMap[paidBy] || DEMO_PROFILES.find((p) => p.id === paidBy);
  const payerAvatar = FESTIVE_AVATARS.find((a) => a.id === currentPayer?.avatarUrl) || FESTIVE_AVATARS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div
        id="add-expense-modal"
        className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden my-auto transition-all ${
          isDarkMode
            ? 'bg-[#1F161C] border-[#F59E0B]/30 text-stone-100'
            : 'bg-white border-[#D97706]/25 text-stone-900'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`p-4 sm:p-5 flex items-center justify-between border-b ${
            isDarkMode
              ? 'bg-gradient-to-r from-[#2F1A24] via-[#23151D] to-[#1F161C] border-stone-800'
              : 'bg-gradient-to-r from-[#FFF9F2] via-[#FEF3C7]/40 to-[#FFFDF9] border-stone-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#991B1B] to-[#DC2626] text-white flex items-center justify-center text-xl shadow-md">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-h3 text-[#881337] dark:text-[#FEF08A]">
                {editingExpense ? 'Edit Group Expense' : 'Add Group Expense'}
              </h3>
              <p className="font-bengali text-micro text-[#DC2626] font-bold">
                গ্রুপের খরচ যোগ ও সমান বা কাস্টম ভাগ করুন
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Error message banner */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-700 dark:text-red-300 text-small flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Amount & Title Hero Block */}
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border ${
              isDarkMode
                ? 'bg-[#291A23] border-[#F59E0B]/20'
                : 'bg-gradient-to-br from-amber-50/70 to-orange-50/50 border-amber-200/80'
            }`}
          >
            <div className="space-y-3">
              <div>
                <label className="block text-micro font-bold text-stone-500 uppercase tracking-wider mb-1">
                  Expense Amount (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-2xl font-black text-[#DC2626]">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                    required
                    className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-2xl font-display font-black tracking-tight border focus:outline-none focus:ring-2 focus:ring-[#DC2626] transition-all tabular-nums ${
                      isDarkMode
                        ? 'bg-[#181116] border-stone-700 text-white placeholder:text-stone-600'
                        : 'bg-white border-stone-300 text-stone-900 placeholder:text-stone-300'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-micro font-bold text-stone-500 uppercase tracking-wider mb-1">
                  Description / Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Maha Saptami Dinner at Bhojohori Manna"
                  required
                  className={`w-full px-3.5 py-2.5 rounded-xl text-small font-semibold border focus:outline-none focus:ring-2 focus:ring-[#DC2626] transition-all ${
                    isDarkMode
                      ? 'bg-[#181116] border-stone-700 text-white placeholder:text-stone-600'
                      : 'bg-white border-stone-300 text-stone-900 placeholder:text-stone-400'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* 2. Category Selector */}
          <div>
            <label className="block text-micro font-bold text-stone-500 uppercase tracking-wider mb-1.5">
              Expense Category
            </label>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {EXPENSE_CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-2 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? isDarkMode
                          ? 'bg-[#881337] border-[#FEF08A] text-white shadow-md ring-1 ring-[#FEF08A]'
                          : 'bg-[#991B1B] border-[#991B1B] text-white shadow-md'
                        : isDarkMode
                        ? 'bg-[#251720] border-stone-800 text-stone-300 hover:border-stone-700'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:border-stone-300'
                    }`}
                  >
                    <span className="text-xl">{cat.emoji}</span>
                    <span className="text-[11px] font-bold truncate w-full px-1">
                      {cat.label.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Paid By Selector */}
          <div
            className={`p-3 rounded-2xl border space-y-2 ${
              isDarkMode ? 'bg-[#22161E] border-stone-800' : 'bg-stone-50 border-stone-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <label className="block text-micro font-bold text-stone-500 uppercase tracking-wider">
                Paid By
              </label>
              <span className="text-[11px] font-bold text-[#DC2626]">
                {paidBy === currentUserId ? 'You Paid' : `${currentPayer?.displayName || 'Friend'} Paid`}
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {members.map((m) => {
                const isSelected = paidBy === m.userId;
                const prof = m.profile || DEMO_PROFILES.find((p) => p.id === m.userId);
                const av = FESTIVE_AVATARS.find((a) => a.id === prof?.avatarUrl) || FESTIVE_AVATARS[0];

                return (
                  <button
                    key={m.userId}
                    type="button"
                    onClick={() => setPaidBy(m.userId)}
                    className={`px-2.5 py-1.5 rounded-xl border text-micro font-bold flex items-center gap-1.5 shrink-0 transition-all ${
                      isSelected
                        ? 'bg-[#DC2626] text-white border-[#DC2626] shadow-xs'
                        : isDarkMode
                        ? 'bg-[#181116] border-stone-700 text-stone-300'
                        : 'bg-white border-stone-300 text-stone-700'
                    }`}
                  >
                    <span>{av.emoji}</span>
                    <span>{prof?.displayName.split(' ')[0]}</span>
                    {m.userId === currentUserId && (
                      <span className="text-[9px] opacity-80">(You)</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Splitting Methods & Participant Selection */}
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border space-y-3 ${
              isDarkMode ? 'bg-[#251720] border-stone-800' : 'bg-stone-50 border-stone-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <label className="block text-micro font-bold text-stone-500 uppercase tracking-wider">
                Splitting Method
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleSelectAllParticipants}
                  className="text-[11px] font-bold text-[#DC2626] hover:underline"
                >
                  Select All
                </button>
              </div>
            </div>

            {/* Split Type Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-stone-200/70 dark:bg-stone-800/80">
              <button
                type="button"
                onClick={() => setSplitType('equal')}
                className={`py-1.5 px-2 rounded-lg text-micro font-bold transition-all flex items-center justify-center gap-1 ${
                  splitType === 'equal'
                    ? 'bg-white dark:bg-stone-900 text-[#881337] dark:text-[#FEF08A] shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-[#DC2626]" />
                <span>Equal Split</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSplitType('custom_amount');
                  handleAutoDistributeCustom();
                }}
                className={`py-1.5 px-2 rounded-lg text-micro font-bold transition-all flex items-center justify-center gap-1 ${
                  splitType === 'custom_amount'
                    ? 'bg-white dark:bg-stone-900 text-[#881337] dark:text-[#FEF08A] shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                <span>Custom ₹</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSplitType('percentage');
                  handleAutoDistributeCustom();
                }}
                className={`py-1.5 px-2 rounded-lg text-micro font-bold transition-all flex items-center justify-center gap-1 ${
                  splitType === 'percentage'
                    ? 'bg-white dark:bg-stone-900 text-[#881337] dark:text-[#FEF08A] shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                <Percent className="w-3.5 h-3.5 text-blue-500" />
                <span>Custom %</span>
              </button>
            </div>

            {/* Notice if Payer is not in participants */}
            {!selectedParticipantIds.includes(paidBy) && (
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-micro font-medium flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>{currentPayer?.displayName.split(' ')[0]} (Payer)</strong> is paying for
                  others and will be fully reimbursed {formatRupees(parsedAmount)}.
                </span>
              </div>
            )}

            {/* Participant Breakdown Rows */}
            <div className="space-y-2 pt-1">
              {members.map((m) => {
                const isChecked = selectedParticipantIds.includes(m.userId);
                const prof = m.profile || DEMO_PROFILES.find((p) => p.id === m.userId);
                const av = FESTIVE_AVATARS.find((a) => a.id === prof?.avatarUrl) || FESTIVE_AVATARS[0];
                const isPayer = m.userId === paidBy;

                // Value for this participant
                const currentSplit = calculatedSplits.find((s) => s.userId === m.userId);

                return (
                  <div
                    key={m.userId}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 transition-all ${
                      isChecked
                        ? isDarkMode
                          ? 'bg-[#1C1418] border-stone-700'
                          : 'bg-white border-stone-300'
                        : 'opacity-50 bg-transparent border-dashed border-stone-300 dark:border-stone-800'
                    }`}
                  >
                    {/* Checkbox & Member info */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        id={`check-${m.userId}`}
                        checked={isChecked}
                        onChange={() => handleToggleParticipant(m.userId)}
                        className="w-4 h-4 rounded text-[#DC2626] focus:ring-[#DC2626]"
                      />
                      <label
                        htmlFor={`check-${m.userId}`}
                        className="flex items-center gap-2 cursor-pointer min-w-0"
                      >
                        <span className="text-base">{av.emoji}</span>
                        <div className="min-w-0">
                          <span className="text-small font-bold truncate block">
                            {prof?.displayName}
                            {isPayer && (
                              <span className="ml-1 px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[9px] font-black">
                                PAYER
                              </span>
                            )}
                          </span>
                        </div>
                      </label>
                    </div>

                    {/* Split input / calculation display */}
                    <div className="shrink-0 flex items-center gap-1.5">
                      {splitType === 'equal' && (
                        <span className="text-small font-bold text-stone-700 dark:text-stone-300 tabular-nums">
                          {isChecked && currentSplit ? formatRupees(currentSplit.amount, true) : '₹0.00'}
                        </span>
                      )}

                      {splitType === 'custom_amount' && (
                        <div className="flex items-center gap-1">
                          <span className="text-micro font-bold text-stone-400">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            disabled={!isChecked}
                            value={customAmounts[m.userId] || ''}
                            onChange={(e) =>
                              setCustomAmounts({
                                ...customAmounts,
                                [m.userId]: e.target.value,
                              })
                            }
                            placeholder="0.00"
                            className={`w-20 px-2 py-1 rounded-lg text-small font-bold tabular-nums border text-right focus:outline-none focus:ring-1 focus:ring-[#DC2626] ${
                              isDarkMode
                                ? 'bg-stone-900 border-stone-700 text-white'
                                : 'bg-stone-50 border-stone-300 text-stone-900'
                            }`}
                          />
                        </div>
                      )}

                      {splitType === 'percentage' && (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            disabled={!isChecked}
                            value={customPercentages[m.userId] || ''}
                            onChange={(e) =>
                              setCustomPercentages({
                                ...customPercentages,
                                [m.userId]: e.target.value,
                              })
                            }
                            placeholder="0"
                            className={`w-16 px-2 py-1 rounded-lg text-small font-bold tabular-nums border text-right focus:outline-none focus:ring-1 focus:ring-[#DC2626] ${
                              isDarkMode
                                ? 'bg-stone-900 border-stone-700 text-white'
                                : 'bg-stone-50 border-stone-300 text-stone-900'
                            }`}
                          />
                          <span className="text-micro font-bold text-stone-400">%</span>
                          <span className="text-micro text-stone-500 font-mono w-16 text-right tabular-nums">
                            ({isChecked && currentSplit ? formatRupees(currentSplit.amount) : '₹0'})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Balance verification feedback */}
            {splitType === 'custom_amount' && (
              <div
                className={`p-2 rounded-xl text-micro font-bold flex items-center justify-between ${
                  Math.abs(customAmountDiff) <= 0.05
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                    : 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
                }`}
              >
                <span>Sum of amounts: {formatRupees(customAmountSum)}</span>
                <span>
                  {Math.abs(customAmountDiff) <= 0.05 ? (
                    '✅ Perfectly balanced'
                  ) : customAmountDiff > 0 ? (
                    `⚠️ ${formatRupees(customAmountDiff)} remaining to assign`
                  ) : (
                    `⚠️ ${formatRupees(Math.abs(customAmountDiff))} over total`
                  )}
                </span>
              </div>
            )}

            {splitType === 'percentage' && (
              <div
                className={`p-2 rounded-xl text-micro font-bold flex items-center justify-between ${
                  Math.abs(customPercentageDiff) <= 0.1
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                    : 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
                }`}
              >
                <span>Total percentage: {customPercentageSum}%</span>
                <span>
                  {Math.abs(customPercentageDiff) <= 0.1 ? (
                    '✅ 100% Allocated'
                  ) : customPercentageDiff > 0 ? (
                    `⚠️ ${customPercentageDiff}% remaining`
                  ) : (
                    `⚠️ ${Math.abs(customPercentageDiff)}% over 100%`
                  )}
                </span>
              </div>
            )}
          </div>

          {/* 5. Date, Time & Associated Pandal / Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-micro font-bold text-stone-500 uppercase tracking-wider mb-1">
                Date & Time
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-small font-semibold border focus:outline-none focus:ring-2 focus:ring-[#DC2626] ${
                    isDarkMode
                      ? 'bg-[#181116] border-stone-700 text-white'
                      : 'bg-white border-stone-300 text-stone-900'
                  }`}
                />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className={`w-28 px-2 py-2 rounded-xl text-small font-semibold border focus:outline-none focus:ring-2 focus:ring-[#DC2626] ${
                    isDarkMode
                      ? 'bg-[#181116] border-stone-700 text-white'
                      : 'bg-white border-stone-300 text-stone-900'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-micro font-bold text-stone-500 uppercase tracking-wider mb-1">
                Associated Pandal / Location (Optional)
              </label>
              {tripPandals.length > 0 ? (
                <select
                  value={selectedPandalId}
                  onChange={(e) => {
                    setSelectedPandalId(e.target.value);
                    const p = tripPandals.find((tp) => tp.id === e.target.value);
                    if (p) setCustomLocationName(p.name);
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-small font-semibold border focus:outline-none focus:ring-2 focus:ring-[#DC2626] ${
                    isDarkMode
                      ? 'bg-[#181116] border-stone-700 text-white'
                      : 'bg-white border-stone-300 text-stone-900'
                  }`}
                >
                  <option value="">-- Tag Trip Pandal --</option>
                  {tripPandals.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.area})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={customLocationName}
                  onChange={(e) => setCustomLocationName(e.target.value)}
                  placeholder="e.g. Near Tala Park Prattyay"
                  className={`w-full px-3 py-2 rounded-xl text-small font-semibold border focus:outline-none focus:ring-2 focus:ring-[#DC2626] ${
                    isDarkMode
                      ? 'bg-[#181116] border-stone-700 text-white'
                      : 'bg-white border-stone-300 text-stone-900'
                  }`}
                />
              )}
            </div>
          </div>

          {/* 6. Optional Note */}
          <div>
            <label className="block text-micro font-bold text-stone-500 uppercase tracking-wider mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="e.g. 4 thalis + extra mishti doi and tips included"
              className={`w-full px-3.5 py-2 rounded-xl text-small border focus:outline-none focus:ring-2 focus:ring-[#DC2626] ${
                isDarkMode
                  ? 'bg-[#181116] border-stone-700 text-white placeholder:text-stone-600'
                  : 'bg-white border-stone-300 text-stone-900 placeholder:text-stone-400'
              }`}
            />
          </div>

          {/* 7. Receipt Attachment Placeholder & Preset Picker */}
          <div>
            <label className="block text-micro font-bold text-stone-500 uppercase tracking-wider mb-1.5">
              Receipt / Bill Photo Attachment
            </label>

            {receiptPhotoUrl ? (
              <div className="relative p-2 rounded-2xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <img
                    src={receiptPhotoUrl}
                    alt="Receipt preview"
                    className="w-16 h-12 object-cover rounded-xl border border-stone-200"
                  />
                  <span className="text-micro font-bold text-emerald-600 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Receipt Attached</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setReceiptPhotoUrl(undefined)}
                  className="px-2.5 py-1 rounded-xl text-micro font-bold bg-red-500/15 text-red-600 hover:bg-red-500/25 transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer px-3 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-micro font-bold border border-stone-300 dark:border-stone-700 flex items-center gap-1.5 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-[#DC2626]" />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <span className="text-micro text-stone-400">or attach demo bill:</span>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {SAMPLE_RECEIPT_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setReceiptPhotoUrl(preset.data)}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-200 text-[11px] font-bold border border-amber-500/25 shrink-0 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-btn font-bold hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#B91C1C] text-white text-btn font-black shadow-md hover:shadow-lg transition-all active:scale-98 flex items-center gap-2 disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isSubmitting ? 'Saving...' : editingExpense ? 'Update Expense' : 'Save Expense'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
