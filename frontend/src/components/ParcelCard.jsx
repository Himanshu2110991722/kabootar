import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAuthGate } from '../hooks/useAuthGate';
import { formatDistanceToNow } from 'date-fns';
import { Weight, Trash2, MessageCircle, Star, Zap, CheckCircle } from 'lucide-react';

const ITEM_EMOJI = { documents: '📄', electronics: '📱', clothes: '👕', others: '📦' };

const STATUS_BADGE = {
  open: 'badge-green', matched: 'badge-blue', requested: 'badge-blue',
  accepted: 'badge-amber', picked: 'badge-orange', in_transit: 'badge-amber',
  delivered: 'badge-stone', cancelled: 'badge-stone',
};

function WAIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zm-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884zm8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

function shareToWA(text) {
  const encoded = encodeURIComponent(text);
  if (navigator.share) {
    navigator.share({ title: 'Kabutar', text }).catch(() => {});
  } else {
    window.open(`https://wa.me/?text=${encoded}`, '_blank', 'noopener');
  }
}

function UserAvatar({ user, size = 7, bgColor = 'bg-blue-50', textColor = 'text-blue-600' }) {
  const cls = `w-${size} h-${size} rounded-full overflow-hidden flex items-center justify-center font-bold text-xs ${bgColor} ${textColor} shrink-0`;
  return (
    <div className={cls}>
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
    const emoji   = ITEM_EMOJI[parcel.itemType] || '📦';
    const station = parcel.pickupStation ? `📍 ${parcel.pickupStation}\n` : '';
    const price   = parcel.offeredPrice ? `💰 Offering ₹${parcel.offeredPrice}\n` : '';
    const msg =
`🕊️ *Kabutar* — Parcel needs a carrier!

${emoji} ${parcel.fromCity} → ${parcel.toCity}
${station}⚖️ ${parcel.weight} kg · ${parcel.itemType}
${price}
Can you carry this? Chat &amp; earn 💸
https://app.kabutar.in`;
    shareToWA(msg);
  };

  return (
    <div className="card p-4 space-y-3 animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{ITEM_EMOJI[parcel.itemType] || '📦'}</span>
          <div>
            <div className="font-semibold text-stone-900 text-sm">{parcel.fromCity} → {parcel.toCity}</div>
            <div className="text-xs text-stone-500 mt-0.5 capitalize">{parcel.itemType}</div>
            {parcel.pickupStation && (
              <div className="text-[11px] text-stone-400 mt-0.5">📍 {parcel.pickupStation}</div>
            )}
          </div>
        </div>
        <span className={STATUS_BADGE[parcel.status] || 'badge-stone'}>{parcel.status}</span>
      </div>

      <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">{parcel.description}</p>

      <div className="flex flex-wrap gap-2">
        <span className="badge-orange"><Weight size={10} />{parcel.weight} kg</span>
        <span className="badge-stone text-[11px]">
          {formatDistanceToNow(new Date(parcel.createdAt), { addSuffix: true })}
        </span>
      </div>

      {sender && typeof sender === 'object' && (
        <div className="flex items-center justify-between pt-1 border-t border-stone-100">
          <div className="flex items-center gap-2">
            <UserAvatar user={sender} />
            <div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-stone-700">{sender.name}</span>
                {isVerified && <CheckCircle size={11} className="text-emerald-500 fill-emerald-500" title="KYC Verified" />}
              </div>
              <div className="flex items-center gap-0.5">
                <Star size={9} className="text-amber-400 fill-amber-400" />
                <span className="text-[11px] text-stone-400">{sender.rating?.toFixed(1)}</span>
                {sender.maskedPhone && (
                  <span className="text-[11px] text-stone-300 ml-1">{sender.maskedPhone}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* WhatsApp share — always visible */}
            <button
              onClick={handleShare}
              title="Share on WhatsApp"
              className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center text-green-600 hover:bg-green-100 active:scale-95 transition-all"
            >
              <WAIcon />
            </button>

            {showDelete && (
              <button onClick={onDelete} className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 transition-colors">
                <Trash2 size={14} />
              </button>
            )}
            {isOwn && onFindMatch && parcel.status === 'open' && (
              <button onClick={() => authGate(() => onFindMatch())} className="btn-primary py-1.5 flex items-center gap-1.5">
                <Zap size={13} /> Find Match
              </button>
            )}
            {!isOwn && (
              <button onClick={() => authGate(() => navigate(`/chat/${sender._id}`))} className="btn-primary py-1.5 flex items-center gap-1.5">
                <MessageCircle size={13} /> Chat
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
