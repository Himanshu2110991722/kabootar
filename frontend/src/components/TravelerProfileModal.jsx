import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { X, Star, MessageCircle, Package, CheckCircle, Shield, Clock } from 'lucide-react';
import { format } from 'date-fns';

const KYC_BADGE = {
  verified: { label: 'KYC Verified', cls: 'bg-emerald-50 text-emerald-600', icon: <CheckCircle size={11} /> },
  pending:  { label: 'Under Review', cls: 'bg-amber-50 text-amber-600',    icon: <Clock size={11} /> },
  none:     { label: 'Unverified',   cls: 'bg-stone-100 text-stone-500',   icon: <Shield size={11} /> },
  rejected: { label: 'Unverified',   cls: 'bg-stone-100 text-stone-500',   icon: <Shield size={11} /> },
};

export default function TravelerProfileModal({ travelerId, travelerSnap, onClose, onChat }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/users/${travelerId}`)
      .then(r => setProfile(r.data.user))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [travelerId]);

  const data = profile || travelerSnap;
  const badge = KYC_BADGE[data?.kycStatus || 'none'];
  const initials = data?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  const handleChat = () => {
    onClose();
    if (onChat) onChat();
    else navigate(`/chat/${travelerId}`);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100">
          <h2 className="font-bold text-stone-900">Traveler Profile</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 -mr-1.5"><X size={18} /></button>
        </div>

        <div className="px-5 py-5 space-y-5">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-4 animate-pulse">
              <div className="w-20 h-20 rounded-full bg-stone-100" />
              <div className="h-4 bg-stone-100 rounded w-32" />
              <div className="h-3 bg-stone-100 rounded w-24" />
            </div>
          ) : (
            <>
              {/* Avatar + name */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-orange-50 border-2 border-orange-100 flex items-center justify-center text-2xl font-bold text-orange-500">
                  {data?.profileImage
                    ? <img src={data.profileImage} alt={data.name} className="w-full h-full object-cover" />
                    : initials}
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-stone-900 text-lg">{data?.name}</h3>
                  {data?.createdAt && (
                    <p className="text-xs text-stone-400">
                      Member since {format(new Date(data.createdAt), 'MMM yyyy')}
                    </p>
                  )}
                </div>

                {/* KYC badge */}
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badge.cls}`}>
                  {badge.icon}
                  {badge.label}
                </span>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                <StatBox
                  icon={<Star size={16} className="text-amber-400 fill-amber-400" />}
                  value={data?.rating?.toFixed(1) || '5.0'}
                  label="Rating"
                />
                <StatBox
                  icon={<span className="text-base">💬</span>}
                  value={data?.totalRatings || 0}
                  label="Reviews"
                />
                <StatBox
                  icon={<Package size={16} className="text-emerald-500" />}
                  value={profile?.deliveredCount ?? data?.tripsCompleted ?? 0}
                  label="Delivered"
                />
              </div>

              {/* Star visual */}
              <div className="flex items-center justify-center gap-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star
                    key={s}
                    size={18}
                    className={s <= Math.round(data?.rating || 5) ? 'text-amber-400 fill-amber-400' : 'text-stone-200 fill-stone-200'}
                  />
                ))}
                <span className="text-sm text-stone-500 ml-1">
                  {data?.rating?.toFixed(1)} · {data?.totalRatings || 0} review{data?.totalRatings !== 1 ? 's' : ''}
                </span>
              </div>
            </>
          )}

          {/* Chat button */}
          <button
            onClick={handleChat}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <MessageCircle size={16} />
            Chat with {data?.name?.split(' ')[0] || 'Traveler'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatBox({ icon, value, label }) {
  return (
    <div className="card p-3 text-center">
      <div className="flex items-center justify-center gap-1 mb-0.5">
        {icon}
        <span className="font-bold text-stone-900 text-base">{value}</span>
      </div>
      <div className="text-[11px] text-stone-400">{label}</div>
    </div>
  );
}
