import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, ChevronDown, ChevronUp, Camera, Trash2, Edit2, CheckCircle2, AlertTriangle } from 'lucide-react';
import ParcelStatusTimeline from '../components/ParcelStatusTimeline';
import OtpVerifyModal from '../components/OtpVerifyModal';
import PostParcelModal from '../components/PostParcelModal';

const ITEM_EMOJI = { documents: '📄', electronics: '📱', clothes: '👕', others: '📦' };

const STATUS_BADGE = {
  open:       'badge-green',
  matched:    'badge-blue',
  requested:  'badge-blue',
  accepted:   'badge-amber',
  picked:     'badge-orange',
  in_transit: 'badge-amber',
  delivered:  'badge-violet',
  completed:  'badge-green',
  cancelled:  'badge-stone',
};

const STATUS_LABEL = {
  open:       '🟢 Open',
  accepted:   '⚡ In Progress',
  picked:     '📤 Picked Up',
  in_transit: '🚚 In Transit',
  delivered:  '📦 Delivered — Confirm?',
  completed:  '✅ Completed',
  cancelled:  '❌ Cancelled',
};

export default function MyParcelsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [otpModal,      setOtpModal]      = useState(null);
  const [uploadingPhoto,setUploadingPhoto] = useState({});
  const [editingParcel, setEditingParcel]  = useState(null);

  useEffect(() => {
    api.get('/parcels/my')
      .then(r => setParcels(r.data.parcels))
      .catch(() => toast.error('Failed to load parcels'))
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  const isTraveler = (parcel) =>
    parcel.travelerId && (
      parcel.travelerId._id === user?._id || parcel.travelerId === user?._id
    );

  const uploadPhoto = async (parcelId, type, file) => {
    setUploadingPhoto(p => ({ ...p, [`${parcelId}-${type}`]: true }));
    try {
      const fd = new FormData();
      fd.append('photo', file);
      const { data } = await api.post(`/parcels/${parcelId}/${type}-photo`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setParcels(prev => prev.map(p => p._id === parcelId ? { ...p, ...data.parcel } : p));
      toast.success('Photo uploaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingPhoto(p => ({ ...p, [`${parcelId}-${type}`]: false }));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this parcel request?')) return;
    try {
      await api.delete(`/parcels/${id}`);
      setParcels(prev => prev.filter(p => p._id !== id));
      toast.success('Parcel request deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleEditSuccess = (updated) => {
    setParcels(prev => prev.map(p => p._id === updated._id ? { ...p, ...updated } : p));
    setEditingParcel(null);
    toast.success('Parcel updated!');
  };

  const handleOtpSuccess = (updated) => {
    setParcels(prev => prev.map(p => p._id === updated._id ? { ...p, ...updated } : p));
  };

  const [confirming, setConfirming] = useState({});
  const confirmReceipt = async (parcelId) => {
    if (!confirm('Confirm you have received this parcel? This will complete the delivery and update the traveller\'s count.')) return;
    setConfirming(c => ({ ...c, [parcelId]: true }));
    try {
      const { data } = await api.post(`/parcels/${parcelId}/confirm-receipt`);
      setParcels(prev => prev.map(p => p._id === parcelId ? { ...p, ...data.parcel } : p));
      toast.success('✅ Receipt confirmed! Traveller\'s delivery count updated.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to confirm');
    } finally {
      setConfirming(c => ({ ...c, [parcelId]: false }));
    }
  };

  if (loading) return (
    <div className="px-4 py-5 space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="card p-4 animate-pulse">
          <div className="h-4 bg-stone-100 rounded w-3/4 mb-2" />
          <div className="h-3 bg-stone-100 rounded w-1/2" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="px-4 py-5">
      <h1 className="text-xl font-bold text-stone-900 mb-4">My Parcels</h1>

      {parcels.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="text-3xl mb-2">📦</div>
          <p className="text-stone-500 text-sm">No parcels yet. Post a parcel or accept one as a traveler.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {parcels.map(parcel => {
            const asTraveler = isTraveler(parcel);
            const sender = parcel.userId;
            const traveler = parcel.travelerId;
            const isOpen = expanded[parcel._id];
            const uploadingP = uploadingPhoto[`${parcel._id}-pickup`];
            const uploadingD = uploadingPhoto[`${parcel._id}-delivery`];

            return (
              <div key={parcel._id} className="card p-4 space-y-3 animate-fade-in">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{ITEM_EMOJI[parcel.itemType] || '📦'}</span>
                    <div>
                      <div className="font-semibold text-stone-900 text-sm">
                        {parcel.fromCity} → {parcel.toCity}
                      </div>
                      {parcel.pickupStation && (
                        <div className="text-[11px] text-stone-400 mt-0.5">{parcel.pickupStation}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`badge text-[10px] ${STATUS_BADGE[parcel.status] || 'badge-stone'}`}>
                      {STATUS_LABEL[parcel.status] || parcel.status}
                    </span>
                    <span className={`badge text-[10px] ${asTraveler ? 'bg-purple-50 text-purple-600' : 'bg-sky-50 text-sky-600'}`}>
                      {asTraveler ? '✈️ Carrying' : '📤 Sending'}
                    </span>
                  </div>
                </div>

                {/* Meta */}
                <div className="flex gap-2 flex-wrap">
                  <span className="badge-orange">{parcel.weight} kg</span>
                  <span className="badge-stone text-[11px]">
                    {formatDistanceToNow(new Date(parcel.createdAt), { addSuffix: true })}
                  </span>
                  {parcel.offeredPrice && (
                    <span className="badge-green">₹{parcel.offeredPrice}</span>
                  )}
                </div>

                {/* Traveler actions */}
                {asTraveler && parcel.status === 'accepted' && (
                  <div className="space-y-2 pt-1">
                    {parcel.pickupPhotoUrl ? (
                      <img src={parcel.pickupPhotoUrl} alt="Pickup photo" className="w-full h-32 object-cover rounded-xl border border-stone-100" />
                    ) : (
                      <label className="flex items-center gap-2 btn-secondary w-full justify-center cursor-pointer">
                        <Camera size={14} />
                        {uploadingP ? 'Uploading…' : 'Upload Pickup Photo'}
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          disabled={uploadingP}
                          onChange={e => e.target.files[0] && uploadPhoto(parcel._id, 'pickup', e.target.files[0])}
                        />
                      </label>
                    )}
                    <button
                      onClick={() => setOtpModal({ parcel, type: 'pickup' })}
                      disabled={!parcel.pickupPhotoUrl}
                      className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                      🔐 Confirm Pickup (OTP)
                    </button>
                    {!parcel.pickupPhotoUrl && (
                      <p className="text-[11px] text-stone-400 text-center">Upload pickup photo first</p>
                    )}
                  </div>
                )}

                {asTraveler && parcel.status === 'picked' && (
                  <div className="space-y-2 pt-1">
                    {parcel.deliveryPhotoUrl ? (
                      <img src={parcel.deliveryPhotoUrl} alt="Delivery photo" className="w-full h-32 object-cover rounded-xl border border-stone-100" />
                    ) : (
                      <label className="flex items-center gap-2 btn-secondary w-full justify-center cursor-pointer">
                        <Camera size={14} />
                        {uploadingD ? 'Uploading…' : 'Upload Delivery Photo'}
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          disabled={uploadingD}
                          onChange={e => e.target.files[0] && uploadPhoto(parcel._id, 'delivery', e.target.files[0])}
                        />
                      </label>
                    )}
                    <button
                      onClick={() => setOtpModal({ parcel, type: 'delivery' })}
                      disabled={!parcel.deliveryPhotoUrl}
                      className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                      🔐 Confirm Delivery (OTP)
                    </button>
                    {!parcel.deliveryPhotoUrl && (
                      <p className="text-[11px] text-stone-400 text-center">Upload delivery photo first</p>
                    )}
                  </div>
                )}

                {/* Sender actions */}
                {!asTraveler && (
                  <div className="space-y-2">
                    {/* In-progress warning banner */}
                    {['accepted','picked','in_transit'].includes(parcel.status) && (
                      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                        <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-amber-700 leading-relaxed">
                          <strong>In Progress</strong> — This post is hidden from public listings.
                          {parcel.status === 'accepted' ? ' Traveller has accepted and will pick up soon.' : ''}
                          {parcel.status === 'picked' ? ' Traveller has picked up your parcel.' : ''}
                          {parcel.status === 'in_transit' ? ' Your parcel is on its way.' : ''}
                        </p>
                      </div>
                    )}

                    {/* Confirm Receipt — shown when traveller has verified delivery via OTP */}
                    {parcel.status === 'delivered' && (
                      <button
                        onClick={() => confirmReceipt(parcel._id)}
                        disabled={confirming[parcel._id]}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm text-white active:scale-[0.98] transition-all disabled:opacity-60"
                        style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 12px rgba(16,185,129,0.35)' }}>
                        <CheckCircle2 size={16} />
                        {confirming[parcel._id] ? 'Confirming…' : '✅ Confirm Parcel Received'}
                      </button>
                    )}

                    {parcel.status === 'delivered' && (
                      <p className="text-[11px] text-stone-400 text-center">
                        Confirming receipt completes the delivery and updates the traveller's count.
                      </p>
                    )}

                    {/* Completed state */}
                    {parcel.status === 'completed' && (
                      <div className="flex items-center justify-center gap-2 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        <p className="text-xs font-bold text-emerald-700">Delivery completed! Thank you for using Kabutar 🕊️</p>
                      </div>
                    )}

                    <div className="flex gap-2 flex-wrap">
                      {traveler && typeof traveler === 'object' && (
                        <button
                          onClick={() => navigate(`/chat/${traveler._id}`)}
                          className="btn-secondary flex items-center gap-1.5 text-sm py-1.5">
                          <MessageCircle size={13} /> Chat
                        </button>
                      )}
                      {parcel.status === 'open' && (
                        <button onClick={() => setEditingParcel(parcel)}
                          className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 flex items-center gap-1 text-xs font-semibold text-stone-600">
                          <Edit2 size={12} /> Edit
                        </button>
                      )}
                      {['open','cancelled'].includes(parcel.status) && (
                        <button onClick={() => handleDelete(parcel._id)}
                          className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-400">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Expand timeline */}
                <button
                  onClick={() => toggleExpand(parcel._id)}
                  className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 transition-colors w-full justify-center pt-1"
                >
                  {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {isOpen ? 'Hide' : 'Show'} timeline
                </button>

                {isOpen && (
                  <ParcelStatusTimeline
                    status={parcel.status}
                    acceptedAt={parcel.acceptedAt}
                    pickedAt={parcel.pickedAt}
                    deliveredAt={parcel.deliveredAt}
                    completedAt={parcel.completedAt}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {otpModal && (
        <OtpVerifyModal
          parcel={otpModal.parcel}
          type={otpModal.type}
          onClose={() => setOtpModal(null)}
          onSuccess={handleOtpSuccess}
        />
      )}

      {editingParcel && (
        <PostParcelModal
          initialData={editingParcel}
          parcelId={editingParcel._id}
          onClose={() => setEditingParcel(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
