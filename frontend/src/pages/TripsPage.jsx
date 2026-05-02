import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../lib/api';
import TripCard from '../components/TripCard';
import PostTripModal from '../components/PostTripModal';
import { TripSkeletons } from '../components/SkeletonCard';
import { Plus, X, Calendar, Search, History, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAuthGate } from '../hooks/useAuthGate';

const today = new Date().toISOString().split('T')[0];
const startOfToday = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const PULL_THRESHOLD = 64;

// ── Live "updated X ago" badge ────────────────────────────────────────────────
function LiveBadge({ time }) {
  const [label, setLabel] = useState('Just now');
  useEffect(() => {
    const update = () => {
      const s = Math.floor((Date.now() - time) / 1000);
      setLabel(s < 8 ? 'Just now' : s < 60 ? `${s}s ago` : `${Math.floor(s / 60)}m ago`);
    };
    update();
    const t = setInterval(update, 5000);
    return () => clearInterval(t);
  }, [time]);
  return (
    <div className="flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-soft shrink-0" />
      <span className="text-[10px] text-stone-400 font-medium">Updated {label}</span>
    </div>
  );
}

export default function TripsPage() {
  const { user }   = useAuth();
  const authGate   = useAuthGate();
  const location   = useLocation();

  const [trips, setTrips]       = useState([]);
  const [myTrips, setMyTrips]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [fetchedAt, setFetchedAt] = useState(null);
  const [tab, setTab]           = useState(location.state?.tab === 'mine' ? 'mine' : 'all');
  const [showModal, setShowModal]     = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [search, setSearch]     = useState({ from: '', to: '', date: '' });

  // Pull-to-refresh state
  const touchStartY   = useRef(0);
  const [pullDelta,   setPullDelta]   = useState(0);
  const [refreshing,  setRefreshing]  = useState(false);

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.from) params.from = search.from;
      if (search.to)   params.to   = search.to;
      if (search.date) params.date = search.date;

      const promises = [api.get('/trips', { params })];
      if (user) promises.push(api.get('/trips/my'));

      const [allRes, myRes] = await Promise.all(promises);
      setTrips(allRes.data.trips);
      if (myRes) setMyTrips(myRes.data.trips);
      setFetchedAt(Date.now());
    } finally { setLoading(false); }
  }, [search.from, search.to, search.date, user]);

  useEffect(() => { fetchTrips(); }, [fetchTrips]);

  // Pull-to-refresh handlers
  const onTouchStart = (e) => { touchStartY.current = e.touches[0].clientY; };
  const onTouchMove  = (e) => {
    if (window.scrollY > 4) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) setPullDelta(Math.min(delta * 0.38, PULL_THRESHOLD + 20));
  };
  const onTouchEnd   = async () => {
    if (pullDelta >= PULL_THRESHOLD) {
      setRefreshing(true);
      await fetchTrips();
      setRefreshing(false);
    }
    setPullDelta(0);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this trip?')) return;
    await api.delete(`/trips/${id}`);
    setMyTrips(prev => prev.filter(t => t._id !== id));
    setTrips(prev => prev.filter(t => t._id !== id));
  };

  const handleEditSuccess = (updated) => {
    setMyTrips(prev => prev.map(t => t._id === updated._id ? updated : t));
    setTrips(prev => prev.map(t => t._id === updated._id ? updated : t));
    setEditingTrip(null);
  };

  const clearFilter = (key) => setSearch(s => ({ ...s, [key]: '' }));
  const clearAll    = () => setSearch({ from: '', to: '', date: '' });

  const activeFilters = [
    search.from && { key: 'from', label: `From: ${search.from}` },
    search.to   && { key: 'to',   label: `To: ${search.to}` },
    search.date && { key: 'date', label: `${format(new Date(search.date), 'dd MMM yyyy')}` },
  ].filter(Boolean);

  const sod = startOfToday();
  const futureMyTrips = myTrips.filter(t => new Date(t.date) >= sod);
  const pastMyTrips   = myTrips.filter(t => new Date(t.date) <  sod);
  const isOwner = (trip) => trip.userId?._id === user?._id || trip.userId === user?._id;

  // Staggered list renderer
  const renderStaggered = (items, renderFn) =>
    items.map((item, i) => (
      <div key={item._id}
        style={{ animation: 'staggerIn 0.35s ease both', animationDelay: `${i * 55}ms` }}>
        {renderFn(item)}
      </div>
    ));

  return (
    <div
      className="px-4 py-5 relative"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      <div
        className="absolute left-0 right-0 flex justify-center pointer-events-none z-10 transition-all duration-200"
        style={{ top: Math.max(0, pullDelta - 8), opacity: pullDelta / PULL_THRESHOLD }}
      >
        <div className="bg-white rounded-full shadow-md border border-stone-100 px-3 py-1.5 flex items-center gap-2">
          <RefreshCw
            size={13}
            className={`text-orange-500 ${refreshing || pullDelta >= PULL_THRESHOLD ? 'animate-spin' : ''}`}
            style={{ animationDuration: '0.7s' }}
          />
          <span className="text-xs font-semibold text-stone-600">
            {pullDelta >= PULL_THRESHOLD ? 'Refreshing…' : 'Pull to refresh'}
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-stone-900">Travellers</h1>
          {fetchedAt && !loading && <LiveBadge time={fetchedAt} />}
        </div>
        <button onClick={() => authGate(() => setShowModal(true))} className="btn-primary flex items-center gap-1.5">
          <Plus size={15} /> Post Trip
        </button>
      </div>

      {/* Search & Filters */}
      <div className="space-y-2 mb-4">
        <div className="flex gap-2">
          <input className="input-field flex-1" placeholder="From city"
            value={search.from} onChange={e => setSearch(s => ({ ...s, from: e.target.value }))} />
          <input className="input-field flex-1" placeholder="To city"
            value={search.to} onChange={e => setSearch(s => ({ ...s, to: e.target.value }))} />
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
            <input type="date" className="input-field pl-8 text-sm" min={today}
              value={search.date} onChange={e => setSearch(s => ({ ...s, date: e.target.value }))} />
          </div>
          <button onClick={fetchTrips} className="btn-primary px-4 py-2.5 flex items-center gap-1.5 text-sm">
            <Search size={13} /> Search
          </button>
          {activeFilters.length > 0 && (
            <button onClick={clearAll} className="btn-ghost px-3 py-2.5 text-stone-400"><X size={16} /></button>
          )}
        </div>
        {activeFilters.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {activeFilters.map(f => (
              <button key={f.key} onClick={() => clearFilter(f.key)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 transition-colors">
                {f.label} <X size={9} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-stone-100 rounded-xl p-1 mb-4">
        <button onClick={() => setTab('all')}
          className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === 'all' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'}`}>
          All Travellers
        </button>
        <button onClick={() => authGate(() => setTab('mine'))}
          className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === 'mine' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'}`}>
          My Trips
        </button>
      </div>

      {/* All Travellers tab */}
      {tab === 'all' && (
        loading
          ? <TripSkeletons count={3} />
          : trips.length === 0
            ? (
              <div className="card p-8 text-center animate-fade-in">
                <div className="text-3xl mb-2">✈️</div>
                <p className="text-stone-600 text-sm font-semibold mb-1">No travellers found</p>
                {activeFilters.length > 0 && (
                  <button onClick={clearAll} className="text-orange-500 text-xs font-semibold mt-1">
                    Clear filters and try again
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {activeFilters.length > 0 && (
                  <p className="text-xs text-stone-400">{trips.length} traveller{trips.length !== 1 ? 's' : ''} found</p>
                )}
                {renderStaggered(trips, trip => <TripCard trip={trip} />)}
              </div>
            )
      )}

      {/* My Trips tab */}
      {tab === 'mine' && (
        loading
          ? <TripSkeletons count={2} />
          : (
            <div className="space-y-4">
              {futureMyTrips.length === 0 ? (
                <div className="card p-6 text-center animate-fade-in">
                  <div className="text-2xl mb-2">✈️</div>
                  <p className="text-stone-600 text-sm font-semibold">No upcoming trips</p>
                  <button onClick={() => authGate(() => setShowModal(true))}
                    className="text-orange-500 text-xs font-semibold mt-2 block mx-auto">
                    + Post your first trip
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {renderStaggered(futureMyTrips, trip => (
                    <TripCard
                      trip={trip}
                      showDelete={isOwner(trip)}
                      onDelete={() => handleDelete(trip._id)}
                      onEdit={isOwner(trip) ? () => setEditingTrip(trip) : undefined}
                    />
                  ))}
                </div>
              )}

              {pastMyTrips.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <History size={13} className="text-stone-400" />
                    <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Travel History</span>
                    <div className="flex-1 h-px bg-stone-100" />
                    <span className="text-[11px] text-stone-400">{pastMyTrips.length} past trip{pastMyTrips.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="space-y-2">
                    {renderStaggered(pastMyTrips, trip => <TripCard trip={trip} isPast />)}
                  </div>
                </div>
              )}
            </div>
          )
      )}

      {showModal && (
        <PostTripModal
          onClose={() => setShowModal(false)}
          onSuccess={trip => {
            setMyTrips(prev => [trip, ...prev]);
            setTrips(prev => [trip, ...prev]);
            setShowModal(false);
          }}
        />
      )}

      {editingTrip && (
        <PostTripModal
          initialData={editingTrip}
          tripId={editingTrip._id}
          onClose={() => setEditingTrip(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
