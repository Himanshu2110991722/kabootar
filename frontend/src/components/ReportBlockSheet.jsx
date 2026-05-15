import { useState } from 'react';
import { Flag, UserX, X, ChevronRight } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const REPORT_REASONS = [
  { value: 'spam',                 label: 'Spam or fake listings' },
  { value: 'harassment',           label: 'Harassment or abuse' },
  { value: 'fake_account',         label: 'Fake account / impersonation' },
  { value: 'fraud',                label: 'Fraud or scam attempt' },
  { value: 'inappropriate_content',label: 'Inappropriate content' },
  { value: 'other',                label: 'Other' },
];

export default function ReportBlockSheet({ userId, userName, isBlocked, onBlock, onClose }) {
  const [view,        setView]        = useState('menu');   // 'menu' | 'report' | 'block_confirm'
  const [reason,      setReason]      = useState('');
  const [description, setDescription] = useState('');
  const [loading,     setLoading]     = useState(false);

  const handleReport = async () => {
    if (!reason) { toast.error('Select a reason'); return; }
    setLoading(true);
    try {
      await api.post(`/users/${userId}/report`, { reason, description });
      toast.success('Report submitted. We will review within 48 hours.');
      onClose();
    } catch { toast.error('Failed to submit report'); }
    finally { setLoading(false); }
  };

  const handleBlock = async () => {
    setLoading(true);
    try {
      if (isBlocked) {
        await api.delete(`/users/${userId}/block`);
        toast.success(`${userName} unblocked`);
      } else {
        await api.post(`/users/${userId}/block`);
        toast.success(`${userName} blocked. Their listings won't appear in your searches.`);
      }
      onBlock?.(!isBlocked);
      onClose();
    } catch { toast.error('Failed to update block status'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg mx-auto bg-white rounded-t-3xl overflow-hidden animate-slide-up">

        {/* ── MENU ── */}
        {view === 'menu' && (
          <>
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-stone-100">
              <h3 className="font-bold text-stone-900">{userName}</h3>
              <button onClick={onClose} className="w-8 h-8 bg-stone-100 rounded-xl flex items-center justify-center active:scale-90">
                <X size={15} className="text-stone-500" />
              </button>
            </div>
            <div className="divide-y divide-stone-50">
              <button onClick={() => setView('report')}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-stone-50 active:bg-stone-100 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                  <Flag size={16} className="text-amber-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-stone-900">Report</p>
                  <p className="text-xs text-stone-400 mt-0.5">Report inappropriate behaviour</p>
                </div>
                <ChevronRight size={14} className="text-stone-300" />
              </button>

              <button onClick={() => isBlocked ? handleBlock() : setView('block_confirm')}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-stone-50 active:bg-stone-100 transition-colors"
                disabled={loading}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isBlocked ? 'bg-stone-100' : 'bg-red-50'}`}>
                  <UserX size={16} className={isBlocked ? 'text-stone-500' : 'text-red-500'} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${isBlocked ? 'text-stone-700' : 'text-red-600'}`}>
                    {isBlocked ? 'Unblock user' : 'Block user'}
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {isBlocked ? 'Allow this user to appear in searches again' : 'Hide their listings from your searches'}
                  </p>
                </div>
                <ChevronRight size={14} className="text-stone-300" />
              </button>
            </div>
            <div className="h-6" />
          </>
        )}

        {/* ── REPORT FORM ── */}
        {view === 'report' && (
          <div className="px-5 py-5 space-y-4">
            <div className="flex items-center gap-3 mb-1">
              <button onClick={() => setView('menu')} className="text-orange-500 text-sm font-semibold">← Back</button>
              <h3 className="font-bold text-stone-900 flex-1">Report {userName}</h3>
            </div>
            <p className="text-xs text-stone-500">Select the reason for your report. We review all reports within 48 hours.</p>

            <div className="space-y-1.5">
              {REPORT_REASONS.map(r => (
                <button key={r.value} onClick={() => setReason(r.value)}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                    reason === r.value
                      ? 'border-orange-400 bg-orange-50 text-orange-700'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                  }`}>
                  {r.label}
                </button>
              ))}
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 focus-within:border-orange-400 transition-all">
              <textarea
                className="w-full bg-transparent outline-none text-sm text-stone-700 resize-none placeholder:text-stone-400"
                placeholder="Additional details (optional)…"
                rows={3}
                maxLength={500}
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <button onClick={handleReport} disabled={!reason || loading}
              className="w-full py-3.5 rounded-2xl bg-amber-500 text-white font-bold text-sm disabled:opacity-50 active:scale-98 transition-all">
              {loading ? 'Submitting…' : 'Submit Report'}
            </button>
            <div className="h-2" />
          </div>
        )}

        {/* ── BLOCK CONFIRM ── */}
        {view === 'block_confirm' && (
          <div className="px-5 py-6 space-y-4 text-center">
            <div className="text-4xl mb-2">🚫</div>
            <h3 className="font-black text-stone-900">Block {userName}?</h3>
            <p className="text-stone-500 text-sm leading-relaxed">
              Their listings won't appear in your searches and they won't be able to message you.
              You can unblock them anytime from your profile.
            </p>
            <div className="space-y-2 pt-2">
              <button onClick={handleBlock} disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-red-500 text-white font-bold text-sm active:scale-98 transition-all disabled:opacity-50">
                {loading ? 'Blocking…' : `Block ${userName}`}
              </button>
              <button onClick={onClose}
                className="w-full py-3.5 rounded-2xl bg-stone-100 text-stone-700 font-semibold text-sm active:scale-95 transition-all">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
