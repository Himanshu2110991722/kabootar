import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import TripCard from '../components/TripCard';
import PostTripModal from '../components/PostTripModal';
import { Plus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAuthGate } from '../hooks/useAuthGate';

export default function TripsPage() {
  const { user } = useAuth();
  const authGate = useAuthGate();
  const [trips, setTrips] = useState([]);
  const [myTrips, setMyTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState({ from: '', to: '' });

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.from) params.from = search.from;
      if (search.to) params.to = search.to;

      const promises = [api.get('/trips', { params })];
      if (user) promises.push(api.get('/trips/my'));

      const [allRes, myRes] = await Promise.all(promises);
      setTrips(allRes.data.trips);
      if (myRes) setMyTrips(myRes.data.trips);
    } finally {
      setLoading(false);
    }
  }, [search.from, search.to, user]);

  useEffect(() => { fetchTrips(); }, [fetchTrips]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this trip?')) return;
    await api.delete(`/trips/${id}`);
    setMyTrips(prev => prev.filter(t => t._id !== id));
    setTrips(prev => prev.filter(t => t._id !== id));
  };

  const displayed = tab === 'all' ? trips : myTrips;

  return (
    <div className="px-4 py-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-stone-900">Trips</h1>
        <button onClick={() => authGate(() => setShowModal(true))} className="btn-primary flex items-center gap-1.5">
          <Plus size={15} /> Post Trip
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-4">
        <input
          className="input-field flex-1"
          placeholder="From city"
          value={search.from}
          onChange={e => setSearch(s => ({ ...s, from: e.target.value }))}
        />
        <input
          className="input-field flex-1"
          placeholder="To city"
          value={search.to}
          onChange={e => setSearch(s => ({ ...s, to: e.target.value }))}
        />
        {(search.from || search.to) && (
          <button onClick={() => setSearch({ from: '', to: '' })} className="btn-ghost px-3">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-stone-100 rounded-xl p-1 mb-4">
        <button
          onClick={() => setTab('all')}
          className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === 'all' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'}`}
        >
          All Trips
        </button>
        <button
          onClick={() => authGate(() => setTab('mine'))}
          className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === 'mine' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'}`}
        >
          My Trips
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 bg-stone-100 rounded w-3/4 mb-2" />
              <div className="h-3 bg-stone-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="text-3xl mb-2">✈️</div>
          <p className="text-stone-500 text-sm">
            {tab === 'mine' ? "You haven't posted any trips yet." : 'No trips found.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(trip => (
            <TripCard
              key={trip._id}
              trip={trip}
              showDelete={tab === 'mine' && (trip.userId?._id === user?._id || trip.userId === user?._id)}
              onDelete={() => handleDelete(trip._id)}
            />
          ))}
        </div>
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
    </div>
  );
}
