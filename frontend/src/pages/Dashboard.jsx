import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAuthGate } from '../hooks/useAuthGate';
import api from '../lib/api';
import TripCard from '../components/TripCard';
import ParcelCard from '../components/ParcelCard';
import PostTripModal from '../components/PostTripModal';
import PostParcelModal from '../components/PostParcelModal';
import { TripCardSkeleton, ParcelCardSkeleton } from '../components/SkeletonCard';
import { Send, Package, ArrowRight, AlertTriangle, ChevronRight } from 'lucide-react';

// ── Animated counter — counts from 0 to target when element enters viewport ──
function CountUp({ value, decimals = 0 }) {
  const [display, setDisplay] = useState(0);
  const triggered = useRef(false);
  const ref = useRef(null);

  useEffect(() => {
    const target = parseFloat(value) || 0;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !triggered.current) {
        triggered.current = true;
        const steps = 28;
        const interval = 600 / steps;
        let step = 0;
        const t = setInterval(() => {
          step++;
          setDisplay(target * (step / steps));
          if (step >= steps) { setDisplay(target); clearInterval(t); }
        }, interval);
      }
    }, { threshold: 0.6 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [value]);

  return (
    <span ref={ref}>
      {decimals > 0 ? display.toFixed(decimals) : Math.round(display)}
    </span>
  );
}

// ── helpers ──────────────────────────────────────────────────────────────────
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
};

const calcPct = (user) => {
  const checks = [
    !!user?.name?.trim(),
    !!user?.phone && !user?.phone?.startsWith('google_'),
    !!user?.profileImage,
    !!user?.city?.trim(),
    !!user?.isPhoneVerified || user?.kycStatus === 'verified',
  ];
  return Math.round((checks.filter(Boolean).length / 5) * 100);
};

// ── main component ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const authGate  = useAuthGate();

  // public feeds (sliced for display, kept full for route matching)
  const [allTrips,     setAllTrips]     = useState([]);
  const [allParcels,   setAllParcels]   = useState([]);
  const [recentTrips,  setRecentTrips]  = useState([]);
  const [recentParcels,setRecentParcels]= useState([]);
  const [loadingTrips,  setLoadingTrips]  = useState(true);
  const [loadingParcels,setLoadingParcels]= useState(true);

  // user's own counts (for summary line)
  const [myTrips,   setMyTrips]   = useState([]);
  const [myParcels, setMyParcels] = useState([]);

  const [showTripModal,   setShowTripModal]   = useState(false);
  const [showParcelModal, setShowParcelModal] = useState(false);

  // load public feeds on mount
  useEffect(() => {
    api.get('/trips').then(r => {
      setAllTrips(r.data.trips);
      setRecentTrips(r.data.trips.slice(0, 3));
    }).finally(() => setLoadingTrips(false));

    api.get('/parcels').then(r => {
      setAllParcels(r.data.parcels);
      setRecentParcels(r.data.parcels.slice(0, 3));
    }).finally(() => setLoadingParcels(false));
  }, []);

  // load user's own trips/parcels when logged in
  useEffect(() => {
    if (!user?._id) return;
    api.get('/trips/my').then(r => setMyTrips(r.data.trips)).catch(() => {});
    api.get('/parcels/my').then(r => setMyParcels(r.data.parcels)).catch(() => {});
  }, [user?._id]);

  // ── derived values ──────────────────────────────────────────────────────
  const firstName         = user?.name?.split(' ')[0] || 'there';
  const activeTripsCount  = myTrips.filter(t => t.status === 'active').length;
  const pendingParcelsCount = myParcels.filter(p => ['open','requested'].includes(p.status)).length;
  const pct = calcPct(user);

  const routeFrom = user?.frequentRoute?.from?.toLowerCase();
  const pendingParcelsOnRoute = routeFrom
    ? allParcels.filter(p => p.fromCity?.toLowerCase() === routeFrom && ['open','requested'].includes(p.status)).length
    : 0;
  const activeTripsOnRoute = routeFrom
    ? allTrips.filter(t => t.fromCity?.toLowerCase() === routeFrom).length
    : 0;

  const summaryLine = user
    ? (activeTripsCount > 0 || pendingParcelsCount > 0
        ? `${activeTripsCount} active trip${activeTripsCount !== 1 ? 's' : ''} · ${pendingParcelsCount} pending parcel${pendingParcelsCount !== 1 ? 's' : ''}`
        : 'Ready to post your next trip?')
    : 'Browse trips and find travellers';

  return (
    <div className="px-4 py-5 space-y-4">

      {/* ── Gradient hero banner ── */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-400 rounded-2xl px-5 py-4 text-white">
        <p className="text-sm text-orange-100 font-medium">
          Good {getGreeting()} 👋
        </p>
        <h1 className="text-2xl font-bold tracking-tight mt-0.5">
          {user ? firstName : 'Welcome'}
        </h1>
        <p className="text-sm text-orange-100 mt-1">{summaryLine}</p>

        {/* Achievement chips — only when logged in */}
        {user && (
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="bg-white/15 text-white text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ animation: 'staggerIn 0.4s ease both', animationDelay: '0.1s' }}>
              ⭐ <CountUp value={user.rating || 5} decimals={1} /> Rating
            </span>
            <span className="bg-white/15 text-white text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ animation: 'staggerIn 0.4s ease both', animationDelay: '0.2s' }}>
              📦 <CountUp value={user.tripsCompleted || 0} /> Trips done
            </span>
            {user.kycStatus === 'verified' && (
              <span className="bg-white/15 text-white text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ animation: 'staggerIn 0.4s ease both', animationDelay: '0.3s' }}>
                ✓ Verified
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Profile completion bar (only when logged in + profile incomplete) ── */}
      {user && !user.isProfileComplete && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={15} className="text-amber-500 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-stone-800">Complete your profile to post trips</p>
              <p className="text-[11px] text-amber-600 mt-0.5">{pct}% done</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/complete-profile')}
            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-0.5 shrink-0 ml-3"
          >
            Finish <ChevronRight size={13} />
          </button>
        </div>
      )}

      {/* ── Quick actions ── */}
      <div className="grid grid-cols-2 gap-3">

        {/* Post a Trip */}
        <button
          onClick={() => authGate(() => setShowTripModal(true))}
          className="relative overflow-hidden rounded-2xl p-4 text-left active:scale-95 transition-all
                     bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200"
          style={{ minHeight: '110px' }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center shrink-0">
              <Send size={17} className="text-white" />
            </div>
            {pendingParcelsOnRoute > 0 && (
              <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full leading-tight">
                {pendingParcelsOnRoute} waiting
              </span>
            )}
          </div>
          <div className="font-semibold text-stone-900 text-sm">Post a Trip</div>
          <div className="text-xs text-stone-500 mt-0.5">Earn by carrying</div>
          {/* Decorative circles */}
          <svg className="absolute bottom-0 right-0 w-16 h-16 opacity-[0.08] text-orange-500 pointer-events-none"
               viewBox="0 0 64 64" fill="currentColor">
            <circle cx="52" cy="52" r="32"/>
            <circle cx="30" cy="42" r="22"/>
            <circle cx="10" cy="30" r="14"/>
          </svg>
        </button>

        {/* Send Parcel */}
        <button
          onClick={() => authGate(() => setShowParcelModal(true))}
          className="relative overflow-hidden rounded-2xl p-4 text-left active:scale-95 transition-all
                     bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200"
          style={{ minHeight: '110px' }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center shrink-0">
              <Package size={17} className="text-white" />
            </div>
            {activeTripsOnRoute > 0 && (
              <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full leading-tight">
                {activeTripsOnRoute} travellers
              </span>
            )}
          </div>
          <div className="font-semibold text-stone-900 text-sm">Send Parcel</div>
          <div className="text-xs text-stone-500 mt-0.5">Find a traveller</div>
          <svg className="absolute bottom-0 right-0 w-16 h-16 opacity-[0.08] text-blue-500 pointer-events-none"
               viewBox="0 0 64 64" fill="currentColor">
            <circle cx="52" cy="52" r="32"/>
            <circle cx="30" cy="42" r="22"/>
            <circle cx="10" cy="30" r="14"/>
          </svg>
        </button>
      </div>

      {/* ── Recent Travellers ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-stone-900">Recent Travellers</h2>
          <button onClick={() => navigate('/trips')} className="text-orange-500 text-xs font-semibold flex items-center gap-1">
            See all <ArrowRight size={12} />
          </button>
        </div>
        {loadingTrips ? (
          <div className="space-y-2">
            {[0,1,2].map(i => <TripCardSkeleton key={i} delay={i * 80} />)}
          </div>
        ) : recentTrips.length === 0 ? (
          <Empty text="No trips posted yet" />
        ) : (
          <div className="space-y-2">
            {recentTrips.map((t, i) => (
              <div key={t._id} style={{ animation: 'staggerIn 0.35s ease both', animationDelay: `${i * 60}ms` }}>
                <TripCard trip={t} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Open Parcel Requests ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-stone-900">Open Requests</h2>
          <button onClick={() => navigate('/parcels')} className="text-orange-500 text-xs font-semibold flex items-center gap-1">
            See all <ArrowRight size={12} />
          </button>
        </div>
        {loadingParcels ? (
          <div className="space-y-2">
            {[0,1,2].map(i => <ParcelCardSkeleton key={i} delay={i * 80} />)}
          </div>
        ) : recentParcels.length === 0 ? (
          <Empty text="No parcel requests yet" />
        ) : (
          <div className="space-y-2">
            {recentParcels.map((p, i) => (
              <div key={p._id} style={{ animation: 'staggerIn 0.35s ease both', animationDelay: `${i * 60}ms` }}>
                <ParcelCard parcel={p} />
              </div>
            ))}
          </div>
        )}
      </section>

      {showTripModal && (
        <PostTripModal
          onClose={() => setShowTripModal(false)}
          onSuccess={trip => {
            setRecentTrips(prev => [trip, ...prev].slice(0, 3));
            setAllTrips(prev => [trip, ...prev]);
            setShowTripModal(false);
          }}
        />
      )}
      {showParcelModal && (
        <PostParcelModal
          onClose={() => setShowParcelModal(false)}
          onSuccess={parcel => {
            setRecentParcels(prev => [parcel, ...prev].slice(0, 3));
            setAllParcels(prev => [parcel, ...prev]);
            setShowParcelModal(false);
          }}
        />
      )}
    </div>
  );
}

function Empty({ text }) {
  return <div className="card p-6 text-center text-stone-400 text-sm">{text}</div>;
}
