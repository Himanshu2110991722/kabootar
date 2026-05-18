import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAuthGate } from '../hooks/useAuthGate';
import api from '../lib/api';
import PostTripModal from '../components/PostTripModal';
import PostParcelModal from '../components/PostParcelModal';
import TripCard from '../components/TripCard';
import ParcelCard from '../components/ParcelCard';
import { POPULAR_CITIES } from '../lib/cityCoords';
import {
  Search, Calendar, X, ArrowLeftRight, MapPin,
  ChevronRight, Package, Send,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const today = new Date().toISOString().split('T')[0];

const getGreeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

// Pastel card schemes for trending routes (matches reference image)
const PASTEL = [
  { bg: 'bg-orange-50',  border: 'border-orange-100',  text: 'text-orange-600',  graph: '#f97316' },
  { bg: 'bg-purple-50',  border: 'border-purple-100',  text: 'text-purple-600',  graph: '#9333ea' },
  { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600', graph: '#10b981' },
  { bg: 'bg-blue-50',    border: 'border-blue-100',    text: 'text-blue-600',    graph: '#3b82f6' },
  { bg: 'bg-amber-50',   border: 'border-amber-100',   text: 'text-amber-600',   graph: '#f59e0b' },
];

function Sparkline({ count = 20, color = '#f97316' }) {
  const base = Math.max(5, count);
  const vals = Array.from({ length: 7 }, (_, i) =>
    Math.max(2, base * (0.35 + 0.09 * i) + Math.sin(i * 1.2) * base * 0.18)
  );
  const w = 80, h = 28;
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = max - min || 1;
  const pts = vals.map((v, i) => [
    (i / (vals.length - 1)) * w,
    h - ((v - min) / range) * (h - 5) - 2,
  ]);
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" className="mt-1">
      <path d={d} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Simplified India map with city dots
function IndiaHeatmap() {
  const dots = [
    { x: 42, y: 18, r: 7, name: 'Delhi' },
    { x: 26, y: 52, r: 6, name: 'Mumbai' },
    { x: 58, y: 26, r: 5, name: 'Patna' },
    { x: 70, y: 38, r: 6, name: 'Kolkata' },
    { x: 40, y: 72, r: 5, name: 'Bengaluru' },
    { x: 50, y: 22, r: 5, name: 'Lucknow' },
    { x: 63, y: 36, r: 4, name: 'Ranchi' },
    { x: 46, y: 60, r: 5, name: 'Hyderabad' },
    { x: 50, y: 76, r: 4, name: 'Chennai' },
    { x: 30, y: 55, r: 4, name: 'Pune' },
  ];
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full opacity-90">
      <path
        d="M28 8 Q52 5 70 16 Q88 26 82 44 Q90 56 84 66 Q76 80 62 86 Q52 92 42 88 Q28 82 20 67 Q10 52 13 34 Q16 18 28 8Z"
        fill="rgba(249,115,22,0.07)" stroke="rgba(249,115,22,0.18)" strokeWidth="0.6"
      />
      {dots.map(d => (
        <g key={d.name}>
          <circle cx={d.x} cy={d.y} r={d.r + 3} fill="rgba(249,115,22,0.1)" />
          <circle cx={d.x} cy={d.y} r={d.r} fill="rgba(249,115,22,0.45)" />
          <circle cx={d.x} cy={d.y} r={d.r * 0.45} fill="rgba(249,115,22,0.9)" />
        </g>
      ))}
      {/* Route lines between top pairs */}
      <line x1="42" y1="18" x2="58" y2="26" stroke="rgba(249,115,22,0.3)" strokeWidth="0.7" strokeDasharray="2 1.5"/>
      <line x1="58" y1="26" x2="70" y2="38" stroke="rgba(249,115,22,0.3)" strokeWidth="0.7" strokeDasharray="2 1.5"/>
    </svg>
  );
}

// ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const authGate = useAuthGate();

  // Tabs: 'trip' | 'parcel' | 'bookings'
  const [tab, setTab] = useState('trip');

  // Search state
  const [heroSearch, setHeroSearch] = useState({ from: '', to: '', date: '' });
  const [fromSuggs, setFromSuggs] = useState([]);
  const [toSuggs, setToSuggs]     = useState([]);
  const [showFrom, setShowFrom]   = useState(false);
  const [showTo, setShowTo]       = useState(false);
  const fromRef = useRef(null);
  const toRef   = useRef(null);

  // Feed data
  const [trending, setTrending]             = useState([]);
  const [stats, setStats]                   = useState({});
  const [posts, setPosts]                   = useState([]);
  const [activePoll, setActivePoll]         = useState(null);
  const [railwayUpdates, setRailwayUpdates] = useState([]);
  const [myTrips, setMyTrips]               = useState([]);
  const [myParcels, setMyParcels]           = useState([]);
  const [pollVoting, setPollVoting]         = useState(false);

  // Modals
  const [showTripModal,   setShowTripModal]   = useState(false);
  const [showParcelModal, setShowParcelModal] = useState(false);

  const firstName = user?.name?.split(' ')[0] || 'there';

  useEffect(() => {
    Promise.all([
      api.get('/trips/trending').catch(() => ({ data: { routes: [] } })),
      api.get('/trips/stats').catch(() => ({ data: {} })),
      api.get('/posts').catch(() => ({ data: { posts: [] } })),
      api.get('/polls/active').catch(() => ({ data: { poll: null } })),
      api.get('/railway-updates').catch(() => ({ data: { updates: [] } })),
    ]).then(([tr, st, po, pl, ru]) => {
      setTrending(tr.data.routes || []);
      setStats(st.data || {});
      setPosts(po.data.posts || []);
      setActivePoll(pl.data.poll || null);
      setRailwayUpdates(ru.data.updates || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user?._id) return;
    api.get('/trips/my').then(r => setMyTrips(r.data.trips || [])).catch(() => {});
    api.get('/parcels/my').then(r => setMyParcels(r.data.parcels || [])).catch(() => {});
  }, [user?._id]);

  // City suggestions
  const filterCities = val =>
    val.trim().length === 0
      ? POPULAR_CITIES.slice(0, 6)
      : POPULAR_CITIES.filter(c => c.toLowerCase().includes(val.toLowerCase())).slice(0, 6);

  const onFromChange = val => { setHeroSearch(s => ({ ...s, from: val })); setFromSuggs(filterCities(val)); setShowFrom(true); };
  const onToChange   = val => { setHeroSearch(s => ({ ...s, to: val })); setToSuggs(filterCities(val)); setShowTo(true); };
  const pickFrom = city => { setHeroSearch(s => ({ ...s, from: city })); setShowFrom(false); toRef.current?.focus(); };
  const pickTo   = city => { setHeroSearch(s => ({ ...s, to: city })); setShowTo(false); };
  const hideFrom = () => setTimeout(() => setShowFrom(false), 150);
  const hideTo   = () => setTimeout(() => setShowTo(false), 150);
  const swapCities = () => setHeroSearch(s => ({ ...s, from: s.to, to: s.from }));

  const handleSearch = () => {
    if (!heroSearch.from && !heroSearch.to) {
      import('react-hot-toast').then(({ default: toast }) => toast.error('Enter From or To city'));
      return;
    }
    navigate(tab === 'trip' ? '/trips' : '/parcels', {
      state: { from: heroSearch.from, to: heroSearch.to, date: heroSearch.date },
    });
  };

  const handleVote = async (pollId, optionIndex) => {
    if (!user) { authGate(() => {}); return; }
    setPollVoting(true);
    try {
      const r = await api.post(`/polls/${pollId}/vote`, { optionIndex });
      setActivePoll(r.data.poll);
    } catch (e) {
      import('react-hot-toast').then(({ default: toast }) =>
        toast.error(e.response?.data?.message || 'Could not record vote'));
    } finally { setPollVoting(false); }
  };

  const hasVoted = !!(activePoll && user &&
    activePoll.options.some(o => (o.votes || []).map(String).includes(String(user._id))));

  const activeTripsCount    = myTrips.filter(t => t.status === 'active').length;
  const pendingParcelsCount = myParcels.filter(p => ['open', 'requested'].includes(p.status)).length;

  // Fallback dummy trending when DB is empty (makes app feel alive on first run)
  const DUMMY_TRENDING = [
    { from: 'Patna',     to: 'Delhi',   count: 128 },
    { from: 'Delhi',     to: 'Lucknow', count: 96  },
    { from: 'Mumbai',    to: 'Pune',    count: 84  },
    { from: 'Bangalore', to: 'Hyd',     count: 72  },
  ];
  const trendingList = trending.length > 0 ? trending : DUMMY_TRENDING;

  const DUMMY_ROUTES_TODAY = [
    { from: 'Patna',   to: 'Delhi',   count: 82 },
    { from: 'Ranchi',  to: 'Kolkata', count: 56 },
    { from: 'Lucknow', to: 'Delhi',   count: 48 },
  ];
  const routesToday = trending.length > 0
    ? trending.slice(0, 3)
    : DUMMY_ROUTES_TODAY;

  const travelersToday = stats.activeTrips != null
    ? stats.activeTrips
    : (trendingList.reduce((s, r) => s + r.count, 0) || 512);

  return (
    <div className="pb-8">

      {/* ── TOP SEARCH TABS ── */}
      <div className="px-4 pt-3 pb-2.5 bg-white border-b border-stone-100 sticky top-[57px] z-30 lg:top-16"
        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div className="flex bg-stone-100 rounded-xl p-0.5 gap-0.5 max-w-lg mx-auto">
          {[
            { key: 'trip',     icon: '✈️', label: 'Search Trip'   },
            { key: 'parcel',   icon: '📦', label: 'Search Parcel' },
            { key: 'bookings', icon: '📋', label: 'My Bookings'   },
          ].map(({ key, icon, label }) => (
            <button key={key}
              onClick={() => key === 'bookings' ? authGate(() => setTab('bookings')) : setTab(key)}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-[10px] text-[11px] font-bold transition-all ${
                tab === key ? 'bg-white text-orange-500 shadow-sm' : 'text-stone-400 hover:text-stone-600'
              }`}>
              <span>{icon}</span>
              <span className="hidden xs:inline sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── DESKTOP GRID WRAPPER ── */}
      <div className="lg:grid lg:grid-cols-[1fr,360px] lg:gap-6 lg:px-8 lg:pt-6 lg:items-start">
      <div className="lg:space-y-5">

      {/* ── HERO BANNER (only when not in bookings) ── */}
      {tab !== 'bookings' && (
        <div className="relative overflow-visible"
          style={{ background: 'linear-gradient(148deg, #f97316 0%, #ea580c 50%, #c2410c 100%)' }}>
          {/* Banner content */}
          <div className="px-5 pt-5 pb-2 flex items-start gap-2">
            <div className="flex-1">
              <p className="text-orange-100 text-[11px] font-semibold">
                {getGreeting()}, {firstName} 👋
                {user && (activeTripsCount > 0 || pendingParcelsCount > 0) && (
                  <span className="opacity-75 ml-1">
                    · {activeTripsCount > 0 ? `${activeTripsCount} trip${activeTripsCount !== 1 ? 's' : ''}` : ''}
                    {pendingParcelsCount > 0 ? ` · ${pendingParcelsCount} parcel${pendingParcelsCount !== 1 ? 's' : ''}` : ''}
                  </span>
                )}
              </p>
              <h1 className="text-white text-[20px] lg:text-3xl font-black leading-tight mt-1">
                Turn every trip<br />into earnings
              </h1>
            </div>
            {/* Compact train SVG */}
            <div className="shrink-0 w-28 h-20 lg:w-40 lg:h-28">
              <svg viewBox="0 0 120 90" fill="none" className="w-full h-full">
                <line x1="5" y1="74" x2="115" y2="74" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
                <line x1="5" y1="79" x2="115" y2="79" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
                {[15,30,45,60,75,90,105].map(x => (
                  <line key={x} x1={x} y1="71" x2={x} y2="82" stroke="rgba(255,255,255,0.15)" strokeWidth="2"/>
                ))}
                <rect x="10" y="38" width="90" height="32" rx="5" fill="white" opacity="0.92"/>
                <rect x="14" y="27" width="58" height="17" rx="4" fill="white" opacity="0.82"/>
                {[18,32,46].map(x => (
                  <rect key={x} x={x} y="31" width="10" height="8" rx="2" fill="rgba(253,186,116,0.55)"/>
                ))}
                {[20,35,50,65].map(x => (
                  <rect key={x} x={x} y="46" width="10" height="8" rx="1.5" fill="rgba(253,186,116,0.38)"/>
                ))}
                <rect x="10" y="58" width="90" height="4" rx="2" fill="rgba(249,115,22,0.35)"/>
                <circle cx="97" cy="48" r="4" fill="rgba(253,230,138,0.9)"/>
                {[28,80].map(cx => (
                  <g key={cx}>
                    <circle cx={cx} cy="74" r="7" fill="rgba(255,255,255,0.7)" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5"/>
                    <circle cx={cx} cy="74" r="3" fill="rgba(249,115,22,0.5)"/>
                  </g>
                ))}
                <circle cx="12"  cy="20" r="3" fill="white" opacity="0.7"/>
                <circle cx="108" cy="15" r="3" fill="white" opacity="0.7"/>
                <line x1="12" y1="20" x2="108" y2="15" stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeDasharray="3 2"/>
              </svg>
            </div>
          </div>

          {/* Search card — visually overlaps hero bottom */}
          <div className="mx-3 relative z-10" style={{ marginBottom: -2 }}>
            <div className="bg-white rounded-2xl shadow-lg p-3 space-y-2">
              {/* From ↔ To */}
              <div className="grid gap-1.5" style={{ gridTemplateColumns: '1fr auto 1fr' }}>
                {/* From */}
                <div className="relative min-w-0">
                  <div className={`flex items-center gap-2 bg-stone-50 border rounded-xl px-3 py-2.5 transition-all ${showFrom ? 'border-orange-400 ring-2 ring-orange-100' : 'border-stone-200'}`}>
                    <div className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                    <input ref={fromRef}
                      className="min-w-0 w-full text-sm font-semibold text-stone-800 bg-transparent outline-none placeholder:text-stone-400 placeholder:font-normal"
                      placeholder="From" value={heroSearch.from}
                      onChange={e => onFromChange(e.target.value)}
                      onFocus={() => { setFromSuggs(filterCities(heroSearch.from)); setShowFrom(true); }}
                      onBlur={hideFrom}
                      onKeyDown={e => e.key === 'Enter' && handleSearch()}
                      autoComplete="off" />
                    {heroSearch.from && (
                      <button onMouseDown={e => e.preventDefault()}
                        onClick={() => { setHeroSearch(s => ({ ...s, from: '' })); setShowFrom(false); }}
                        className="text-stone-300 hover:text-stone-500 shrink-0"><X size={11} /></button>
                    )}
                  </div>
                  {showFrom && fromSuggs.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-2xl overflow-hidden"
                      style={{ zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.14)' }}>
                      {fromSuggs.map(city => (
                        <button key={city} onMouseDown={e => e.preventDefault()} onClick={() => pickFrom(city)}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-orange-50 border-b border-stone-50 last:border-0">
                          <MapPin size={12} className="text-orange-400 shrink-0" />
                          <span className="text-sm text-stone-700 font-medium">{city}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Swap */}
                <button onClick={swapCities}
                  className="w-8 h-8 mt-0.5 bg-stone-100 hover:bg-stone-200 rounded-xl flex items-center justify-center active:scale-90 transition-all shrink-0">
                  <ArrowLeftRight size={13} className="text-stone-500" />
                </button>
                {/* To */}
                <div className="relative min-w-0">
                  <div className={`flex items-center gap-2 bg-stone-50 border rounded-xl px-3 py-2.5 transition-all ${showTo ? 'border-orange-400 ring-2 ring-orange-100' : 'border-stone-200'}`}>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <input ref={toRef}
                      className="min-w-0 w-full text-sm font-semibold text-stone-800 bg-transparent outline-none placeholder:text-stone-400 placeholder:font-normal"
                      placeholder="To" value={heroSearch.to}
                      onChange={e => onToChange(e.target.value)}
                      onFocus={() => { setToSuggs(filterCities(heroSearch.to)); setShowTo(true); }}
                      onBlur={hideTo}
                      onKeyDown={e => e.key === 'Enter' && handleSearch()}
                      autoComplete="off" />
                    {heroSearch.to && (
                      <button onMouseDown={e => e.preventDefault()}
                        onClick={() => { setHeroSearch(s => ({ ...s, to: '' })); setShowTo(false); }}
                        className="text-stone-300 hover:text-stone-500 shrink-0"><X size={11} /></button>
                    )}
                  </div>
                  {showTo && toSuggs.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-2xl overflow-hidden"
                      style={{ zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.14)' }}>
                      {toSuggs.map(city => (
                        <button key={city} onMouseDown={e => e.preventDefault()} onClick={() => pickTo(city)}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-orange-50 border-b border-stone-50 last:border-0">
                          <MapPin size={12} className="text-emerald-400 shrink-0" />
                          <span className="text-sm text-stone-700 font-medium">{city}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Date (trips only) */}
              {tab === 'trip' && (
                <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
                  <Calendar size={13} className="text-stone-400 shrink-0" />
                  <input type="date" min={today}
                    className="flex-1 text-sm text-stone-600 bg-transparent outline-none font-medium"
                    value={heroSearch.date}
                    onChange={e => setHeroSearch(s => ({ ...s, date: e.target.value }))} />
                </div>
              )}

              {/* Search CTA */}
              <button onClick={handleSearch}
                className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
                style={{ boxShadow: '0 4px 14px rgba(249,115,22,0.35)' }}>
                <Search size={15} />
                {tab === 'trip' ? 'Find Travellers' : 'Find Parcels on this Route'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MY BOOKINGS TAB CONTENT ── */}
      {tab === 'bookings' && (
        <div className="px-4 pt-4 space-y-4" style={{ animation: 'staggerIn 0.3s ease both' }}>
          {!user ? (
            <div className="card p-8 text-center">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-stone-700 font-semibold text-sm mb-3">Login to view your bookings</p>
              <button onClick={() => navigate('/login')} className="btn-primary px-6 py-2.5 text-sm">Login</button>
            </div>
          ) : (
            <>
              {/* Active Trips */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                    ✈️ Active Trips
                    <span className="text-[10px] font-semibold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-full">{activeTripsCount}</span>
                  </h3>
                  <button onClick={() => navigate('/profile')} className="text-xs text-orange-500 font-semibold">View All →</button>
                </div>
                {activeTripsCount === 0 ? (
                  <div className="card p-5 text-center">
                    <p className="text-stone-400 text-xs mb-1.5">No active trips yet</p>
                    <button onClick={() => authGate(() => {
                        if (user?.kycStatus !== 'verified') { navigate('/kyc'); return; }
                        setShowTripModal(true);
                      })} className="text-orange-500 text-xs font-bold">Post a Trip →</button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {myTrips.filter(t => t.status === 'active').slice(0, 2).map(trip => (
                      <TripCard key={trip._id} trip={trip} showDelete={false} isPast={false} />
                    ))}
                  </div>
                )}
              </div>

              {/* My Parcels */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                    📦 My Parcels
                    <span className="text-[10px] font-semibold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-full">{pendingParcelsCount}</span>
                  </h3>
                  <button onClick={() => navigate('/profile')} className="text-xs text-blue-500 font-semibold">View All →</button>
                </div>
                {pendingParcelsCount === 0 ? (
                  <div className="card p-5 text-center">
                    <p className="text-stone-400 text-xs mb-1.5">No pending parcels</p>
                    <button onClick={() => authGate(() => setShowParcelModal(true))}
                      className="text-blue-500 text-xs font-bold">Send a Parcel →</button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {myParcels.filter(p => ['open','requested'].includes(p.status)).slice(0, 2).map(parcel => (
                      <ParcelCard key={parcel._id} parcel={parcel} showDelete={false} />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── MAIN FEED (trip/parcel tabs) ── */}
      {tab !== 'bookings' && (
        <div className="px-4 pt-4 space-y-5">

          {/* Quick action cards */}
          <div className="grid grid-cols-2 gap-3" style={{ animation: 'staggerIn 0.35s ease 0.08s both' }}>
            <button
              onClick={() => authGate(() => {
                if (user?.kycStatus !== 'verified') {
                  import('react-hot-toast').then(({ default: t }) => t.error('KYC verification required'));
                  setTimeout(() => navigate('/kyc'), 600);
                  return;
                }
                setShowTripModal(true);
              })}
              className="relative overflow-hidden rounded-2xl text-left transition-all active:scale-[0.96]"
              style={{ background: 'linear-gradient(145deg,#f97316,#ea580c)', boxShadow: '0 6px 18px rgba(249,115,22,0.38)' }}>
              <div className="p-3.5">
                <div className="w-9 h-9 rounded-xl bg-white/25 flex items-center justify-center mb-2">
                  <span className="text-lg">✈️</span>
                </div>
                <p className="text-sm font-black text-white">I'm Travelling</p>
                <p className="text-[11px] text-orange-100 mt-0.5">Post trip &amp; earn</p>
              </div>
              <div className="bg-black/20 px-3.5 py-2 flex items-center justify-between">
                <span className="text-[10px] font-bold text-white">Tap to post trip</span>
                <span className="text-white text-xs">＋</span>
              </div>
            </button>

            <button
              onClick={() => authGate(() => setShowParcelModal(true))}
              className="relative overflow-hidden rounded-2xl text-left transition-all active:scale-[0.96]"
              style={{ background: 'linear-gradient(145deg,#3b82f6,#2563eb)', boxShadow: '0 6px 18px rgba(59,130,246,0.38)' }}>
              <div className="p-3.5">
                <div className="w-9 h-9 rounded-xl bg-white/25 flex items-center justify-center mb-2">
                  <span className="text-lg">📦</span>
                </div>
                <p className="text-sm font-black text-white">Send a Parcel</p>
                <p className="text-[11px] text-blue-100 mt-0.5">Find traveller on route</p>
              </div>
              <div className="bg-black/20 px-3.5 py-2 flex items-center justify-between">
                <span className="text-[10px] font-bold text-white">Tap to send parcel</span>
                <span className="text-white text-xs">＋</span>
              </div>
            </button>
          </div>

          {/* ── TRENDING ROUTES ── */}
          <section style={{ animation: 'staggerIn 0.35s ease 0.14s both' }}>
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">🔥 Trending Routes</h2>
              <button onClick={() => navigate('/explore')} className="text-xs text-orange-500 font-semibold">View All</button>
            </div>
            <div className="flex gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
              {trendingList.map((r, i) => {
                const s = PASTEL[i % PASTEL.length];
                return (
                  <button key={i}
                    onClick={() => navigate('/trips', { state: { from: r.from, to: r.to } })}
                    className={`shrink-0 w-[140px] ${s.bg} border ${s.border} rounded-2xl p-3 text-left active:scale-95 transition-all`}
                    style={{ animation: `staggerIn 0.3s ease both`, animationDelay: `${i * 40}ms` }}>
                    <p className={`text-[10px] font-bold ${s.text} mb-1`}>{r.from} ↔ {r.to}</p>
                    <p className="text-[13px] font-black text-stone-800">{r.count} active</p>
                    <p className="text-[9px] text-stone-400">this week</p>
                    <Sparkline count={r.count} color={s.graph} />
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── TRAVELERS TODAY ── */}
          <section style={{ animation: 'staggerIn 0.35s ease 0.2s both' }}>
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">🚆 Travelers Today</h2>
              <button onClick={() => navigate('/explore')} className="text-xs text-orange-500 font-semibold">View All</button>
            </div>
            <div className="card p-4">
              <div className="flex gap-3">
                {/* Stats + route list */}
                <div className="flex-1 min-w-0">
                  <p className="text-[32px] font-black text-stone-900 leading-none">{travelersToday}</p>
                  <p className="text-[11px] text-stone-400 mt-0.5 mb-2">People traveling today</p>
                  {/* Emoji avatars */}
                  <div className="flex items-center mb-3">
                    {['🧑','👩','🧔','👧','🧑‍💼'].map((e, i) => (
                      <div key={i} className="w-5 h-5 rounded-full bg-stone-100 border border-white flex items-center justify-center text-[9px] -ml-1 first:ml-0">{e}</div>
                    ))}
                    <span className="text-[9px] text-stone-400 ml-1.5">+{Math.max(0, travelersToday - 5)}</span>
                  </div>
                  {/* Route activity */}
                  <div className="space-y-1.5">
                    {routesToday.map((r, i) => (
                      <button key={i}
                        onClick={() => navigate('/trips', { state: { from: r.from, to: r.to } })}
                        className="w-full flex items-center justify-between py-0.5 hover:bg-stone-50 rounded-lg px-1 transition-colors">
                        <span className="text-xs font-semibold text-stone-700">{r.from} → {r.to}</span>
                        <div className="flex items-center gap-0.5 text-[10px] text-stone-400">
                          <span>👥</span>
                          <span className="font-semibold">{r.count} travelers</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                {/* India heatmap */}
                <div className="w-[88px] h-[88px] shrink-0">
                  <IndiaHeatmap />
                </div>
              </div>
            </div>
          </section>

          {/* ── SUCCESS STORIES (featured posts) ── */}
          {posts.filter(p => p.featured).length > 0 && (
            <section style={{ animation: 'staggerIn 0.35s ease 0.26s both' }}>
              <div className="flex items-center justify-between mb-2.5">
                <h2 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">❤️ Success Stories</h2>
                <button className="text-xs text-orange-500 font-semibold">View All</button>
              </div>
              <div className="space-y-3">
                {posts.filter(p => p.featured).slice(0, 2).map(post => (
                  <SuccessStoryCard key={post._id} post={post} />
                ))}
              </div>
            </section>
          )}

          {/* ── DAILY POLL ── */}
          {activePoll && (
            <section style={{ animation: 'staggerIn 0.35s ease 0.3s both' }}>
              <div className="flex items-center justify-between mb-2.5">
                <h2 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">📊 Daily Poll</h2>
                <span className="text-[10px] font-semibold text-stone-400">Community vote</span>
              </div>
              <PollCard
                poll={activePoll}
                hasVoted={hasVoted}
                onVote={handleVote}
                loading={pollVoting}
                userId={user?._id}
              />
            </section>
          )}

          {/* ── RAILWAY UPDATES ── */}
          {railwayUpdates.length > 0 && (
            <section style={{ animation: 'staggerIn 0.35s ease 0.36s both' }}>
              <div className="flex items-center justify-between mb-2.5">
                <h2 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">📰 Railway Updates</h2>
                <span className="text-[10px] font-semibold text-stone-400">Auto-updated</span>
              </div>
              <div className="card overflow-hidden divide-y divide-stone-50">
                {railwayUpdates.slice(0, 3).map((u, i) => (
                  <div key={u._id || i} className="flex gap-3 p-3.5 items-center">
                    <div className="w-14 h-14 shrink-0 rounded-xl bg-stone-100 overflow-hidden flex items-center justify-center">
                      {u.image
                        ? <img src={u.image} alt="" className="w-full h-full object-cover" />
                        : <span className="text-2xl">{['🚆','🚄','🎫'][i % 3]}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-stone-900 leading-snug line-clamp-2">{u.title}</p>
                      <p className="text-[10px] text-stone-400 mt-1">
                        {u.createdAt ? formatDistanceToNow(new Date(u.createdAt), { addSuffix: true }) : '2 hours ago'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── SAFETY TIP + BOTTOM CTAs ── */}
          <div className="grid grid-cols-2 gap-3" style={{ animation: 'staggerIn 0.35s ease 0.42s both' }}>
            <div className="card p-4 flex items-start gap-2.5">
              <span className="text-xl shrink-0">🛡️</span>
              <div>
                <p className="text-xs font-bold text-stone-900">Travel Safe, Delivery Safe</p>
                <p className="text-[10px] text-stone-400 mt-0.5 leading-relaxed">Always verify user, use in-app chat and follow safety guidelines.</p>
              </div>
            </div>
            <div className="card p-4 space-y-2">
              <p className="text-xs font-bold text-stone-900 leading-tight">Can't find what you're looking for?</p>
              <button onClick={() => authGate(() => setShowParcelModal(true))}
                className="w-full py-2 rounded-xl text-[11px] font-bold border border-orange-200 text-orange-600 bg-orange-50 active:scale-95 transition-all flex items-center justify-center gap-1">
                📦 Post Parcel Request
              </button>
              <button onClick={() => authGate(() => {
                  if (user?.kycStatus !== 'verified') { import('react-hot-toast').then(({ default: t }) => t.error('KYC required')); setTimeout(() => navigate('/kyc'), 600); return; }
                  setShowTripModal(true);
                })}
                className="w-full py-2 rounded-xl text-[11px] font-bold border border-emerald-200 text-emerald-600 bg-emerald-50 active:scale-95 transition-all flex items-center justify-center gap-1">
                ✈️ Post Upcoming Trip
              </button>
            </div>
          </div>

        </div>
      )}{/* end feed */}

      </div>{/* close lg:space-y-5 */}

      {/* ── DESKTOP RIGHT SIDEBAR ── */}
      <aside className="hidden lg:block space-y-5 sticky top-[80px]">
        {/* Quick post */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-stone-50">
            <p className="text-xs font-black text-stone-400 uppercase tracking-wide">Quick Post</p>
          </div>
          <button onClick={() => authGate(() => {
              if (user?.kycStatus !== 'verified') { import('react-hot-toast').then(({ default: t }) => t.error('KYC required')); setTimeout(() => navigate('/kyc'), 600); return; }
              setShowTripModal(true);
            })}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-orange-50 transition-colors border-b border-stone-50">
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center shrink-0"><Send size={15} className="text-white" /></div>
            <div className="text-left flex-1"><p className="text-sm font-bold text-stone-900">I'm Travelling</p><p className="text-[11px] text-stone-400">Post trip &amp; start earning</p></div>
            <ChevronRight size={14} className="text-stone-300 shrink-0" />
          </button>
          <button onClick={() => authGate(() => setShowParcelModal(true))}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-blue-50 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center shrink-0"><Package size={15} className="text-white" /></div>
            <div className="text-left flex-1"><p className="text-sm font-bold text-stone-900">Send a Parcel</p><p className="text-[11px] text-stone-400">Find a traveller on your route</p></div>
            <ChevronRight size={14} className="text-stone-300 shrink-0" />
          </button>
        </div>

        {/* Trending sidebar */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-50">
            <p className="text-xs font-black text-stone-800">🔥 Trending Routes</p>
            <button onClick={() => navigate('/explore')} className="text-[10px] font-bold text-orange-500">All →</button>
          </div>
          {trendingList.slice(0, 5).map((r, i) => (
            <button key={i} onClick={() => navigate('/trips', { state: { from: r.from, to: r.to } })}
              className="w-full flex items-center gap-3 px-4 py-3 border-b border-stone-50 last:border-0 hover:bg-stone-50 transition-colors">
              <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-black text-orange-500">#{i+1}</span>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-bold text-stone-900 truncate">{r.from} → {r.to}</p>
                <p className="text-[10px] text-stone-400">{r.count} traveller{r.count !== 1 ? 's' : ''}</p>
              </div>
              <ChevronRight size={12} className="text-stone-300 shrink-0" />
            </button>
          ))}
        </div>

        {/* Railway updates sidebar */}
        {railwayUpdates.length > 0 && (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-stone-50">
              <p className="text-xs font-black text-stone-800">📰 Railway Updates</p>
            </div>
            {railwayUpdates.slice(0, 3).map((u, i) => (
              <div key={u._id || i} className="flex gap-2.5 px-4 py-3 border-b border-stone-50 last:border-0 items-start">
                <div className="w-8 h-8 shrink-0 rounded-lg bg-stone-100 flex items-center justify-center text-base">
                  {['🚆','🚄','🎫'][i % 3]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-stone-900 line-clamp-2 leading-snug">{u.title}</p>
                  <p className="text-[10px] text-stone-400 mt-0.5">
                    {u.createdAt ? formatDistanceToNow(new Date(u.createdAt), { addSuffix: true }) : '2 hours ago'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </aside>

      </div>{/* close lg:grid */}

      {showTripModal && (
        <PostTripModal onClose={() => setShowTripModal(false)}
          onSuccess={trip => { setMyTrips(prev => [trip, ...prev]); setShowTripModal(false); }} />
      )}
      {showParcelModal && (
        <PostParcelModal onClose={() => setShowParcelModal(false)}
          onSuccess={parcel => { setMyParcels(prev => [parcel, ...prev]); setShowParcelModal(false); }} />
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────

function SuccessStoryCard({ post }) {
  return (
    <div className="card p-4 flex gap-3">
      <div className="w-11 h-11 shrink-0 rounded-xl overflow-hidden bg-stone-100 flex items-center justify-center">
        {post.image
          ? <img src={post.image} alt="" className="w-full h-full object-cover" />
          : <span className="text-2xl">{post.emoji || '🕊️'}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-stone-900 leading-snug">{post.title}</p>
        <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed line-clamp-2">{post.content}</p>
        {(post.stats?.route || post.featured) && (
          <span className="inline-flex items-center gap-1 mt-1.5 text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
            ✓ Delivered Safely{post.stats?.route ? ` · ${post.stats.route}` : ''}
          </span>
        )}
        <div className="flex items-center gap-3 mt-2 text-[10px] text-stone-400">
          <span>❤️ {post.likes?.length || 0}</span>
          <span>💬 {post.comments?.length || 0}</span>
          <span>↗️ Share</span>
        </div>
      </div>
    </div>
  );
}

function PollCard({ poll, hasVoted, onVote, loading, userId }) {
  const totalVotes = poll.options.reduce((s, o) => s + (o.votes?.length || 0), 0);
  const userVotedIndex = userId
    ? poll.options.findIndex(o => (o.votes || []).map(String).includes(String(userId)))
    : -1;

  return (
    <div className="card p-4">
      <p className="text-sm font-bold text-stone-900 mb-3 leading-snug">{poll.question}</p>
      <div className="space-y-2">
        {poll.options.map((opt, i) => {
          const pct = totalVotes > 0 ? Math.round(((opt.votes?.length || 0) / totalVotes) * 100) : 0;
          const isMyVote = userVotedIndex === i;
          return (
            <button key={i}
              onClick={() => !hasVoted && !loading && onVote(poll._id, i)}
              disabled={hasVoted || loading}
              className={`w-full text-left relative rounded-xl overflow-hidden transition-all ${
                hasVoted ? 'cursor-default' : 'active:scale-[0.99] hover:opacity-90'
              }`}>
              {/* Progress fill */}
              {hasVoted && (
                <div className="absolute inset-0 rounded-xl transition-all duration-700"
                  style={{ width: `${pct}%`, background: isMyVote ? 'rgba(249,115,22,0.13)' : 'rgba(0,0,0,0.04)' }} />
              )}
              <div className={`relative flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all ${
                isMyVote
                  ? 'border-orange-300 bg-orange-50'
                  : hasVoted
                    ? 'border-stone-100 bg-stone-50'
                    : 'border-stone-200 bg-stone-50 hover:border-orange-200'
              }`}>
                <span className={`text-xs font-semibold ${isMyVote ? 'text-orange-700' : 'text-stone-700'}`}>{opt.text}</span>
                {hasVoted && (
                  <span className={`text-xs font-bold ${isMyVote ? 'text-orange-600' : 'text-stone-400'}`}>{pct}%</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-stone-400 mt-2.5 font-medium">+ {totalVotes.toLocaleString()} vote{totalVotes !== 1 ? 's' : ''}</p>
    </div>
  );
}
