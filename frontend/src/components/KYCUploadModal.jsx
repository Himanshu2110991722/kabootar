import { useState } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { X, Upload, Camera, Shield } from 'lucide-react';

export default function KYCUploadModal({ onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);

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
      toast.success('Selfie uploaded! Under review now.');
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-orange-500" />
            <h2 className="font-bold text-stone-900">KYC Verification</h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 -mr-1.5"><X size={18} /></button>
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* Step pills */}
          <div className="flex gap-1">
            {[1, 2, 3].map(s => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-all ${step >= s ? 'bg-orange-500' : 'bg-stone-100'}`} />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-stone-600 font-semibold">Step 1 — Upload ID Document</p>
              <p className="text-xs text-stone-400">Aadhaar · PAN · Passport · Driving Licence</p>
              <label className={`flex flex-col items-center gap-3 border-2 border-dashed rounded-2xl p-8 cursor-pointer ${uploading ? 'opacity-60' : 'border-orange-200 hover:border-orange-400'}`}>
                <Upload size={24} className="text-orange-400" />
                <span className="text-sm font-medium text-stone-700">{uploading ? 'Uploading…' : 'Choose file'}</span>
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
              <p className="text-sm text-stone-600 font-semibold">Step 2 — Take a Selfie</p>
              <p className="text-xs text-stone-400">Face clearly visible, good lighting</p>
              <label className={`flex flex-col items-center gap-3 border-2 border-dashed rounded-2xl p-8 cursor-pointer ${uploading ? 'opacity-60' : 'border-blue-200 hover:border-blue-400'}`}>
                <Camera size={24} className="text-blue-400" />
                <span className="text-sm font-medium text-stone-700">{uploading ? 'Uploading…' : 'Open camera'}</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  disabled={uploading}
                  onChange={e => e.target.files[0] && uploadSelfie(e.target.files[0])}
                />
              </label>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-4 space-y-3">
              <div className="text-4xl">🎉</div>
              <p className="font-bold text-stone-900">Submitted for Review</p>
              <p className="text-sm text-stone-500">We'll verify within 24 hours.</p>
              <button onClick={() => { onSuccess?.(); onClose(); }} className="btn-primary w-full">Done</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
