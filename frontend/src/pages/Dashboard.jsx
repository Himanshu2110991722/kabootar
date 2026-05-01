import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAuthGate } from '../hooks/useAuthGate';
import api from '../lib/api';
import TripCard from '../components/TripCard';
import ParcelCard from '../components/ParcelCard';
import PostTripModal from '../components/PostTripModal';
import PostParcelModal from '../components/PostParcelModal';
import { Send, Package, ArrowRight, Star, X, Camera, Phone, FileText, ChevronRight } from 'lucide-react';

const SESSION_KEY = 'kabutar_nudge_dismissed';

function getMissingItems(user) {
  const items = [];
  if (!user?.profileImage)
    items.push({ icon: '📸', text: 'Profile photo', benefit: 'Get 3× more responses' });
  if (!user?.phone || user?.phone?.startsWith('google_'))
    items.push({ icon: '📱', text: 'Phone number', benefit: 'Unlock full trust score' });
  if (!user?.bio?.trim())
    items.push({ icon: '✍️', text: 'Short bio', benefit: 'Stand out from other travelers' });
  return items;
}

function ProfileNudge({ user, onDismiss }) {
  const navigate = useNavigate();
  const missing = getMissingItems(user);
  if (!missing.length) return null;

  const checks = [
    !!user?.name?.trim(),
    !!user?.phone && !user?.phone?.startsWith('google_'),
    !!user?.isPhoneVerified,
    !!user?.profileImage,
    !!user?.bio?.trim(),
  ];
  const pct = Math.round((checks.filter(Boolean).length / 5) * 100);

  return (
    <div className="rounded-2xl overflow-hidden border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 animate-slide-up">
      {/* Top bar */}
      <div className="flex items-start justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">🚀</span>
          <div>
            <p className="font-bold text-stone-900 text-sm">Boost your visibility!</p>
            <p className="text-xs text-stone-500">Complete profile — {pct}% done</p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-stone-400 hover:text-stone-600 transition-colors -mt-0.5 -mr-0.5 p-1"
          aria-label="Dismiss"
        >
          <X size={15} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-3">
        <div className="h-1.5 bg-orange-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-orange-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Missing items */}
      <div className="px-4 pb-3 space-y-1.5">
        {missing.slice(0, 2).map(item => (
          <div key={item.text} className="flex items-center gap-2">
            <span className="text-sm">{item.icon}</span>
            <span className="text-xs text-stone-700 font-medium flex-1">{item.text}</span>
            <span className="text-[11px] text-orange-500 font-semibold">{item.benefit}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={() => { onDismiss(); navigate('/profile'); }}
        className="w-full flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-3 transition-colors"
      >
        Complete Profile <ChevronRight size={13} />
      </button>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const authGate = useAuthGate();
  const [recentTrips, setRecentTrips] = useState([]);
  const [recentParcels, setRecentParcels] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [loadingParcels, setLoadingParcels] = useState(true);
  const [showTripModal, setShowTripModal] = useState(false);
  const [showParcelModal, setShowParcelModal] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(
    () => !!sessionStorage.getItem(SESSION_KEY)
  );

  useEffect(() => {
    api.get('/trips').then(r => setRecentTrips(r.data.trips.slice(0, 3))).finally(() => setLoadingTrips(false));
    api.get('/parcels').then(r => setRecentParcels(r.data.parcels.slice(0, 3))).finally(() => setLoadingParcels(false));
  }, []);

  const dismissNudge = () => {
    sessionStorage.setItem(SESSION_KEY, '1');
    setNudgeDismissed(true);
  };

  const firstName = user?.name?.split(' ')[0] || 'there';
  const showNudge = !!user && !nudgeDismissed && getMissingItems(user).length > 0;

  return (
    <div className="px-4 py-5 space-y-5">
      {/* Greeting */}
      <div>
        <p className="text-stone-500 text-sm">Good day 👋</p>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Hey, {firstName}</h1>
      </div>

      {/* Profile nudge — shown once per session when profile is incomplete */}
      {showNudge && (
        <ProfileNudge user={user} onDismiss={dismissNudge} />
      )}

      {/* Stats row — only when logged in */}
      {user && (
        <div className="flex gap-2">
          <div className="card flex-1 p-3 text-center">
            <div className="text-lg font-bold text-orange-500">{user?.rating?.toFixed(1) || '5.0'}</div>
            <div className="text-[11px] text-stone-500 flex items-center justify-center gap-0.5 mt-0.5">
              <Star size={10} className="text-amber-400 fill-amber-400" /> Rating
            </div>
          </div>
          <div className="card flex-1 p-3 text-center">
            <div className="text-lg font-bold text-stone-800">{user?.totalRatings || 0}</div>
            <div className="text-[11px] text-stone-500 mt-0.5">Reviews</div>
          </div>
          <div className="card flex-1 p-3 text-center">
            <div className="text-lg font-bold text-emerald-500">
              {user?.kycStatus === 'verified' ? '✓' : '–'}
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5">Verified</div>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => authGate(() => setShowTripModal(true))}
          className="card p-4 text-left hover:border-orange-200 hover:shadow-orange-100 transition-all active:scale-95"
        >
          <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center mb-3">
            <Send size={18} className="text-orange-500" />
          </div>
          <div className="font-semibold text-stone-900 text-sm">Post a Trip</div>
          <div className="text-xs text-stone-400 mt-0.5">Earn by carrying</div>
        </button>
        <button
          onClick={() => authGate(() => setShowParcelModal(true))}
          className="card p-4 text-left hover:border-blue-200 hover:shadow-blue-100 transition-all active:scale-95"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
            <Package size={18} className="text-blue-500" />
          </div>
          <div className="font-semibold text-stone-900 text-sm">Send Parcel</div>
          <div className="text-xs text-stone-400 mt-0.5">Find a traveler</div>
        </button>
      </div>

      {/* Recent Trips */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-stone-900">Recent Trips</h2>
          <button onClick={() => navigate('/trips')} className="text-orange-500 text-xs font-semibold flex items-center gap-1">
            See all <ArrowRight size={12} />
          </button>
        </div>
        {loadingTrips ? (
          <SkeletonCards />
        ) : recentTrips.length === 0 ? (
          <Empty text="No trips posted yet" />
        ) : (
          <div className="space-y-3">
            {recentTrips.map(t => <TripCard key={t._id} trip={t} />)}
          </div>
        )}
      </section>

      {/* Recent Parcels */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-stone-900">Open Requests</h2>
          <button onClick={() => navigate('/parcels')} className="text-orange-500 text-xs font-semibold flex items-center gap-1">
            See all <ArrowRight size={12} />
          </button>
        </div>
        {loadingParcels ? (
          <SkeletonCards />
        ) : recentParcels.length === 0 ? (
          <Empty text="No parcel requests yet" />
        ) : (
          <div className="space-y-3">
            {recentParcels.map(p => <ParcelCard key={p._id} parcel={p} />)}
          </div>
        )}
      </section>

      {showTripModal && (
        <PostTripModal
          onClose={() => setShowTripModal(false)}
          onSuccess={trip => {
            setRecentTrips(prev => [trip, ...prev].slice(0, 3));
            setShowTripModal(false);
          }}
        />
      )}
      {showParcelModal && (
        <PostParcelModal
          onClose={() => setShowParcelModal(false)}
          onSuccess={parcel => {
            setRecentParcels(prev => [parcel, ...prev].slice(0, 3));
            setShowParcelModal(false);
          }}
        />
      )}
    </div>
  );
}

function SkeletonCards() {
  return (
    <div className="space-y-3">
      {[1, 2].map(i => (
        <div key={i} className="card p-4 animate-pulse">
          <div className="h-4 bg-stone-100 rounded w-2/3 mb-2" />
          <div className="h-3 bg-stone-100 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

function Empty({ text }) {
  return (
    <div className="card p-6 text-center text-stone-400 text-sm">{text}</div>
  );
}
