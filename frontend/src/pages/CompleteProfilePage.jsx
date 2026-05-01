import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Camera, Check } from 'lucide-react';

export default function CompleteProfilePage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState('');
  const [photoPreview, setPhotoPreview] = useState(user?.profileImage || null);
  const [photoFile, setPhotoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  // If profile is already complete, skip this page
  useEffect(() => {
    if (user?.isProfileComplete) navigate('/', { replace: true });
  }, [user, navigate]);

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const checks = [
    !!name.trim(),
    phone.length === 10,
    !!(photoPreview),
  ];
  const completedCount = checks.filter(Boolean).length;
  const canSubmit = checks.every(Boolean) && !saving;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      // Upload photo first if new file selected
      if (photoFile) {
        const fd = new FormData();
        fd.append('image', photoFile);
        await api.post('/auth/me/image', fd);
      }
      // Save name + phone
      await api.patch('/auth/me', { name: name.trim(), phone: `+91${phone}` });
      await refreshUser();
      toast.success('Profile complete! Welcome 🕊️');
      navigate('/', { replace: true });
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error('This phone is already registered to another account');
      } else if (err.response?.status === 400) {
        toast.error(err.response.data?.message || 'Invalid details');
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-4">
      {/* Hero strip */}
      <div className="w-full max-w-md bg-gradient-to-br from-orange-500 to-orange-600 rounded-t-2xl px-6 py-8 text-white text-center">
        <div className="text-4xl mb-2">🕊️</div>
        <h1 className="text-xl font-bold tracking-tight">Complete your profile</h1>
        <p className="text-orange-100 text-sm mt-1">Helps others trust you on kabutar</p>
      </div>

      <div className="bg-white rounded-b-2xl border border-stone-100 shadow-sm p-6 w-full max-w-md space-y-5">
        {/* Progress indicator */}
        <div className="flex gap-2">
          {['Name', 'Phone', 'Photo'].map((label, i) => (
            <div key={label} className="flex-1 flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                checks[i]
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : 'border-stone-200 text-stone-400'
              }`}>
                {checks[i] ? <Check size={13} /> : i + 1}
              </div>
              <span className={`text-[10px] font-medium ${checks[i] ? 'text-emerald-600' : 'text-stone-400'}`}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Photo upload — required */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative focus:outline-none group"
            aria-label="Upload profile photo"
          >
            <div className={`w-24 h-24 rounded-full overflow-hidden flex items-center justify-center border-4 transition-all ${
              photoPreview
                ? 'border-emerald-400'
                : 'border-dashed border-red-300 animate-pulse bg-red-50'
            }`}>
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <Camera size={24} className="text-red-400" />
                  <span className="text-[10px] font-semibold text-red-400">Required</span>
                </div>
              )}
            </div>
            <div className={`absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-colors ${
              photoPreview ? 'bg-emerald-500 group-hover:bg-emerald-600' : 'bg-red-500 group-hover:bg-red-600'
            }`}>
              <Camera size={14} className="text-white" />
            </div>
          </button>
          {!photoPreview ? (
            <p className="text-xs font-semibold text-red-500 mt-2">
              Profile photo is required
            </p>
          ) : (
            <p className="text-xs text-emerald-600 font-semibold mt-2">✓ Photo added</p>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={handlePhoto}
          />
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1.5">Full name</label>
          <input
            className="input-field"
            placeholder="Your name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1.5">Phone number</label>
          <div className="flex gap-2">
            <div className="input-field w-14 text-center font-semibold text-stone-600 shrink-0 flex items-center justify-center">
              +91
            </div>
            <input
              className="input-field flex-1"
              placeholder="9876543210"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              inputMode="numeric"
              maxLength={10}
            />
          </div>
          <p className="text-[11px] text-stone-400 mt-1.5">
            Your phone will be used to verify your identity
          </p>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Saving…
            </>
          ) : (
            `Save profile (${completedCount}/3)`
          )}
        </button>
      </div>
    </div>
  );
}
