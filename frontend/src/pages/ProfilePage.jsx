import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Star, Phone, LogOut, ChevronRight, Package, Send, Shield, CheckCircle, Clock, XCircle, Camera, Lock, MapPin, History, AlertCircle } from 'lucide-react';
import KYCUploadModal from '../components/KYCUploadModal';
import CityInput from '../components/CityInput';

const KYC_CONFIG = {
  none:     { label: 'Not Verified',   cls: 'bg-stone-100 text-stone-500',   icon: <Shield size={11} /> },
  pending:  { label: 'Pending Review', cls: 'bg-amber-50 text-amber-600',    icon: <Clock size={11} /> },
  verified: { label: 'KYC Verified',   cls: 'bg-emerald-50 text-emerald-600', icon: <CheckCircle size={11} /> },
  rejected: { label: 'Rejected',       cls: 'bg-red-50 text-red-500',        icon: <XCircle size={11} /> },
};

const calcCompletion = (user) => {
  const checks = [
    !!user?.name?.trim(),
    !!user?.phone && !user?.phone?.startsWith('google_'),
    !!user?.profileImage,
    !!user?.city?.trim(),
    // KYC verified OR phone verified — either counts as trust-verified
    !!user?.isPhoneVerified || user?.kycStatus === 'verified',
  ];
  return Math.round((checks.filter(Boolean).length / 5) * 100);
};

export default function ProfilePage() {
  const { user, logout, setUser, refreshUser } = useAuth();
  const navigate = useNavigate();
  const photoRef = useRef(null);

  const currentPhone = user?.phone?.startsWith('google_') ? '' : (user?.phone?.replace('+91', '') || '');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    name:  user?.name  || '',
    phone: currentPhone,
    city:  user?.city  || '',
  });
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showKyc, setShowKyc] = useState(false);

  const cancelEdit = () => {
    setEditing(false);
    setDraft({ name: user?.name || '', phone: currentPhone, city: user?.city || '' });
  };

  // ── profile photo (one-time, locked after set) ─────────────────────────────
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
    } catch {
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  // ── save text fields ────────────────────────────────────────────────────────
  const saveProfile = async () => {
    if (!draft.name.trim()) { toast.error('Name cannot be empty'); return; }
    setSaving(true);
    const payload = {};
    if (draft.name.trim() !== user?.name)   payload.name = draft.name.trim();
    if (draft.city.trim() !== (user?.city || '')) payload.city = draft.city.trim();
    if (draft.phone && draft.phone.length === 10) {
      payload.phone = '+91' + draft.phone;
    }
    try {
      const { data } = await api.patch('/auth/me', payload);
      localStorage.setItem('kabootar_user', JSON.stringify(data.user));
      setUser(data.user);
      setEditing(false);
      toast.success('Profile saved!');
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error('Phone already registered to another account');
      } else {
        toast.error('Failed to save');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm('Log out of Kabutar?')) return;
    await logout();
    navigate('/login');
  };

  const initials    = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  const kycCfg      = KYC_CONFIG[user?.kycStatus || 'none'];
  const completion  = calcCompletion(user);
  const hasPhoto    = !!user?.profileImage;
  const hasCity     = !!user?.city?.trim();

  // Completion hint — priority order
  const isVerifiedAny = user?.isPhoneVerified || user?.kycStatus === 'verified';
  const completionHint = !hasPhoto
    ? '📸 Add a profile photo — users with photos get 3× more responses'
    : !hasCity
      ? '🏠 Add your hometown city to build trust with senders'
      : !isVerifiedAny
        ? '✅ Complete KYC verification to get your verified badge'
        : '🎉 Your profile is complete — you\'re visible to senders!';

  return (
    <div className="px-4 py-5">

      {/* ── Avatar card ─────────────────────────────────────── */}
      <div className="card p-5 text-center mb-4">

        {/* Avatar with upload / lock overlay */}
        <div className="relative w-20 h-20 mx-auto mb-3">
          <div className="w-20 h-20 rounded-full bg-orange-50 border-2 border-orange-100 overflow-hidden flex items-center justify-center font-bold text-2xl text-orange-500">
            {hasPhoto
              ? <img src={user.profileImage} alt="avatar" className="w-full h-full object-cover" />
              : uploadingPhoto
                ? <svg className="animate-spin h-6 w-6 text-orange-400" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                : initials}
          </div>
          {!hasPhoto && !uploadingPhoto && (
            <button onClick={() => photoRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center shadow-md transition-colors"
              title="Add profile photo">
              <Camera size={13} className="text-white" />
            </button>
          )}
          {hasPhoto && (
            <div className="absolute bottom-0 right-0 w-7 h-7 bg-stone-400 rounded-full flex items-center justify-center shadow-md" title="Profile photo is final">
              <Lock size={11} className="text-white" />
            </div>
          )}
          <input ref={photoRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handlePhotoPick} />
        </div>

        {!hasPhoto && !uploadingPhoto && (
          <p className="text-[11px] text-orange-500 font-semibold mb-2 -mt-1">Tap camera to add photo · once set, it's final</p>
        )}
        {uploadingPhoto && <p className="text-[11px] text-stone-400 mb-2 -mt-1">Uploading…</p>}

        {/* Edit form */}
        {editing ? (
          <div className="space-y-3 text-left mt-2">
            <Field label="Full name">
              <input className="input-field" value={draft.name}
                onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} autoFocus />
            </Field>

            <Field label="Hometown city">
              <CityInput
                value={draft.city}
                onChange={v => setDraft(d => ({ ...d, city: v }))}
                placeholder="e.g. Delhi, Mumbai…"
              />
              <p className="text-[11px] text-stone-400 mt-1">Shown on your profile to build trust with senders</p>
            </Field>

            <Field label="Phone number">
              <div className="flex gap-2 items-center">
                <span className="input-field w-14 text-center text-stone-600 shrink-0 flex items-center justify-center">+91</span>
                <input className="input-field flex-1" placeholder="9876543210"
                  value={draft.phone}
                  onChange={e => setDraft(d => ({ ...d, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  inputMode="numeric" maxLength={10} />
              </div>
              <p className="text-[11px] text-stone-400 mt-1">Changing phone resets verification status</p>
            </Field>

            <div className="flex gap-2 pt-1">
              <button onClick={saveProfile} disabled={saving} className="btn-primary flex-1">
                {saving ? '…' : 'Save'}
              </button>
              <button onClick={cancelEdit} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-bold text-stone-900">{user?.name}</h2>
            <button onClick={() => setEditing(true)} className="text-orange-500 text-xs font-semibold mt-1">
              Edit profile
            </button>
          </div>
        )}

        {/* Hometown city display */}
        <div className="flex items-center justify-center gap-1.5 mt-3">
          <MapPin size={13} className="text-stone-400" />
          {hasCity ? (
            <span className="text-stone-600 text-xs font-medium">{user.city}</span>
          ) : (
            <button onClick={() => setEditing(true)} className="text-orange-500 text-xs font-semibold">
              + Add hometown city
            </button>
          )}
        </div>

        {/* Phone display */}
        <div className="flex items-center justify-center gap-1.5 mt-1.5">
          <Phone size={13} className="text-stone-400" />
          <span className="text-stone-500 text-xs">
            {user?.maskedPhone || (
              <button onClick={() => setEditing(true)} className="text-orange-500 text-xs font-semibold">
                + Add phone number
              </button>
            )}
          </span>
        </div>

        {/* Phone verified badge — only for real (non-Google) phone numbers */}
        {user?.phone && !user.phone.startsWith('google_') && (
          <div className="flex justify-center mt-1.5">
            {user?.isPhoneVerified ? (
              <span className="badge bg-emerald-50 text-emerald-600 text-[11px]">
                <CheckCircle size={9} /> Phone Verified
              </span>
            ) : (
              <span className="badge bg-amber-50 text-amber-600 text-[11px]">
                <Clock size={9} /> Phone pending
              </span>
            )}
          </div>
        )}

        {/* KYC badge — explicit per-status rendering */}
        <div className="flex justify-center mt-3">
          {user?.kycStatus === 'verified' && (
            <button onClick={() => setShowKyc(true)}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-600 border-emerald-200 hover:opacity-80 transition-all">
              <CheckCircle size={9} /> KYC Verified
            </button>
          )}
          {user?.kycStatus === 'pending' && (
            <button onClick={() => setShowKyc(true)}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border bg-amber-50 text-amber-600 border-amber-200 hover:opacity-80 transition-all animate-pulse-soft">
              <Clock size={9} /> Verification pending
            </button>
          )}
          {user?.kycStatus === 'rejected' && (
            <button onClick={() => setShowKyc(true)}
              title={user?.kycRejectedReason || 'Document unclear'}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border bg-red-50 text-red-500 border-red-200 hover:opacity-80 transition-all">
              <AlertCircle size={9} /> Rejected — tap to resubmit
            </button>
          )}
          {(!user?.kycStatus || user?.kycStatus === 'none') && (
            <button onClick={() => setShowKyc(true)}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border bg-stone-100 text-stone-500 border-stone-200 hover:opacity-80 transition-all">
              <Shield size={9} /> Not verified
            </button>
          )}
        </div>
      </div>

      {/* ── Profile completion ───────────────────────────────── */}
      {completion < 100 && (
        <div className="card px-4 py-3 mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-stone-600">Profile completion</span>
            <span className="text-xs font-bold text-orange-500">{completion}%</span>
          </div>
          <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 rounded-full transition-all duration-300" style={{ width: `${completion}%` }} />
          </div>
          <p className="text-[11px] text-stone-400 mt-2">{completionHint}</p>
        </div>
      )}

      {/* ── Stats ───────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <StatBox label="Rating"   value={user?.rating?.toFixed(1) || '5.0'}
          icon={<Star size={14} className="text-amber-400 fill-amber-400" />} />
        <StatBox label="Reviews"  value={user?.totalRatings || 0} />
        <StatBox label="Member"   value={
          user?.createdAt
            ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
            : '–'
        } />
      </div>

      {/* ── Menu ────────────────────────────────────────────── */}
      <div className="card divide-y divide-stone-100 mb-4">
        <MenuItem icon={<Send    size={16} className="text-orange-400" />}  label="My Trips"         onClick={() => { navigate('/trips'); }} />
        <MenuItem icon={<History size={16} className="text-stone-400" />}   label="Travel History"   onClick={() => { navigate('/trips', { state: { tab: 'mine' } }); }} />
        <MenuItem icon={<Package size={16} className="text-blue-400" />}    label="My Parcels"       onClick={() => navigate('/my-parcels')} />
        <MenuItem icon={<Shield  size={16} className="text-emerald-400" />} label="KYC Verification" onClick={() => navigate('/kyc')} />
      </div>

      <button onClick={handleLogout}
        className="w-full card p-4 flex items-center justify-center gap-2 text-red-500 font-semibold text-sm hover:bg-red-50 transition-colors">
        <LogOut size={16} /> Log out
      </button>

      <p className="text-center text-xs text-stone-400 mt-6">🕊️ Kabutar v1.0.0 · Made with ♥</p>

      {showKyc && <KYCUploadModal onClose={() => setShowKyc(false)} onSuccess={() => refreshUser()} />}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-stone-600 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
function StatBox({ label, value, icon }) {
  return (
    <div className="card p-3 text-center">
      <div className="flex items-center justify-center gap-1">
        {icon}
        <span className="font-bold text-stone-900 text-base">{value}</span>
      </div>
      <div className="text-[11px] text-stone-400 mt-0.5">{label}</div>
    </div>
  );
}
function MenuItem({ icon, label, onClick }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-stone-50 transition-colors">
      {icon}
      <span className="flex-1 text-left text-sm font-medium text-stone-700">{label}</span>
      <ChevronRight size={16} className="text-stone-300" />
    </button>
  );
}
