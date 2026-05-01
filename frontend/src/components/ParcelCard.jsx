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
  const { user } = useAuth();
  const navigate = useNavigate();
  const authGate = useAuthGate();
  const sender = parcel.userId;
  const isOwn = sender?._id === user?._id || parcel.userId === user?._id;
  const isVerified = sender?.kycStatus === 'verified';

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
        <div className="flex items-center justify-between pt-1 border-t border-stone-50">
          <div className="flex items-center gap-2">
            <UserAvatar user={sender} />
            <div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-stone-700">{sender.name}</span>
                {isVerified && (
                  <CheckCircle size={11} className="text-emerald-500 fill-emerald-500" title="KYC Verified" />
                )}
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

          <div className="flex items-center gap-2">
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
