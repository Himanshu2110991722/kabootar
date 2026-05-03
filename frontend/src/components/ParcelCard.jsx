import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAuthGate } from '../hooks/useAuthGate';
import { formatDistanceToNow } from 'date-fns';
import { MapPin, Trash2, MessageCircle, Star, Zap, CheckCircle, IndianRupee } from 'lucide-react';

const ITEM_EMOJI = { documents: '📄', electronics: '📱', clothes: '👕', others: '📦' };
const ITEM_LABEL = { documents: 'Documents', electronics: 'Electronics', clothes: 'Clothes', others: 'Other item' };

// Human-readable status — no jargon
const STATUS_LABEL = {
  open:       'Looking for carrier',
  matched:    'Carrier found',
  requested:  'Awaiting response',
  accepted:   'Carrier accepted',
  picked:     'Picked up ✓',
  in_transit: 'In transit 🚀',
  delivered:  'Delivered ✓',
  cancelled:  'Cancelled',
};
const STATUS_COLOR = {
  open:       'bg-emerald-50 text-emerald-700',
  matched:    'bg-blue-50 text-blue-700',
  requested:  'bg-blue-50 text-blue-700',
  accepted:   'bg-amber-50 text-amber-700',
  picked:     'bg-orange-50 text-orange-700',
  in_transit: 'bg-amber-50 text-amber-700',
  delivered:  'bg-stone-100 text-stone-600',
  cancelled:  'bg-stone-100 text-stone-500',
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

function SenderAvatar({ user }) {
  return (
    <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-xs text-blue-600 shrink-0">
      {user?.profileImage
        ? <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
        : user?.name?.[0]?.toUpperCase()}
    </div>
  );
}

export default function ParcelCard({ parcel, showDelete, onDelete, onFindMatch }) {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const authGate   = useAuthGate();
  const sender     = parcel.userId;
  const isOwn      = sender?._id === user?._id || parcel.userId === user?._id;
  const isVerified = sender?.kycStatus === 'verified';

  const handleShare = () => {
    shareToWA(
`🕊️ *Kabutar* — Parcel needs a carrier!

${ITEM_EMOJI[parcel.itemType] || '📦'} ${ITEM_LABEL[parcel.itemType] || 'Item'}
${parcel.fromCity} → ${parcel.toCity}
${parcel.pickupStation ? `📍 ${parcel.pickupStation}\n` : ''}Approx ${parcel.weight} kg${parcel.offeredPrice ? ` · Offering ₹${parcel.offeredPrice}` : ''}

${parcel.description}

Can you carry this? Chat & earn 💸
https://app.kabutar.in`
    );
  };

  const statusLabel = STATUS_LABEL[parcel.status] || parcel.status;
  const statusColor = STATUS_COLOR[parcel.status] || 'bg-stone-100 text-stone-500';
  const timeAgo     = formatDistanceToNow(new Date(parcel.createdAt), { addSuffix: true });

  return (
    <div className="card p-3.5 animate-fade-in">

      {/* ── Row 1: Role label + status + WA ── */}
      <div className="flex items-center gap-1.5 mb-2.5">
        <span className="text-[10px] font-bold uppercase tracking-wide bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full shrink-0">
          📦 Sender
        </span>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusColor}`}>
          {statusLabel}
        </span>
        <span className="text-[10px] text-stone-400 shrink-0 ml-auto">{timeAgo}</span>
        <button onClick={handleShare} title="Share on WhatsApp"
          className="shrink-0 w-6 h-6 rounded-lg bg-green-50 flex items-center justify-center text-green-600 hover:bg-green-100 active:scale-95 transition-all">
          <WAIcon />
        </button>
      </div>

      {/* ── Row 2: Route ── */}
      <div className="flex items-center gap-1.5 mb-1">
        <MapPin size={12} className="text-orange-500 shrink-0" />
        <span className="font-bold text-stone-900 text-sm truncate">{parcel.fromCity}</span>
        <div className="flex-1 h-px bg-stone-200 mx-1 route-sweep-line" />
        <span className="font-bold text-stone-900 text-sm truncate">{parcel.toCity}</span>
        <MapPin size={12} className="text-emerald-500 shrink-0" />
      </div>

      {/* Station */}
      {parcel.pickupStation && (
        <div className="text-[10px] text-stone-400 ml-4 mb-1.5 truncate">📍 {parcel.pickupStation}</div>
      )}

      {/* ── Row 3: Item details — human readable ── */}
      <div className="flex items-center gap-1.5 mb-1.5 text-[11px]">
        <span className="text-base leading-none">{ITEM_EMOJI[parcel.itemType] || '📦'}</span>
        <span className="font-medium text-stone-700">{ITEM_LABEL[parcel.itemType] || 'Item'}</span>
        <span className="text-stone-400">·</span>
        <span className="text-stone-600">Approx {parcel.weight} kg</span>
        {parcel.offeredPrice && (
          <>
            <span className="text-stone-400">·</span>
            <span className="font-semibold text-emerald-700 flex items-center gap-0.5">
              <IndianRupee size={9} />{parcel.offeredPrice} offered
            </span>
          </>
        )}
      </div>

      {/* ── Description ── */}
      <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed mb-2.5 italic">
        "{parcel.description}"
      </p>

      {/* ── Row 4: Sender + actions ── */}
      {sender && typeof sender === 'object' && (
        <div className="flex items-center gap-2 pt-2.5 border-t border-stone-100">
          <SenderAvatar user={sender} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-stone-800 truncate">{sender.name}</span>
              {isVerified && <CheckCircle size={10} className="text-emerald-500 fill-emerald-500 shrink-0" />}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-stone-400 mt-0.5 flex-wrap">
              <span className="flex items-center gap-0.5">
                <Star size={9} className="text-amber-400 fill-amber-400" />
                {sender.rating?.toFixed(1)}
                {sender.totalRatings > 0 && ` (${sender.totalRatings})`}
              </span>
              {sender.city && <span>· 📍 {sender.city}</span>}
              {isVerified && <span className="text-emerald-600 font-semibold">· KYC ✓</span>}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {showDelete && (
              <button onClick={onDelete}
                className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 transition-colors">
                <Trash2 size={13} />
              </button>
            )}
            {isOwn && onFindMatch && parcel.status === 'open' && (
              <button onClick={() => authGate(() => onFindMatch())}
                className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1">
                <Zap size={11} /> Find Match
              </button>
            )}
            {!isOwn && (
              <button onClick={() => authGate(() => navigate(`/chat/${sender._id}`))}
                className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1">
                <MessageCircle size={11} /> Chat
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
