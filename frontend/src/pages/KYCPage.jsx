import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { ChevronLeft, Upload, Camera, CheckCircle, Clock, XCircle, Shield } from 'lucide-react';
import { format } from 'date-fns';

export default function KYCPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.get('/kyc/status')
      .then(r => setStatus(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const uploadDoc = async (file) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('document', file);
      await api.post('/kyc/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Document uploaded!');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const uploadSelfie = async (file) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('selfie', file);
      await api.post('/kyc/selfie', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Selfie uploaded!');
      setStep(3);
      setStatus(s => ({ ...s, kycStatus: 'pending', kycSubmittedAt: new Date().toISOString() }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return (
    <div className="px-4 py-5 animate-pulse space-y-3">
      <div className="h-6 bg-stone-100 rounded w-1/2" />
      <div className="h-32 bg-stone-100 rounded-2xl" />
    </div>
  );

  const kycStatus = status?.kycStatus || 'none';

  return (
    <div className="px-4 py-5 space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => navigate(-1)} className="btn-ghost p-1.5 -ml-1.5">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-stone-900">KYC Verification</h1>
      </div>

      {/* Status card */}
      <StatusCard kycStatus={kycStatus} kycSubmittedAt={status?.kycSubmittedAt} />

      {/* Wizard — only show if not verified */}
      {kycStatus !== 'verified' && (
        <div className="card p-5 space-y-5">
          {/* Step indicators */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                  step > s ? 'bg-emerald-500 border-emerald-500 text-white' :
                  step === s ? 'bg-orange-500 border-orange-500 text-white' :
                  'border-stone-200 text-stone-400'
                }`}>
                  {step > s ? '✓' : s}
                </div>
                {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-emerald-300' : 'bg-stone-100'}`} />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-stone-900 mb-1">Upload ID Document</h3>
                <p className="text-xs text-stone-500">Accepted: Aadhaar Card, PAN Card, Passport, Driving Licence</p>
              </div>
              <label className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-all ${uploading ? 'border-stone-200 opacity-60' : 'border-orange-200 hover:border-orange-400 hover:bg-orange-50'}`}>
                <Upload size={28} className="text-orange-400" />
                <div className="text-center">
                  <div className="text-sm font-semibold text-stone-700">{uploading ? 'Uploading…' : 'Tap to upload'}</div>
                  <div className="text-xs text-stone-400 mt-0.5">JPG, PNG or PDF · Max 5MB</div>
                </div>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  disabled={uploading}
                  onChange={e => e.target.files[0] && uploadDoc(e.target.files[0])}
                />
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-stone-900 mb-1">Take a Selfie</h3>
                <p className="text-xs text-stone-500">A clear photo of your face matching your ID document</p>
              </div>
              <label className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-all ${uploading ? 'border-stone-200 opacity-60' : 'border-blue-200 hover:border-blue-400 hover:bg-blue-50'}`}>
                <Camera size={28} className="text-blue-400" />
                <div className="text-center">
                  <div className="text-sm font-semibold text-stone-700">{uploading ? 'Uploading…' : 'Tap to take selfie'}</div>
                  <div className="text-xs text-stone-400 mt-0.5">Make sure your face is clearly visible</div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  disabled={uploading}
                  onChange={e => e.target.files[0] && uploadSelfie(e.target.files[0])}
                />
              </label>
              <button onClick={() => setStep(1)} className="btn-ghost w-full text-sm">← Back</button>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-3 py-4">
              <div className="text-5xl">🎉</div>
              <h3 className="font-bold text-stone-900">Documents Submitted!</h3>
              <p className="text-sm text-stone-500">We'll review your KYC within 24 hours. You'll be notified once verified.</p>
              <button onClick={() => navigate(-1)} className="btn-primary w-full">Done</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusCard({ kycStatus, kycSubmittedAt }) {
  const configs = {
    none: { icon: <Shield size={20} className="text-stone-400" />, bg: 'bg-stone-50 border-stone-200', title: 'Not Verified', desc: 'Complete KYC to build trust with other users.' },
    pending: { icon: <Clock size={20} className="text-amber-500" />, bg: 'bg-amber-50 border-amber-200', title: 'Under Review', desc: kycSubmittedAt ? `Submitted ${format(new Date(kycSubmittedAt), 'dd MMM yyyy')} · usually takes 24h` : 'Your documents are being reviewed.' },
    verified: { icon: <CheckCircle size={20} className="text-emerald-500" />, bg: 'bg-emerald-50 border-emerald-200', title: 'KYC Verified ✓', desc: 'Your identity has been verified. Users can trust you more.' },
    rejected: { icon: <XCircle size={20} className="text-red-500" />, bg: 'bg-red-50 border-red-200', title: 'Verification Rejected', desc: 'Your documents were not accepted. Please resubmit with clearer photos.' },
  };

  const cfg = configs[kycStatus] || configs.none;

  return (
    <div className={`card p-4 flex items-start gap-3 border ${cfg.bg}`}>
      <div className="mt-0.5">{cfg.icon}</div>
      <div>
        <div className="font-semibold text-stone-900 text-sm">{cfg.title}</div>
        <div className="text-xs text-stone-500 mt-0.5">{cfg.desc}</div>
      </div>
    </div>
  );
}
