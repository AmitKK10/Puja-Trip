import React, { useState, useEffect, useMemo } from 'react';
import {
  TripPlan,
  TripMember,
  TripExpenseRecord,
  GroupExpenseDashboardSummary,
  UserPreferences,
  Pandal,
} from '../../types';
import {
  getTripExpenses,
  addTripExpense,
  updateTripExpense,
  deleteTripExpense,
  calculateGroupExpenseSummary,
  formatRupees,
  getCategoryMeta,
} from '../../services/groupExpenseService';
import { getCurrentUserProfile, FESTIVE_AVATARS, DEMO_PROFILES } from '../../services/friendGroupService';
import { AddExpenseModal } from './AddExpenseModal';
import { ExpenseDetailModal } from './ExpenseDetailModal';
import { EndOfTripFinancialSummaryModal } from './EndOfTripFinancialSummaryModal';
import { DurgaThirdEye, ShankhaIcon, DhakIcon } from '../common/BengaliMotifs';
import { playKanshorBell, playDhakHit } from '../../utils/audioSynth';
import {
  Plus,
  Receipt,
  Sparkles,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Scale,
  Calendar,
  Clock,
  MapPin,
  FileCheck2,
  Share2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  ChevronRight,
  Filter,
  Layers,
  DollarSign,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react';

interface GroupExpenseDashboardProps {
  trip: TripPlan;
  members: TripMember[];
  tripPandals?: Pandal[];
  userPrefs: UserPreferences;
  onNavigateToPandal?: (pandal: Pandal) => void;
}

export const GroupExpenseDashboard: React.FC<GroupExpenseDashboardProps> = ({
  trip,
  members,
  tripPandals = [],
  userPrefs,
  onNavigateToPandal,
}) => {
  const isDarkMode = userPrefs.themeMode === 'mahasaptami_night';
  const currentUser = getCurrentUserProfile();

  // State
  const [expenses, setExpenses] = useState<TripExpenseRecord[]>(() => getTripExpenses(trip.id));
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<TripExpenseRecord | null>(null);
  const [selectedDetailExpense, setSelectedDetailExpense] = useState<TripExpenseRecord | null>(null);
  const [showEndSummaryModal, setShowEndSummaryModal] = useState(false);

  // Group Admin Status
  const isGroupAdmin = useMemo(() => {
    const mem = members.find((m) => m.userId === currentUser.id);
    return mem?.role === 'admin' || trip.id.includes('kolkata') || trip.id.includes('contai');
  }, [members, currentUser.id, trip.id]);

  // Load and subscribe to real-time expense updates
  useEffect(() => {
    setExpenses(getTripExpenses(trip.id));

    const handleBroadcast = (event: MessageEvent) => {
      if (event.data?.tripId === trip.id) {
        setExpenses(getTripExpenses(trip.id));
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
  }, [trip.id]);

  // Compute live Summary & Settlements
  const summary: GroupExpenseDashboardSummary = useMemo(() => {
    return calculateGroupExpenseSummary(trip.id, expenses, members, currentUser.id);
  }, [trip.id, expenses, members, currentUser.id]);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    if (activeCategoryFilter === 'all') return expenses;
    return expenses.filter((e) => e.category === activeCategoryFilter);
  }, [expenses, activeCategoryFilter]);

  // Group Expenses by Date for History Timeline
  const groupedExpenses = useMemo(() => {
    const groups: Record<string, TripExpenseRecord[]> = {};
    filteredExpenses.forEach((exp) => {
      const dateKey = exp.date || 'Earlier';
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(exp);
    });
    return groups;
  }, [filteredExpenses]);

  // Handlers
  const handleSaveExpense = async (expenseData: Omit<TripExpenseRecord, 'id' | 'createdAt'>) => {
    if (editingExpense) {
      await updateTripExpense(editingExpense.id, expenseData, currentUser.id);
    } else {
      await addTripExpense(expenseData);
    }
    setExpenses(getTripExpenses(trip.id));
    setEditingExpense(null);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    await deleteTripExpense(expenseId, currentUser.id, trip.id);
    setExpenses(getTripExpenses(trip.id));
  };

  const currentUserNet = summary.currentUserBalance?.netBalance || 0;

  return (
    <div id="group-expense-dashboard" className="space-y-4 animate-fadeIn">
      {/* 1. HERO FINANCIAL SUMMARY CARD */}
      <div
        className={`p-4 sm:p-5 rounded-3xl border shadow-lg relative overflow-hidden transition-all ${
          isDarkMode
            ? 'bg-gradient-to-br from-[#2D1723] via-[#21141D] to-[#191016] border-[#F59E0B]/30'
            : 'bg-gradient-to-br from-[#881337] via-[#991B1B] to-[#B91C1C] text-white border-[#D97706]/40'
        }`}
      >
        {/* Subtle Motif in background */}
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-15 pointer-events-none">
          <DurgaThirdEye className="w-36 h-36" />
        </div>

        <div className="relative z-10 space-y-3.5">
          {/* Top row: Label and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-amber-300">
                <Receipt className="w-4 h-4" />
              </div>
              <span className="text-micro font-black tracking-wider uppercase text-amber-200">
                Group Expense Ledger • হিসাবের খাতা
              </span>
            </div>

            <button
              onClick={() => {
                setShowEndSummaryModal(true);
                playKanshorBell(0.6);
              }}
              className="px-2.5 py-1 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-300/30 text-[11px] font-bold flex items-center gap-1 transition-colors"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Final Summary</span>
            </button>
          </div>

          {/* Main Total & User Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Total Trip Spending */}
            <div className="p-3 rounded-2xl bg-black/20 backdrop-blur-sm border border-white/10">
              <span className="text-micro text-white/80 block font-medium">
                Total Squad Spending ({summary.totalExpensesCount} bills)
              </span>
              <span className="text-3xl font-display font-black text-amber-300 tracking-tight tabular-nums">
                {summary.formattedTotalSpending}
              </span>
            </div>

            {/* Current User Personal Balance */}
            <div className="p-3 rounded-2xl bg-black/20 backdrop-blur-sm border border-white/10 flex flex-col justify-center">
              <span className="text-micro text-white/80 block font-medium">
                Your Balance ({currentUser.displayName.split(' ')[0]})
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                {currentUserNet > 0.01 ? (
                  <div className="flex items-center gap-1.5 text-emerald-300 font-display font-black text-xl tabular-nums">
                    <ArrowDownRight className="w-5 h-5 shrink-0" />
                    <span>You Receive {formatRupees(currentUserNet, true)}</span>
                  </div>
                ) : currentUserNet < -0.01 ? (
                  <div className="flex items-center gap-1.5 text-rose-300 font-display font-black text-xl tabular-nums">
                    <ArrowUpRight className="w-5 h-5 shrink-0" />
                    <span>You Owe {formatRupees(Math.abs(currentUserNet), true)}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-amber-200 font-display font-bold text-lg">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>You are fully settled up!</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Add Expense Action Button */}
          <div className="pt-1 flex gap-2">
            <button
              id="add-expense-quick-btn"
              onClick={() => {
                setEditingExpense(null);
                setShowAddModal(true);
                playDhakHit();
              }}
              className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-stone-950 font-display font-black text-small shadow-md hover:shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add New Expense (বিল যোগ করুন)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. SMART SETTLEMENT (DEBT MINIMIZATION) CARD */}
      <div
        className={`p-4 rounded-3xl border transition-all ${
          isDarkMode
            ? 'bg-[#22161E] border-[#F59E0B]/25 text-stone-100'
            : 'bg-white border-[#D97706]/20 text-stone-900 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-display font-bold text-h4 text-[#881337] dark:text-[#FEF08A]">
                Smart Settlement Plan
              </h4>
              <p className="text-[11px] text-stone-500 font-bengali">
                সবচেয়ে কম ট্রানজাকশনে হিসাব নিষ্পত্তির পরামর্শ
              </p>
            </div>
          </div>

          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
            {summary.smartSettlements.length} Transfers
          </span>
        </div>

        {summary.smartSettlements.length > 0 ? (
          <div className="space-y-2">
            {summary.smartSettlements.map((s, idx) => {
              const isCurrentUserSender = s.fromUserId === currentUser.id;
              const isCurrentUserReceiver = s.toUserId === currentUser.id;

              return (
                <div
                  key={s.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                    isCurrentUserSender
                      ? 'bg-rose-500/10 border-rose-500/30'
                      : isCurrentUserReceiver
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : isDarkMode
                      ? 'bg-[#181116] border-stone-800'
                      : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center text-micro font-bold shrink-0">
                      {idx + 1}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 font-bold text-small">
                        <span
                          className={
                            isCurrentUserSender
                              ? 'text-rose-600 font-black'
                              : 'text-stone-800 dark:text-stone-200'
                          }
                        >
                          {s.fromUserName.split(' ')[0]}
                          {isCurrentUserSender && ' (You)'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span
                          className={
                            isCurrentUserReceiver
                              ? 'text-emerald-600 font-black'
                              : 'text-stone-800 dark:text-stone-200'
                          }
                        >
                          {s.toUserName.split(' ')[0]}
                          {isCurrentUserReceiver && ' (You)'}
                        </span>
                      </div>
                      <p className="text-micro text-stone-500 truncate">{s.explanation}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-base font-display font-black text-[#DC2626] tabular-nums block">
                      {formatRupees(s.amount, true)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center text-emerald-700 dark:text-emerald-300 font-bold text-small">
            ✨ All member balances are currently 100% equalized!
          </div>
        )}

        {/* Small Notice */}
        <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-2.5 text-center flex items-center justify-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span>PujaTrip organizes balances. Settle directly with friends via your UPI app.</span>
        </p>
      </div>

      {/* 3. MEMBER SPENDING & SHARE BREAKDOWN */}
      <div
        className={`p-4 rounded-3xl border transition-all ${
          isDarkMode
            ? 'bg-[#22161E] border-stone-800 text-stone-100'
            : 'bg-white border-stone-200 text-stone-900 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#DC2626]" />
            <h4 className="font-display font-bold text-h4 text-stone-900 dark:text-white">
              Member Net Balances
            </h4>
          </div>
          <span className="text-micro text-stone-500 font-bold">
            {members.length} Participants
          </span>
        </div>

        <div className="space-y-2">
          {summary.memberBalances.map((m) => {
            const av = FESTIVE_AVATARS.find((a) => a.id === m.avatarUrl) || FESTIVE_AVATARS[0];
            const net = m.netBalance;

            return (
              <div
                key={m.userId}
                className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                  m.isCurrentUser
                    ? isDarkMode
                      ? 'bg-[#2E1A27] border-[#F59E0B]/40'
                      : 'bg-amber-50/70 border-amber-200'
                    : isDarkMode
                    ? 'bg-[#181116] border-stone-800'
                    : 'bg-stone-50 border-stone-200'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-base shrink-0">
                    {av.emoji}
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-small text-stone-900 dark:text-white truncate block">
                      {m.userName}
                      {m.isCurrentUser && (
                        <span className="ml-1 text-[10px] font-black text-[#DC2626] uppercase">
                          (You)
                        </span>
                      )}
                    </span>
                    <span className="text-micro text-stone-500">
                      Paid: <strong>{formatRupees(m.totalPaid)}</strong> • Share: <strong>{formatRupees(m.totalOwed)}</strong>
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {net > 0.01 ? (
                    <div>
                      <span className="text-small font-black text-emerald-600 dark:text-emerald-400 tabular-nums block">
                        +{formatRupees(net, true)}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold">Receives</span>
                    </div>
                  ) : net < -0.01 ? (
                    <div>
                      <span className="text-small font-black text-rose-600 dark:text-rose-400 tabular-nums block">
                        -{formatRupees(Math.abs(net), true)}
                      </span>
                      <span className="text-[10px] text-rose-600 font-bold">Owes</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-small font-bold text-stone-400 tabular-nums block">₹0.00</span>
                      <span className="text-[10px] text-stone-400">Settled</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. CATEGORY BREAKDOWN BARS */}
      {summary.categoryStats.length > 0 && (
        <div
          className={`p-4 rounded-3xl border space-y-3 ${
            isDarkMode
              ? 'bg-[#22161E] border-stone-800 text-stone-100'
              : 'bg-white border-stone-200 text-stone-900 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <h4 className="font-display font-bold text-h4 text-stone-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-500" />
              <span>Spending by Category</span>
            </h4>
            <span className="text-micro font-bold text-stone-500">
              {summary.categoryStats.length} Categories
            </span>
          </div>

          {/* Segmented bar visual */}
          <div className="h-3.5 w-full rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden flex shadow-inner">
            {summary.categoryStats.map((cat, idx) => {
              const bgColors = [
                'bg-amber-500',
                'bg-yellow-500',
                'bg-blue-500',
                'bg-purple-500',
                'bg-pink-500',
                'bg-orange-500',
                'bg-emerald-500',
                'bg-stone-500',
              ];
              return (
                <div
                  key={cat.category}
                  style={{ width: `${Math.max(2, cat.percentage)}%` }}
                  className={`h-full ${bgColors[idx % bgColors.length]} transition-all`}
                  title={`${cat.categoryLabel}: ${formatRupees(cat.total)} (${cat.percentage}%)`}
                />
              );
            })}
          </div>

          {/* Category List */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {summary.categoryStats.map((cat) => (
              <div
                key={cat.category}
                className={`p-2.5 rounded-2xl border flex items-center justify-between text-micro ${
                  isDarkMode ? 'bg-[#181116] border-stone-800' : 'bg-stone-50 border-stone-200'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base">{cat.emoji}</span>
                  <span className="font-bold text-stone-800 dark:text-stone-200 truncate">
                    {cat.categoryLabel.split(' ')[0]}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-stone-900 dark:text-white tabular-nums block">
                    {formatRupees(cat.total)}
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">
                    {cat.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. EXPENSE HISTORY TIMELINE */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between px-1">
          <div>
            <h4 className="font-display font-black text-h4 text-stone-900 dark:text-white">
              Expense Timeline & History
            </h4>
            <p className="text-micro text-stone-500 font-bengali">
              সমস্ত খরচের বিবরণ ও রসিদ
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-[50%] no-scrollbar">
            <button
              onClick={() => setActiveCategoryFilter('all')}
              className={`px-2.5 py-1 rounded-xl text-micro font-bold shrink-0 transition-colors ${
                activeCategoryFilter === 'all'
                  ? 'bg-[#DC2626] text-white'
                  : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
              }`}
            >
              All
            </button>
            {summary.categoryStats.map((c) => (
              <button
                key={c.category}
                onClick={() => setActiveCategoryFilter(c.category)}
                className={`px-2 py-1 rounded-xl text-micro font-bold shrink-0 transition-colors flex items-center gap-1 ${
                  activeCategoryFilter === c.category
                    ? 'bg-[#DC2626] text-white'
                    : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                }`}
              >
                <span>{c.emoji}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Expenses List */}
        {filteredExpenses.length > 0 ? (
          <div className="space-y-4">
            {Object.entries(groupedExpenses).map(([dateKey, items]) => (
              <div key={dateKey} className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <Calendar className="w-3.5 h-3.5 text-[#DC2626]" />
                  <span className="text-micro font-black uppercase tracking-wider text-stone-500">
                    {dateKey}
                  </span>
                  <div className="h-px bg-stone-200 dark:bg-stone-800 flex-1" />
                </div>

                <div className="space-y-2">
                  {items.map((expense) => {
                    const catMeta = getCategoryMeta(expense.category);
                    const isPayer = expense.paidBy === currentUser.id;
                    const userSplit = expense.splits?.find((s) => s.userId === currentUser.id);

                    return (
                      <div
                        key={expense.id}
                        id={`expense-card-${expense.id}`}
                        onClick={() => {
                          setSelectedDetailExpense(expense);
                          playKanshorBell(0.5);
                        }}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer hover:shadow-md active:scale-[0.99] flex items-center justify-between gap-3 ${
                          isDarkMode
                            ? 'bg-[#1F161C] border-stone-800 hover:border-stone-700'
                            : 'bg-white border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        {/* Category Emoji & Info */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 ${catMeta.bgClass}`}
                          >
                            {catMeta.emoji}
                          </div>

                          <div className="min-w-0">
                            <h5 className="font-bold text-small text-stone-900 dark:text-white truncate">
                              {expense.title}
                            </h5>
                            <div className="flex items-center gap-1.5 text-micro text-stone-500">
                              <span>Paid by {expense.paidByName.split(' ')[0]}</span>
                              <span>•</span>
                              <span>{expense.splitBetween.length} friends</span>
                              {expense.receiptPhotoUrl && (
                                <>
                                  <span>•</span>
                                  <span className="text-amber-600 dark:text-amber-400 font-bold">
                                    📷 Bill
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Amount & User Owed */}
                        <div className="text-right shrink-0">
                          <span className="text-base font-display font-black text-stone-900 dark:text-white tabular-nums block">
                            {formatRupees(expense.amount)}
                          </span>
                          <span className="text-micro font-bold text-stone-500 tabular-nums">
                            {isPayer
                              ? 'You paid'
                              : userSplit
                              ? `Your share ${formatRupees(userSplit.amount, true)}`
                              : 'Not in split'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-3xl border border-dashed border-stone-300 dark:border-stone-800 text-center space-y-2">
            <Receipt className="w-10 h-10 text-stone-400 mx-auto" />
            <p className="font-bold text-stone-700 dark:text-stone-300">No expenses recorded yet</p>
            <p className="text-micro text-stone-500">
              Tap below to add the first food, cab, or VIP pass bill!
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-2 px-4 py-2 rounded-xl bg-[#DC2626] text-white text-micro font-bold"
            >
              Add First Expense
            </button>
          </div>
        )}
      </div>

      {/* MODALS */}
      {showAddModal && (
        <AddExpenseModal
          tripId={trip.id}
          members={members}
          currentUserId={currentUser.id}
          tripPandals={tripPandals}
          editingExpense={editingExpense}
          onSave={handleSaveExpense}
          onClose={() => {
            setShowAddModal(false);
            setEditingExpense(null);
          }}
          userPrefs={userPrefs}
        />
      )}

      {selectedDetailExpense && (
        <ExpenseDetailModal
          expense={selectedDetailExpense}
          members={members}
          currentUserId={currentUser.id}
          isAdmin={isGroupAdmin}
          onEdit={(exp) => {
            setSelectedDetailExpense(null);
            setEditingExpense(exp);
            setShowAddModal(true);
          }}
          onDelete={async (expId) => {
            await handleDeleteExpense(expId);
            setSelectedDetailExpense(null);
          }}
          onClose={() => setSelectedDetailExpense(null)}
          userPrefs={userPrefs}
        />
      )}

      {showEndSummaryModal && (
        <EndOfTripFinancialSummaryModal
          summary={summary}
          trip={trip}
          members={members}
          onClose={() => setShowEndSummaryModal(false)}
          userPrefs={userPrefs}
        />
      )}
    </div>
  );
};
