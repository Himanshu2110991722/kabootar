import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { format } from "date-fns";
import { MapPin, Calendar, Weight, IndianRupee, Trash2, MessageCircle, Star, Train, Plane, Bus, Car } from "lucide-react";

const TRANSPORT_ICONS = {
  train: Train,
  flight: Plane,
  bus: Bus,
  car: Car,
};

const TRANSPORT_LABELS = {
  train: "Train",
  flight: "Flight",
  bus: "Bus",
  car: "Car",
};

export default function TripCard({ trip, showDelete, onDelete }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const Icon = TRANSPORT_ICONS[trip.transportMode] || Train;
  const traveler = trip.userId;
  const isOwn = traveler?._id === user?._id || trip.userId === user?._id;

  return (
    <div className="card p-4 space-y-3 animate-fade-in">
      {/* Route */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 flex-1">
          <MapPin size={13} className="text-orange-500 shrink-0" />
          <span className="font-semibold text-stone-900 text-sm">{trip.fromCity}</span>
        </div>
        <div className="flex items-center gap-1 text-stone-400">
          <div className="h-px w-6 bg-stone-200" />
          <Icon size={14} />
          <div className="h-px w-6 bg-stone-200" />
        </div>
        <div className="flex items-center gap-1.5 flex-1 justify-end">
          <span className="font-semibold text-stone-900 text-sm">{trip.toCity}</span>
          <MapPin size={13} className="text-emerald-500 shrink-0" />
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-2">
        <span className="badge-stone">
          <Calendar size={10} />
          {format(new Date(trip.date), "dd MMM yyyy")}
        </span>
        <span className="badge-orange">
          <Weight size={10} />
          {trip.availableWeight} kg
        </span>
        <span className="badge-green">
          <IndianRupee size={10} />
          {trip.pricePerKg}/kg
        </span>
        <span className="badge-blue">
          <Icon size={10} />
          {TRANSPORT_LABELS[trip.transportMode]}
        </span>
      </div>

      {/* Traveler info & actions */}
      {traveler && typeof traveler === "object" && (
        <div className="flex items-center justify-between pt-1 border-t border-stone-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 font-bold text-xs">
              {traveler.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div className="text-xs font-semibold text-stone-700">{traveler.name}</div>
              <div className="flex items-center gap-0.5">
                <Star size={9} className="text-amber-400 fill-amber-400" />
                <span className="text-[11px] text-stone-400">{traveler.rating?.toFixed(1)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showDelete && (
              <button
                onClick={onDelete}
                className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            )}
            {!isOwn && (
              <button
                onClick={() => navigate(`/chat/${traveler._id}`)}
                className="btn-primary py-1.5 flex items-center gap-1.5"
              >
                <MessageCircle size={13} />
                Chat
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
