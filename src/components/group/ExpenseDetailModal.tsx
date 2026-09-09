import React, { useState } from 'react';
import {
  TripExpenseRecord,
  TripMember,
  UserProfile,
  UserPreferences,
} from '../../types';
import {
  getCategoryMeta,
  formatRupees,
} from '../../services/groupExpenseService';
import { FESTIVE_AVATARS, DEMO_PROFILES } from '../../services/friendGroupService';
import { playKanshorBell } from '../../utils/audioSynth';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Users,
  Edit2,
  Trash2,
  Share2,
  Check,
  Eye,
  AlertTriangle,
} from 'lucide-react';

interface ExpenseDetailModalProps {
  expense: TripExpenseRecord;
  members: TripMember[];
  currentUserId: string;
  isAdmin: boolean;
  onEdit: (expense: TripExpenseRecord) => void;
  onDelete: (expenseId: string) => Promise<void>;
  onClose: () => void;
  userPrefs: UserPreferences;
}

export const ExpenseDetailModal: React.FC<ExpenseDetailModalProps> = ({
  expense,
  members,
  currentUserId,
  isAdmin,
  onEdit,
  onDelete,
  onClose,
  userPrefs,
}) => {
  const isDarkMode = userPrefs.themeMode === 'mahasaptami_night';
  const catMeta = getCategoryMeta(expense.category);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [zoomReceipt, setZoomReceipt] = useState(false);

  // Check delete/edit permissions
  const canModify =
    isAdmin || expense.createdBy === currentUserId || expense.paidBy === currentUserId;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(expense.id);
      playKanshorBell(0.6);
      onClose();
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopySummary = () => {
    const text = `💰 *${expense.title}* (${catMeta.emoji} ${catMeta.label})\nAmount: ${formatRupees(
      expense.amount
    )}\nPaid by: ${expense.paidByName}\nSplit between: ${expense.splitBetween.length} friends\nDate: ${
      expense.date
    }\n\n_Shared from PujaTrip Group Split_ 🌸`;

    navigator.clipboard?.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const payerAvatar = FESTIVE_AVATARS.find((a) => a.id === expense.paidByAvatar) || FESTIVE_AVATARS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div
        id="expense-detail-modal"
        className={`w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden my-auto transition-all ${
          isDarkMode
            ? 'bg-[#1F161C] border-[#F59E0B]/30 text-stone-100'
            : 'bg-white border-[#D97706]/25 text-stone-900'
        }`}
      >
        {/* Modal Header Banner */}
        <div
          className={`p-5 relative overflow-hidden border-b ${
            isDarkMode
              ? 'bg-gradient-to-r from-[#2F1A24] via-[#24161F] to-[#1F161C] border-stone-800'
              : 'bg-gradient-to-r from-[#FFF8F0] via-[#FEF3C7]/40 to-[#FFFDF9] border-stone-200'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-md ${catMeta.bgClass}`}
              >
                {catMeta.emoji}
              </div>
              <div>
                <span className="text-micro font-black uppercase tracking-wider text-[#DC2626]">
                  {catMeta.label} • {catMeta.bengaliLabel}
                </span>
                <h3 className="font-display font-black text-h3 text-stone-900 dark:text-white leading-tight">
                  {expense.title}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Amount Hero */}
          <div className="mt-4 pt-3 border-t border-stone-200/60 dark:border-stone-800/80 flex items-baseline justify-between">
            <span className="text-micro font-bold text-stone-500 uppercase tracking-wider">
              Total Amount
            </span>
            <span className="text-3xl font-display font-black text-[#DC2626] tabular-nums">
              {formatRupees(expense.amount, true)}
            </span>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Metadata chips (Date, Time, Pandal) */}
          <div className="flex flex-wrap gap-2 text-micro font-medium text-stone-600 dark:text-stone-300">
            <div className="px-2.5 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#DC2626]" />
              <span>{expense.date}</span>
            </div>

            {expense.time && (
              <div className="px-2.5 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>{expense.time}</span>
              </div>
            )}

            {expense.pandalName && (
              <div className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-900 dark:text-amber-200 border border-amber-500/20 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#DC2626]" />
                <span className="font-bold">{expense.pandalName}</span>
              </div>
            )}
          </div>

          {/* Payer Card */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between ${
              isDarkMode ? 'bg-[#291A23] border-stone-800' : 'bg-stone-50 border-stone-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-lg">
                {payerAvatar.emoji}
              </div>
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  Paid Full Amount
                </span>
                <span className="text-small font-bold text-stone-900 dark:text-white">
                  {expense.paidByName}
                  {expense.paidBy === currentUserId && (
                    <span className="ml-1 text-micro text-[#DC2626] font-bold">(You)</span>
                  )}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-small font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                +{formatRupees(expense.amount, true)}
              </span>
            </div>
          </div>

          {/* Splitting Breakdown Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-micro font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#DC2626]" />
                <span>
                  Split Breakdown ({expense.splitType.replace('_', ' ')})
                </span>
              </span>
              <span className="text-micro font-bold text-stone-400">
                {expense.splitBetween.length} friends
              </span>
            </div>

            <div
              className={`rounded-2xl border overflow-hidden divide-y ${
                isDarkMode
                  ? 'bg-[#181116] border-stone-800 divide-stone-800/60'
                  : 'bg-white border-stone-200 divide-stone-100'
              }`}
            >
              {expense.splits && expense.splits.length > 0 ? (
                expense.splits.map((s) => (
                  <div
                    key={s.userId}
                    className="p-2.5 flex items-center justify-between text-small"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-800 dark:text-stone-200">
                        {s.userName}
                        {s.userId === currentUserId && (
                          <span className="ml-1 text-micro text-[#DC2626] font-bold">(You)</span>
                        )}
                      </span>
                      {s.percentage && (
                        <span className="text-micro text-stone-400">({s.percentage}%)</span>
                      )}
                    </div>
                    <span className="font-bold text-stone-700 dark:text-stone-300 tabular-nums">
                      {formatRupees(s.amount, true)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-micro text-stone-400">
                  Equal split among all {expense.splitBetween.length} participants
                </div>
              )}
            </div>
          </div>

          {/* Notes if present */}
          {expense.note && (
            <div
              className={`p-3 rounded-2xl border text-small ${
                isDarkMode ? 'bg-[#22161E] border-stone-800 text-stone-300' : 'bg-stone-50 border-stone-200 text-stone-700'
              }`}
            >
              <div className="flex items-center gap-1.5 text-micro font-bold text-stone-400 uppercase tracking-wider mb-1">
                <FileText className="w-3.5 h-3.5 text-[#DC2626]" />
                <span>Notes</span>
              </div>
              <p className="italic text-stone-700 dark:text-stone-300">{expense.note}</p>
            </div>
          )}

          {/* Receipt Preview if attached */}
          {expense.receiptPhotoUrl && (
            <div className="space-y-1.5">
              <span className="text-micro font-bold text-stone-500 uppercase tracking-wider">
                Attached Receipt Photo
              </span>
              <div
                onClick={() => setZoomReceipt(true)}
                className="cursor-pointer group relative rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-900 max-h-40 flex items-center justify-center"
              >
                <img
                  src={expense.receiptPhotoUrl}
                  alt="Attached receipt"
                  className="w-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-micro font-bold gap-1.5">
                  <Eye className="w-4 h-4" />
                  <span>Click to Zoom</span>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Alert Box */}
          {showDeleteConfirm && (
            <div className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-700 dark:text-red-300 space-y-2.5 animate-fadeIn">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-small">Delete this expense?</h4>
                  <p className="text-micro opacity-90">
                    This will remove the expense from all group balances and settlement calculations.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 rounded-xl border border-red-300 dark:border-red-800 text-micro font-bold hover:bg-red-500/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-3.5 py-1.5 rounded-xl bg-red-600 text-white text-micro font-black hover:bg-red-700"
                >
                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopySummary}
              className="px-3 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-micro font-bold flex items-center gap-1.5 transition-colors"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-[#DC2626]" />
                  <span>Share</span>
                </>
              )}
            </button>

            {canModify && !showDeleteConfirm && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-500/10 transition-colors"
                title="Delete Expense"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {canModify && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(expense);
                }}
                className="px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-micro font-bold hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-500" />
                <span>Edit</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-micro font-bold hover:opacity-90 transition-opacity"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Zoom Receipt Modal */}
      {zoomReceipt && expense.receiptPhotoUrl && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setZoomReceipt(false)}
        >
          <div className="max-w-2xl max-h-[90vh] relative">
            <img
              src={expense.receiptPhotoUrl}
              alt="Zoomed receipt"
              className="rounded-2xl max-h-[85vh] w-auto object-contain border border-stone-700"
            />
            <button
              onClick={() => setZoomReceipt(false)}
              className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
