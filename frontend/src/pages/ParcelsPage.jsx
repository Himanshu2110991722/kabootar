import { useState, useEffect, useCallback } from "react";
import api from "../lib/api";
import ParcelCard from "../components/ParcelCard";
import PostParcelModal from "../components/PostParcelModal";
import MatchesModal from "../components/MatchesModal";
import { Plus, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function ParcelsPage() {
  const { user } = useAuth();
  const [parcels, setParcels] = useState([]);
  const [myParcels, setMyParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [matchParcel, setMatchParcel] = useState(null);
  const [search, setSearch] = useState({ from: "", to: "" });

  const fetchParcels = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.from) params.from = search.from;
      if (search.to) params.to = search.to;
      const [allRes, myRes] = await Promise.all([
        api.get("/parcels", { params }),
        api.get("/parcels/my"),
      ]);
      setParcels(allRes.data.parcels);
      setMyParcels(myRes.data.parcels);
    } finally {
      setLoading(false);
    }
  }, [search.from, search.to]);

  useEffect(() => { fetchParcels(); }, [fetchParcels]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this request?")) return;
    await api.delete(`/parcels/${id}`);
    setMyParcels(prev => prev.filter(p => p._id !== id));
    setParcels(prev => prev.filter(p => p._id !== id));
  };

  const displayed = tab === "all" ? parcels : myParcels;

  return (
    <div className="px-4 py-5">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-stone-900">Parcels</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-1.5">
          <Plus size={15} /> Send Parcel
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <input className="input-field flex-1" placeholder="From city" value={search.from}
          onChange={e => setSearch(s => ({ ...s, from: e.target.value }))} />
        <input className="input-field flex-1" placeholder="To city" value={search.to}
          onChange={e => setSearch(s => ({ ...s, to: e.target.value }))} />
        {(search.from || search.to) && (
          <button onClick={() => setSearch({ from: "", to: "" })} className="btn-ghost px-3"><X size={16} /></button>
        )}
      </div>

      <div className="flex gap-1 bg-stone-100 rounded-xl p-1 mb-4">
        {["all", "mine"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              tab === t ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"
            }`}
          >
            {t === "all" ? "All Requests" : "My Requests"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => (
          <div key={i} className="card p-4 animate-pulse">
            <div className="h-4 bg-stone-100 rounded w-3/4 mb-2" />
            <div className="h-3 bg-stone-100 rounded w-1/2" />
          </div>
        ))}</div>
      ) : displayed.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="text-3xl mb-2">📦</div>
          <p className="text-stone-500 text-sm">
            {tab === "mine" ? "You haven't posted any requests yet." : "No open requests found."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(parcel => (
            <ParcelCard
              key={parcel._id}
              parcel={parcel}
              showDelete={tab === "mine"}
              onDelete={() => handleDelete(parcel._id)}
              onFindMatch={() => setMatchParcel(parcel)}
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
