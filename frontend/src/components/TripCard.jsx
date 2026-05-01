import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAuthGate } from '../hooks/useAuthGate';
import { format } from 'date-fns';
import { MapPin, Calendar, Weight, IndianRupee, Trash2, MessageCircle, Star, Train, Plane, Bus, Car, CheckCircle } from 'lucide-react';

const TRANSPORT_ICONS = { train: Train, flight: Plane, bus: Bus, car: Car };
const TRANSPORT_LABELS = { train: 'Train', flight: 'Flight', bus: 'Bus', car: 'Car' };

function UserAvatar({ user, size = 7, bgColor = 'bg-orange-50', textColor = 'text-orange-600' }) {
  const cls = `w-${size} h-${size} rounded-full overflow-hidden flex items-center justify-center font-bold text-xs ${bgColor} ${textColor} shrink-0`;
  return (
    <div className={cls}>
      {user?.profileImage
        ? <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
        : user?.name?.[0]?.toUpperCase()}
    </div>
  );
}

export default function TripCard({ trip, showDelete, onDelete }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const authGate = useAuthGate();
  const Icon = TRANSPORT_ICONS[trip.transportMode] || Train;
  const traveler = trip.userId;
  const isOwn = traveler?._id === user?._id || trip.userId === user?._id;
  const isVerified = traveler?.kycStatus === 'verified';

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

      {trip.pickupStation && (
        <div className="text-[11px] text-stone-400 -mt-1">📍 {trip.pickupStation}</div>
      )}

      <div className="flex flex-wrap gap-2">
        <span className="badge-stone"><Calendar size={10} />{format(new Date(trip.date), 'dd MMM yyyy')}</span>
        <span className="badge-orange"><Weight size={10} />{trip.availableWeight} kg</span>
        <span className="badge-green"><IndianRupee size={10} />{trip.pricePerKg}/kg</span>
        <span className="badge-blue"><Icon size={10} />{TRANSPORT_LABELS[trip.transportMode]}</span>
      </div>

      {traveler && typeof traveler === 'object' && (
        <div className="flex items-center justify-between pt-1 border-t border-stone-50">
          <div className="flex items-center gap-2">
            <UserAvatar user={traveler} />
            <div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-stone-700">{traveler.name}</span>
                {isVerified && (
                  <CheckCircle size={11} className="text-emerald-500 fill-emerald-500" title="KYC Verified" />
                )}
              </div>
              <div className="flex items-center gap-0.5">
                <Star size={9} className="text-amber-400 fill-amber-400" />
                <span className="text-[11px] text-stone-400">{traveler.rating?.toFixed(1)}</span>
                {traveler.maskedPhone && (
                  <span className="text-[11px] text-stone-300 ml-1">{traveler.maskedPhone}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showDelete && (
              <button onClick={onDelete} className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 transition-colors">
                <Trash2 size={14} />
              </button>
            )}
            {!isOwn && (
              <button onClick={() => authGate(() => navigate(`/chat/${traveler._id}`))} className="btn-primary py-1.5 flex items-center gap-1.5">
                <MessageCircle size={13} /> Chat
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
