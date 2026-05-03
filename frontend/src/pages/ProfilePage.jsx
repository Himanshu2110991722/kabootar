import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  Star, Phone, LogOut, ChevronRight, Package, Send,
  Shield, CheckCircle, Clock, Camera, Lock, MapPin,
  History, AlertCircle, Edit2, Pencil,
} from 'lucide-react';
import KYCUploadModal from '../components/KYCUploadModal';
import PhoneVerifyModal from '../components/PhoneVerifyModal';
import CityInput from '../components/CityInput';

const calcCompletion = (user) => {
  const checks = [
    !!user?.name?.trim(),
    !!user?.phone && !user?.phone?.startsWith('google_'),
    !!user?.profileImage,
    !!user?.city?.trim(),
    !!user?.isPhoneVerified || user?.kycStatus === 'verified',
  ];
  return Math.round((checks.filter(Boolean).length / 5) * 100);
};

export default function ProfilePage() {
  const { user, logout, setUser, refreshUser } = useAuth();
  const navigate  = useNavigate();
  const photoRef  = useRef(null);

  const currentPhone  = user?.phone?.startsWith('google_') ? '' : (user?.phone?.replace('+91', '') || '');
  const isGoogleUser  = user?.phone?.startsWith('google_');
  const hasRealPhone  = user?.phone && !isGoogleUser;
  const hasPhoto      = !!user?.profileImage;
  const hasCity       = !!user?.city?.trim();
  const completion    = calcCompletion(user);
  const initials      = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  const memberSince   = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : '';

  const [editing,        setEditing]        = useState(false);
  const [draft,          setDraft]          = useState({ name: user?.name || '', phone: currentPhone, city: user?.city || '' });
  const [saving,         setSaving]         = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showKyc,        setShowKyc]        = useState(false);
  const [showPhoneVerify,setShowPhoneVerify]= useState(false);

  const cancelEdit = () => {
    setEditing(false);
    setDraft({ name: user?.name || '', phone: currentPhone, city: user?.city || '' });
  };

  const handlePhotoPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { toast.error('Image must be under 4 MB'); return; }
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await api.post('/auth/me/image', fd);
      const updated = { ...user, profileImage: data.user.profileImage };
      localStorage.setItem('kabootar_user', JSON.stringify(updated));
      setUser(updated);
      toast.success('Profile photo saved!');
    } catch { toast.error('Failed to upload photo'); }
    finally { setUploadingPhoto(false); e.target.value = ''; }
  };

  const saveProfile = async () => {
    if (!draft.name.trim()) { toast.error('Name cannot be empty'); return; }
    setSaving(true);
    const payload = {};
    if (draft.name.trim() !== user?.name)        payload.name  = draft.name.trim();
    if (draft.city.trim() !== (user?.city || '')) payload.city  = draft.city.trim();
    if (draft.phone && draft.phone.length === 10) payload.phone = '+91' + draft.phone;
    try {
      const { data } = await api.patch('/auth/me', payload);
      localStorage.setItem('kabootar_user', JSON.stringify(data.user));
      setUser(data.user);
      setEditing(false);
      toast.success('Profile saved!');
    } catch (err) {
      toast.error(err.response?.status === 409 ? 'Phone already registered to another account' : 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleLogout = async () => {
    if (!confirm('Log out of Kabutar?')) return;
    await logout();
    navigate('/login');
  };

  return (
    <div className="pb-8">

      {/* ── HERO: gradient banner + overlapping avatar ─────────── */}
      <div className="relative mb-14">
        {/* Banner */}
        <div className="h-28 bg-gradient-to-br from-orange-500 via-orange-400 to-violet-500 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
          <div className="absolute right-6 top-10 w-16 h-16 rounded-full bg-white/10" />
          <div className="absolute -left-4 top-4 w-20 h-20 rounded-full bg-white/10" />
        </div>

        {/* Avatar — overlaps banner */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-12">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-orange-50 flex items-center justify-center font-bold text-2xl text-orange-500">
              {hasPhoto
                ? <img src={user.profileImage} alt="avatar" className="w-full h-full object-cover" />
                : uploadingPhoto
                  ? <svg className="animate-spin h-7 w-7 text-orange-400" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                  : initials}
            </div>
            {!hasPhoto && !uploadingPhoto && (
              <button onClick={() => photoRef.current?.click()}
                className="absolute bottom-0.5 right-0.5 w-7 h-7 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center shadow-md border-2 border-white transition-colors">
                <Camera size={13} className="text-white" />
              </button>
            )}
            {hasPhoto && (
              <div className="absolute bottom-0.5 right-0.5 w-7 h-7 bg-stone-400 rounded-full flex items-center justify-center shadow-md border-2 border-white" title="Photo locked">
                <Lock size={11} className="text-white" />
              </div>
            )}
            <input ref={photoRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handlePhotoPick} />
          </div>
        </div>
      </div>

      {/* ── Name + badges ─────────────────────────────────────── */}
      <div className="text-center px-4 mb-4">
        <h2 className="text-xl font-bold text-stone-900">{user?.name}</h2>
        {memberSince && <p className="text-[11px] text-stone-400 mt-0.5">Member since {memberSince}</p>}

        {/* Verification badges row */}
        <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
          {user?.isPhoneVerified && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle size={9} /> Phone Verified
            </span>
          )}
          {user?.kycStatus === 'verified' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <Shield size={9} /> KYC Verified
            </span>
          )}
          {user?.kycStatus === 'pending' && (
            <button onClick={() => setShowKyc(true)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse-soft">
              <Clock size={9} /> Under Review
            </button>
          )}
          {(!user?.kycStatus || user?.kycStatus === 'none') && (
            <button onClick={() => setShowKyc(true)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-500 border border-stone-200 hover:border-orange-300 hover:text-orange-600 transition-colors">
              <Shield size={9} /> Get KYC Verified
            </button>
          )}
          {user?.kycStatus === 'rejected' && (
            <button onClick={() => setShowKyc(true)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">
              <AlertCircle size={9} /> Rejected — resubmit
            </button>
          )}
        </div>
      </div>

      {/* ── Stats strip ───────────────────────────────────────── */}
      <div className="mx-4 card mb-4 overflow-hidden">
        <div className="grid grid-cols-3 divide-x divide-stone-100">
          <div className="py-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <Star size={13} className="text-amber-400 fill-amber-400" />
              <span className="font-bold text-stone-900 text-base">{user?.rating?.toFixed(1) || '5.0'}</span>
            </div>
            <div className="text-[10px] text-stone-400 mt-0.5">Rating</div>
          </div>
          <div className="py-3 text-center">
            <div className="font-bold text-stone-900 text-base">{user?.totalRatings || 0}</div>
            <div className="text-[10px] text-stone-400 mt-0.5">Reviews</div>
          </div>
          <div className="py-3 text-center">
            <div className="font-bold text-stone-900 text-base">{user?.tripsCompleted || 0}</div>
            <div className="text-[10px] text-stone-400 mt-0.5">Deliveries</div>
          </div>
        </div>
      </div>

      {/* ── Personal Info card ────────────────────────────────── */}
      <div className="mx-4 card mb-4 overflow-hidden">
        {/* Header row */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 bg-stone-50/50">
          <span className="text-xs font-bold text-stone-600 uppercase tracking-wide">Personal Info</span>
          {!editing ? (
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-1 text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors">
              <Pencil size={12} /> Edit
            </button>
          ) : (
            <button onClick={cancelEdit} className="text-xs font-semibold text-stone-400">Cancel</button>
          )}
        </div>

        {editing ? (
          /* ── Edit form ── */
          <div className="px-4 py-4 space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wide mb-1.5">Full Name</label>
              <input className="input-field" value={draft.name}
                onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} autoFocus />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wide mb-1.5">Hometown City</label>
              <CityInput value={draft.city} onChange={v => setDraft(d => ({ ...d, city: v }))} placeholder="e.g. Delhi, Mumbai…" />
              <p className="text-[10px] text-stone-400 mt-1">Builds trust with senders</p>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wide mb-1.5">Phone Number</label>
              <div className="flex gap-2">
                <span className="input-field w-14 text-center text-stone-600 shrink-0 flex items-center justify-center text-sm font-semibold">+91</span>
                <input className="input-field flex-1" placeholder="9876543210"
                  value={draft.phone}
                  onChange={e => setDraft(d => ({ ...d, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  inputMode="numeric" maxLength={10} />
              </div>
              <p className="text-[10px] text-stone-400 mt-1">Changing phone resets verification</p>
            </div>
            <button onClick={saveProfile} disabled={saving} className="btn-primary w-full">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        ) : (
          /* ── Display rows ── */
          <div className="divide-y divide-stone-50">
            {/* Name */}
            <InfoRow icon={<Edit2 size={15} className="text-stone-400" />} label="Display Name" value={user?.name} />

            {/* City */}
            <div className="flex items-center gap-3 px-4 py-3">
              <MapPin size={15} className="text-stone-400 shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] text-stone-400 uppercase tracking-wide mb-0.5">Hometown</p>
                <p className="text-sm text-stone-800 font-medium">{hasCity ? user.city : '—'}</p>
              </div>
              {!hasCity && (
                <button onClick={() => setEditing(true)} className="text-[11px] font-semibold text-orange-500">+ Add</button>
              )}
            </div>

            {/* Phone */}
            <div className="flex items-center gap-3 px-4 py-3">
              <Phone size={15} className="text-stone-400 shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] text-stone-400 uppercase tracking-wide mb-0.5">Phone</p>
                {hasRealPhone ? (
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-stone-800 font-medium">{user.maskedPhone}</p>
                    {user?.isPhoneVerified
                      ? <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5"><CheckCircle size={9} /> Verified</span>
                      : <button onClick={() => setShowPhoneVerify(true)}
                          className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5 hover:underline">
                          <Clock size={9} /> Verify now
                        </button>
                    }
                  </div>
                ) : (
                  <button onClick={() => setShowPhoneVerify(true)}
                    className="text-sm text-orange-500 font-semibold hover:text-orange-600 transition-colors">
                    + Add & verify phone
                  </button>
                )}
              </div>
            </div>

            {/* KYC */}
            <div className="flex items-center gap-3 px-4 py-3">
              <Shield size={15} className="text-stone-400 shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] text-stone-400 uppercase tracking-wide mb-0.5">Identity Verification</p>
                <p className="text-sm font-medium">
                  {user?.kycStatus === 'verified' && <span className="text-emerald-600">✓ KYC Verified</span>}
                  {user?.kycStatus === 'pending'  && <span className="text-amber-600">Under review…</span>}
                  {user?.kycStatus === 'rejected' && <span className="text-red-500">Rejected — resubmit</span>}
                  {(!user?.kycStatus || user?.kycStatus === 'none') && <span className="text-stone-400">Not verified</span>}
                </p>
              </div>
              <button onClick={() => setShowKyc(true)}
                className="text-[11px] font-semibold text-orange-500 hover:text-orange-600">
                {user?.kycStatus === 'verified' ? 'View' : user?.kycStatus === 'pending' ? 'View' : '+ Verify'}
              </button>
            </div>
          </div>
        )}

        {/* Profile completion strip at bottom of info card */}
        {completion < 100 && !editing && (
          <div className="px-4 py-2.5 bg-orange-50 border-t border-orange-100">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex-1 h-1.5 bg-orange-100 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${completion}%` }} />
              </div>
              <span className="text-[10px] font-bold text-orange-600 shrink-0">{completion}%</span>
            </div>
            <p className="text-[10px] text-orange-600">
              {!hasPhoto ? '📸 Add a profile photo to get 3× more responses'
                : !hasCity ? '🏠 Add your hometown to build trust with senders'
                : '✅ Complete KYC to get your verified badge'}
            </p>
          </div>
        )}
      </div>

      {/* ── Navigation menu ───────────────────────────────────── */}
      <div className="mx-4 card divide-y divide-stone-100 mb-4 overflow-hidden">
        <MenuItem icon={<Send    size={16} className="text-orange-500" />} label="My Trips"
          sub="Manage your posted trips"  onClick={() => navigate('/trips')} />
        <MenuItem icon={<History size={16} className="text-violet-500" />} label="Travel History"
          sub="Past trips & completed routes" onClick={() => navigate('/trips', { state: { tab: 'mine' } })} />
        <MenuItem icon={<Package size={16} className="text-blue-500" />}   label="My Parcels"
          sub="Parcels sent & received"  onClick={() => navigate('/my-parcels')} />
        <MenuItem icon={<Shield  size={16} className="text-emerald-500" />} label="KYC Verification"
          sub={user?.kycStatus === 'verified' ? 'Identity verified ✓' : 'Verify your identity'}
          onClick={() => navigate('/kyc')} />
      </div>

      {/* ── Logout ────────────────────────────────────────────── */}
      <div className="mx-4">
        <button onClick={handleLogout}
          className="w-full py-3.5 rounded-2xl border border-red-200 bg-red-50 text-red-500 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-red-100 transition-colors active:scale-95">
          <LogOut size={16} /> Sign out
        </button>
        <p className="text-center text-[11px] text-stone-400 mt-4">🕊️ Kabutar v1.0.0 · Made with ♥ in India</p>
      </div>

      {showKyc && <KYCUploadModal onClose={() => setShowKyc(false)} onSuccess={() => refreshUser()} />}
      {showPhoneVerify && (
        <PhoneVerifyModal
          onClose={() => setShowPhoneVerify(false)}
          onSuccess={(updated) => {
            setShowPhoneVerify(false);
            setDraft(d => ({ ...d, phone: updated.phone?.replace('+91', '') || '' }));
          }}
          prefillPhone={hasRealPhone && !user?.isPhoneVerified ? user.phone : undefined}
        />
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="shrink-0">{icon}</span>
      <div className="flex-1">
        <p className="text-[10px] text-stone-400 uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-sm text-stone-800 font-medium">{value || '—'}</p>
      </div>
    </div>
  );
}

function MenuItem({ icon, label, sub, onClick }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-stone-50 active:bg-stone-100 transition-colors">
      <div className="w-8 h-8 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 text-left">
        <div className="text-sm font-semibold text-stone-800">{label}</div>
        {sub && <div className="text-[11px] text-stone-400 mt-0.5">{sub}</div>}
      </div>
      <ChevronRight size={15} className="text-stone-300" />
    </button>
  );
}
