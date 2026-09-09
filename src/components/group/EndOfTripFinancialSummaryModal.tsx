import React, { useState } from 'react';
import {
  GroupExpenseDashboardSummary,
  TripPlan,
  TripMember,
  UserPreferences,
} from '../../types';
import {
  formatRupees,
  generateWhatsAppSettlementText,
} from '../../services/groupExpenseService';
import { FESTIVE_AVATARS } from '../../services/friendGroupService';
import { DurgaThirdEye, ShankhaIcon } from '../common/BengaliMotifs';
import { playKanshorBell } from '../../utils/audioSynth';
import confetti from 'canvas-confetti';
import {
  X,
  Share2,
  Check,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  PieChart,
  Users,
  Download,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';

interface EndOfTripFinancialSummaryModalProps {
  summary: GroupExpenseDashboardSummary;
  trip: TripPlan;
  members: TripMember[];
  onClose: () => void;
  userPrefs: UserPreferences;
}

export const EndOfTripFinancialSummaryModal: React.FC<EndOfTripFinancialSummaryModalProps> = ({
  summary,
  trip,
  members,
  onClose,
  userPrefs,
}) => {
  const isDarkMode = userPrefs.themeMode === 'mahasaptami_night';
  const [copied, setCopied] = useState(false);

  const handleShareWhatsApp = () => {
    const text = generateWhatsAppSettlementText(summary, trip.name);
    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleCopyClipboard = () => {
    const text = generateWhatsAppSettlementText(summary, trip.name);
    navigator.clipboard?.writeText(text);
    setCopied(true);
    playKanshorBell(0.7);
    confetti({
      particleCount: 30,
      spread: 60,
      origin: { y: 0.6 },
    });
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div
        id="end-of-trip-summary-modal"
        className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden my-auto transition-all ${
          isDarkMode
            ? 'bg-[#1F161C] border-[#F59E0B]/30 text-stone-100'
            : 'bg-white border-[#D97706]/25 text-stone-900'
        }`}
      >
        {/* Header */}
        <div
          className={`p-5 relative border-b overflow-hidden ${
            isDarkMode
              ? 'bg-gradient-to-r from-[#2F1A24] via-[#24161F] to-[#1F161C] border-stone-800'
              : 'bg-gradient-to-r from-[#FFF8F0] via-[#FEF3C7]/40 to-[#FFFDF9] border-stone-200'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#991B1B] to-[#DC2626] text-white flex items-center justify-center shadow-lg">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-micro font-black uppercase tracking-wider text-[#DC2626]">
                  Final Trip Settlement
                </span>
                <h3 className="font-display font-black text-h3 text-stone-900 dark:text-[#FEF08A] leading-tight">
                  {trip.name}
                </h3>
                <p className="font-bengali text-micro text-stone-500 dark:text-stone-400">
                  চূড়ান্ত পুজো পরিক্রমা হিসাব ও দেনা-পাওনা নিষ্পত্তি
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Grand Total banner */}
          <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-[#881337] to-[#991B1B] text-white flex items-center justify-between shadow-md">
            <div>
              <span className="text-[11px] font-bold text-amber-200 uppercase tracking-wider block">
                Total Group Spending
              </span>
              <span className="text-2xl font-display font-black tracking-tight">
                {summary.formattedTotalSpending}
              </span>
            </div>
            <div className="text-right">
              <span className="text-micro text-amber-200 block font-medium">
                {summary.totalExpensesCount} expenses logged
              </span>
              <span className="text-micro text-white/80 font-bold">
                {members.length} Squad Members
              </span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* 1. Category Summary Grid */}
          <div className="space-y-2">
            <span className="text-micro font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5 text-[#DC2626]" />
              <span>Category Breakdown</span>
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {summary.categoryStats.map((cat) => (
                <div
                  key={cat.category}
                  className={`p-2.5 rounded-2xl border text-center ${
                    isDarkMode ? 'bg-[#291A23] border-stone-800' : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <span className="text-xl block mb-0.5">{cat.emoji}</span>
                  <span className="text-micro font-bold text-stone-700 dark:text-stone-300 block truncate">
                    {cat.categoryLabel.split(' ')[0]}
                  </span>
                  <span className="text-small font-black text-[#DC2626] tabular-nums block">
                    {formatRupees(cat.total)}
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">
                    {cat.percentage}% ({cat.count} items)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Individual Balances Table */}
          <div className="space-y-2">
            <span className="text-micro font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#DC2626]" />
              <span>Member Contributions & Balances</span>
            </span>

            <div
              className={`rounded-2xl border overflow-hidden divide-y ${
                isDarkMode
                  ? 'bg-[#181116] border-stone-800 divide-stone-800'
                  : 'bg-white border-stone-200 divide-stone-100'
              }`}
            >
              {summary.memberBalances.map((m) => {
                const av = FESTIVE_AVATARS.find((a) => a.id === m.avatarUrl) || FESTIVE_AVATARS[0];
                const net = m.netBalance;

                return (
                  <div
                    key={m.userId}
                    className="p-3 flex items-center justify-between gap-3 text-small"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-lg shrink-0">{av.emoji}</span>
                      <div className="min-w-0">
                        <span className="font-bold text-stone-900 dark:text-white truncate block">
                          {m.userName}
                        </span>
                        <span className="text-[11px] text-stone-500">
                          Paid {formatRupees(m.totalPaid)} • Share {formatRupees(m.totalOwed)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {net > 0.01 ? (
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-black text-micro inline-flex items-center gap-1">
                          Receives {formatRupees(net, true)}
                        </span>
                      ) : net < -0.01 ? (
                        <span className="px-2.5 py-1 rounded-xl bg-rose-500/15 text-rose-700 dark:text-rose-300 font-black text-micro inline-flex items-center gap-1">
                          Owes {formatRupees(Math.abs(net), true)}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-bold text-micro">
                          Settled
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Simplified Settlement Plan */}
          <div className="space-y-2">
            <span className="text-micro font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Smart Settlement Plan (Minimized Transactions)</span>
            </span>

            {summary.smartSettlements.length > 0 ? (
              <div className="space-y-2">
                {summary.smartSettlements.map((s, idx) => (
                  <div
                    key={s.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                      isDarkMode
                        ? 'bg-[#291A23] border-[#F59E0B]/20'
                        : 'bg-amber-50/60 border-amber-200/80'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-[11px] font-bold text-stone-700 dark:text-stone-300 shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 font-bold text-small text-stone-900 dark:text-white">
                          <span className="text-rose-600 dark:text-rose-400">
                            {s.fromUserName.split(' ')[0]}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {s.toUserName.split(' ')[0]}
                          </span>
                        </div>
                        <p className="text-micro text-stone-500 font-bengali">
                          {s.bengaliExplanation}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base font-display font-black text-[#DC2626] tabular-nums block">
                        {formatRupees(s.amount, true)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center text-emerald-700 dark:text-emerald-300 font-bold text-small">
                🎉 All group members are fully balanced! No payments needed.
              </div>
            )}
          </div>

          {/* Legal / Security Disclaimer */}
          <div className="p-3 rounded-2xl bg-stone-100 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 flex items-start gap-2.5 text-[11px] text-stone-500 leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Note:</strong> PujaTrip records and calculates group fair shares. Please use
              your preferred external UPI app (GPay/PhonePe/Paytm) to send payments directly to
              friends.
            </span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-btn font-bold hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyClipboard}
              className="px-3.5 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-btn font-bold flex items-center gap-1.5 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-stone-500" />
                  <span>Copy Summary</span>
                </>
              )}
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="px-4 py-2.5 rounded-xl bg-[#25D366] text-white text-btn font-black hover:bg-[#20bd5a] shadow-md transition-all flex items-center gap-1.5"
            >
              <Share2 className="w-4 h-4" />
              <span>Share on WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
