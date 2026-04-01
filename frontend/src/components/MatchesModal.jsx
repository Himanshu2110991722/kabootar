import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { format } from "date-fns";
import { X, Zap, MessageCircle, Star, MapPin, Calendar, Weight, IndianRupee } from "lucide-react";

export default function MatchesModal({ parcel, onClose }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/match/parcel/${parcel._id}`)
      .then(r => setTrips(r.data.trips))
      .finally(() => setLoading(false));
  }, [parcel._id]);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <Zap size={18} className="text-amber-500" />
              <h2 className="font-bold text-stone-900">Matching Travelers</h2>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              {parcel.fromCity} → {parcel.toCity} · {parcel.weight} kg
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 -mr-1.5"><X size={18} /></button>
        </div>

        <div className="px-5 py-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="space-y-3">
              {[1,2].map(i => (
                <div key={i} className="card p-4 animate-pulse">
                  <div className="h-4 bg-stone-100 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-stone-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : trips.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">😕</div>
              <p className="font-semibold text-stone-700 mb-1">No matches yet</p>
              <p className="text-stone-400 text-sm">
                No travelers going from {parcel.fromCity} to {parcel.toCity} right now.
                Check back soon!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-stone-500">{trips.length} traveler{trips.length > 1 ? "s" : ""} found</p>
              {trips.map(trip => {
                const traveler = trip.userId;
                return (
                  <div key={trip._id} className="card p-4 space-y-3">
                    {/* Traveler */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center font-bold text-orange-500">
                          {traveler?.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-stone-900 text-sm">{traveler?.name}</div>
                          <div className="flex items-center gap-1">
                            <Star size={10} className="text-amber-400 fill-amber-400" />
                            <span className="text-xs text-stone-400">{traveler?.rating?.toFixed(1)} ({traveler?.totalRatings} reviews)</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => { navigate(`/chat/${traveler._id}`); onClose(); }}
                        className="btn-primary py-1.5 flex items-center gap-1.5"
                      >
                        <MessageCircle size={13} /> Chat
                      </button>
                    </div>

                    {/* Trip info */}
                    <div className="flex flex-wrap gap-1.5">
                      <span className="badge-stone">
                        <Calendar size={10} />
                        {format(new Date(trip.date), "dd MMM")}
                      </span>
                      <span className="badge-orange">
                        <Weight size={10} />
                        {trip.availableWeight} kg capacity
                      </span>
                      <span className="badge-green">
                        <IndianRupee size={10} />
                        {trip.pricePerKg}/kg · ≈₹{Math.ceil(parcel.weight * trip.pricePerKg)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
