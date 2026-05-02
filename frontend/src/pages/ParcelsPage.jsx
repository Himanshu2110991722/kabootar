import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../lib/api';
import ParcelCard from '../components/ParcelCard';
import PostParcelModal from '../components/PostParcelModal';
import MatchesModal from '../components/MatchesModal';
import { ParcelSkeletons } from '../components/SkeletonCard';
import { Plus, X, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAuthGate } from '../hooks/useAuthGate';

const PULL_THRESHOLD = 64;

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

export default function ParcelsPage() {
  const { user }   = useAuth();
  const authGate   = useAuthGate();
  const [parcels,   setParcels]   = useState([]);
  const [myParcels, setMyParcels] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [fetchedAt, setFetchedAt] = useState(null);
  const [tab,       setTab]       = useState('all');
  const [showModal,   setShowModal]   = useState(false);
  const [matchParcel, setMatchParcel] = useState(null);
  const [search,    setSearch]    = useState({ from: '', to: '' });

  const touchStartY  = useRef(0);
  const [pullDelta,  setPullDelta]  = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const fetchParcels = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.from) params.from = search.from;
      if (search.to)   params.to   = search.to;

      const promises = [api.get('/parcels', { params })];
      if (user) promises.push(api.get('/parcels/my'));

      const [allRes, myRes] = await Promise.all(promises);
      setParcels(allRes.data.parcels);
      if (myRes) setMyParcels(myRes.data.parcels);
      setFetchedAt(Date.now());
    } finally { setLoading(false); }
  }, [search.from, search.to, user]);

  useEffect(() => { fetchParcels(); }, [fetchParcels]);

  const onTouchStart = (e) => { touchStartY.current = e.touches[0].clientY; };
  const onTouchMove  = (e) => {
    if (window.scrollY > 4) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) setPullDelta(Math.min(delta * 0.38, PULL_THRESHOLD + 20));
  };
  const onTouchEnd   = async () => {
    if (pullDelta >= PULL_THRESHOLD) {
      setRefreshing(true);
      await fetchParcels();
      setRefreshing(false);
    }
    setPullDelta(0);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this request?')) return;
    await api.delete(`/parcels/${id}`);
    setMyParcels(prev => prev.filter(p => p._id !== id));
    setParcels(prev => prev.filter(p => p._id !== id));
  };

  const displayed = tab === 'all' ? parcels : myParcels;

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

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-stone-900">Parcels</h1>
          {fetchedAt && !loading && <LiveBadge time={fetchedAt} />}
        </div>
        <button onClick={() => authGate(() => setShowModal(true))} className="btn-primary flex items-center gap-1.5">
          <Plus size={15} /> Send Parcel
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <input className="input-field flex-1" placeholder="From city" value={search.from}
          onChange={e => setSearch(s => ({ ...s, from: e.target.value }))} />
        <input className="input-field flex-1" placeholder="To city" value={search.to}
          onChange={e => setSearch(s => ({ ...s, to: e.target.value }))} />
        {(search.from || search.to) && (
          <button onClick={() => setSearch({ from: '', to: '' })} className="btn-ghost px-3"><X size={16} /></button>
        )}
      </div>

      <div className="flex gap-1 bg-stone-100 rounded-xl p-1 mb-4">
        <button onClick={() => setTab('all')}
          className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === 'all' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'}`}>
          All Requests
        </button>
        <button onClick={() => authGate(() => setTab('mine'))}
          className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === 'mine' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'}`}>
          My Requests
        </button>
      </div>

      {loading ? (
        <ParcelSkeletons count={3} />
      ) : displayed.length === 0 ? (
        <div className="card p-8 text-center animate-fade-in">
          <div className="text-3xl mb-2">📦</div>
          <p className="text-stone-500 text-sm">
            {tab === 'mine' ? "You haven't posted any requests yet." : 'No open requests found.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {renderStaggered(displayed, parcel => (
            <ParcelCard
              parcel={parcel}
              showDelete={tab === 'mine'}
              onDelete={() => handleDelete(parcel._id)}
              onFindMatch={() => authGate(() => setMatchParcel(parcel))}
            />
          ))}
        </div>
      )}

      {showModal && (
        <PostParcelModal
          onClose={() => setShowModal(false)}
          onSuccess={p => {
            setMyParcels(prev => [p, ...prev]);
            setParcels(prev => [p, ...prev]);
            setShowModal(false);
          }}
        />
      )}

      {matchParcel && (
        <MatchesModal parcel={matchParcel} onClose={() => setMatchParcel(null)} />
      )}
    </div>
  );
}
