import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAuthGate } from '../hooks/useAuthGate';
import { format } from 'date-fns';
import { MapPin, Calendar, Weight, IndianRupee, Trash2, MessageCircle, Star,
         Train, Plane, Bus, Car, CheckCircle, Package, ChevronRight, Clock, Edit2 } from 'lucide-react';
import TravelerProfileModal from './TravelerProfileModal';

const TRANSPORT_ICONS  = { train: Train, flight: Plane, bus: Bus, car: Car };
const TRANSPORT_LABELS = { train: 'Train', flight: 'Flight', bus: 'Bus', car: 'Car' };
const TRANSPORT_EMOJI  = { train: '🚂', flight: '✈️', bus: '🚌', car: '🚗' };

const fmtTime = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

function WAIcon() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zm-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884zm8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

function shareToWA(text) {
  if (navigator.share) navigator.share({ title: 'Kabutar', text }).catch(() => {});
  else window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
}

function Avatar({ user }) {
  return (
    <div className="w-8 h-8 rounded-full overflow-hidden bg-orange-50 border border-orange-100 flex items-center justify-center font-bold text-xs text-orange-600 shrink-0">
      {user?.profileImage
        ? <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
        : user?.name?.[0]?.toUpperCase()}
    </div>
  );
}

// isPast: when true card is muted read-only (travel history view)
export default function TripCard({ trip, showDelete, onDelete, onEdit, isPast = false }) {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const authGate   = useAuthGate();
  const [showProfile, setShowProfile] = useState(false);

  const Icon       = TRANSPORT_ICONS[trip.transportMode] || Train;
  const traveler   = trip.userId;
  const isOwn      = traveler?._id === user?._id || trip.userId === user?._id;
  const isVerified = traveler?.kycStatus === 'verified';

  const handleShare = (e) => {
    e.stopPropagation();
    const emoji   = TRANSPORT_EMOJI[trip.transportMode] || '🚗';
    const date    = format(new Date(trip.date), 'dd MMM');
    const station = trip.pickupStation ? `📍 ${trip.pickupStation}\n` : '';
    const rating  = traveler?.rating ? `⭐ ${traveler.rating.toFixed(1)}` : '';
    shareToWA(
`🕊️ *Kabutar* — Send parcel with a traveler!

${trip.fromCity} → ${trip.toCity}
${station}📅 ${date} · ${emoji} ${TRANSPORT_LABELS[trip.transportMode] || ''}
⚖️ ${trip.availableWeight} kg · 💰 ₹${trip.pricePerKg}/kg${rating ? `\n${rating}` : ''}

Book a parcel spot 👇
https://app.kabutar.in`
    );
  };

  // Duration between departure and arrival
  let duration = '';
  if (trip.departureTime && trip.arrivalTime) {
    const [dh, dm] = trip.departureTime.split(':').map(Number);
    const [ah, am] = trip.arrivalTime.split(':').map(Number);
    const mins = (ah * 60 + am) - (dh * 60 + dm);
    if (mins > 0) {
      const h = Math.floor(mins / 60), m = mins % 60;
      duration = `${h > 0 ? h + 'h ' : ''}${m > 0 ? m + 'm' : ''}`.trim();
    }
  }

  return (
    <>
      <div className={`card p-3 animate-fade-in ${isPast ? 'opacity-70' : ''}`}>

        {/* ── Row 1: Route + WA share (inline, no extra row) ── */}
        <div className="flex items-center gap-1.5 mb-2">
          <MapPin size={11} className="text-orange-500 shrink-0" />
          <span className="font-semibold text-stone-900 text-sm truncate">{trip.fromCity}</span>
          {/* Route dividers with travelling glow animation */}
          <div className="flex items-center gap-0.5 text-stone-400 shrink-0">
            <div className="h-px w-5 route-sweep-line bg-stone-200" />
            <Icon size={12} />
            <div className="h-px w-5 route-sweep-line bg-stone-200" style={{ '--sweep-delay': '1.1s' }} />
          </div>
          <span className="font-semibold text-stone-900 text-sm truncate">{trip.toCity}</span>
          <MapPin size={11} className="text-emerald-500 shrink-0" />
          {isPast && <span className="ml-auto badge-stone text-[10px] shrink-0">Past</span>}
          {/* WA share inline — no extra row */}
          {!isPast && (
            <button
              onClick={handleShare}
              title="Share on WhatsApp"
              className="ml-auto shrink-0 w-6 h-6 rounded-lg bg-green-50 flex items-center justify-center text-green-600 hover:bg-green-100 active:scale-95 transition-all"
            >
              <WAIcon />
            </button>
          )}
        </div>

        {/* Station (if set) — compact single line */}
        {trip.pickupStation && (
          <div className="text-[10px] text-stone-400 mb-1.5 truncate">📍 {trip.pickupStation}</div>
        )}

        {/* ── Row 2: Meta badges ── */}
        <div className="flex gap-1.5 flex-wrap mb-2">
          <span className="badge-stone text-[10px]"><Calendar size={9} />{format(new Date(trip.date), 'dd MMM yy')}</span>
          <span className="badge-orange text-[10px]"><Weight size={9} />{trip.availableWeight} kg</span>
          <span className="badge-green text-[10px]"><IndianRupee size={9} />{trip.pricePerKg}/kg</span>
          <span className="badge-blue text-[10px]"><Icon size={9} />{TRANSPORT_LABELS[trip.transportMode]}</span>
        </div>

        {/* ── Row 3: Time (if set) — inline compact ── */}
        {(trip.departureTime || trip.arrivalTime) && (
          <div className="flex items-center gap-1 text-[11px] text-stone-500 mb-2">
            <Clock size={10} className="text-stone-400 shrink-0" />
            {trip.departureTime && <span className="font-medium">{fmtTime(trip.departureTime)}</span>}
            {trip.departureTime && trip.arrivalTime && <span className="text-stone-300">→</span>}
            {trip.arrivalTime && <span>{fmtTime(trip.arrivalTime)}</span>}
            {duration && <span className="text-stone-300 ml-1">· {duration}</span>}
          </div>
        )}

        {/* ── Row 4: Traveler + all actions (single row, no extra row) ── */}
        {traveler && typeof traveler === 'object' && (
          <div className="flex items-center gap-2 pt-2 border-t border-stone-100">

            {/* Left: tappable profile area */}
            {!isOwn ? (
              <button
                onClick={() => !isPast && setShowProfile(true)}
                className="flex items-center gap-1.5 flex-1 min-w-0 text-left"
              >
                <Avatar user={traveler} />
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold text-stone-800 truncate block">{traveler.name}</span>
                  <div className="flex items-center gap-1.5 text-[10px] text-stone-400 flex-wrap">
                    <span className="flex items-center gap-0.5">
                      <Star size={9} className="text-amber-400 fill-amber-400" />
                      {traveler.rating?.toFixed(1)}
                      {traveler.totalRatings > 0 && ` (${traveler.totalRatings})`}
                    </span>
                    {traveler.city && <span>· 📍{traveler.city}</span>}
                    {traveler.tripsCompleted > 0 && <span>· {traveler.tripsCompleted} trips</span>}
                    {isVerified && (
                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                        <CheckCircle size={9} /> KYC Verified
                      </span>
                    )}
                  </div>
                </div>
                {!isPast && <ChevronRight size={12} className="text-orange-400 shrink-0" />}
              </button>
            ) : (
              <div className="flex-1 min-w-0">
                <span className="text-xs text-stone-400 font-medium">Your trip</span>
              </div>
            )}

            {/* Right: action buttons — all inline */}
            <div className="flex items-center gap-1.5 shrink-0">
              {onEdit && !isPast && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
                >
                  <Edit2 size={13} /> Edit
                </button>
              )}
              {showDelete && !isPast && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  title="Delete trip"
                  className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              )}
              {!isOwn && !isPast && (
                <button
                  onClick={(e) => { e.stopPropagation(); authGate(() => navigate(`/chat/${traveler._id}`)); }}
                  className="btn-primary py-1 px-2.5 text-xs flex items-center gap-1"
                >
                  <MessageCircle size={11} /> Chat
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {showProfile && traveler && !isPast && (
        <TravelerProfileModal
          travelerId={traveler._id}
          travelerSnap={traveler}
          onClose={() => setShowProfile(false)}
          onChat={() => { setShowProfile(false); authGate(() => navigate(`/chat/${traveler._id}`)); }}
        />
      )}
    </>
  );
}
