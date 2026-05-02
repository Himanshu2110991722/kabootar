import { useState, useRef } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { X, Shield, Copy, Check } from 'lucide-react';

export default function OtpVerifyModal({ parcel, type, onClose, onSuccess }) {
  const [step, setStep]       = useState('generate');
  const [otp, setOtp]         = useState(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState(''); // shown to traveler in MVP
  const [loading, setLoading] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [copied, setCopied]   = useState(false);
  const refs = useRef([]);

  const label = type === 'pickup' ? 'Pickup' : 'Delivery';

  const generate = async () => {
    setLoading(true);
    try {
      const { data } = await api.post(`/otp/${type}/generate`, { parcelId: parcel._id });
      // In production this OTP is SMS'd to the sender.
      // For MVP (no SMS): show it here so traveler can relay it verbally.
      setGeneratedOtp(data.otp || '');
      setStep('verify');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate OTP');
    } finally {
      setLoading(false);
    }
  };

  const copyOtp = () => {
    navigator.clipboard.writeText(generatedOtp).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Auto-fill the input boxes if OTP is shown (dev convenience)
  const autoFill = () => {
    if (!generatedOtp) return;
    const digits = generatedOtp.split('');
    setOtp(digits);
  };

  const verify = async () => {
    const code = otp.join('');
    if (code.length !== 6) { toast.error('Enter all 6 digits'); return; }
    setLoading(true);
    try {
      const { data } = await api.post(`/otp/${type}/verify`, { parcelId: parcel._id, otp: code });
      toast.success(`${label} confirmed! ✓`);
      onSuccess(data.parcel);
      onClose();
    } catch (err) {
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      setOtp(['', '', '', '', '', '']);
      refs.current[0]?.focus();
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleDigit = (val, idx) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...otp]; next[idx] = digit;
    setOtp(next);
    if (digit && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handleKey = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) refs.current[idx - 1]?.focus();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-orange-500" />
            <h2 className="font-bold text-stone-900">Confirm {label}</h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 -mr-1.5"><X size={18} /></button>
        </div>

        <div className="px-5 py-5 space-y-4">
          {step === 'generate' ? (
            <>
              {/* How it works */}
              <div className="bg-stone-50 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-stone-700">How {label} OTP works:</p>
                <ol className="space-y-1.5">
                  {[
                    `Tap "Generate OTP" below`,
                    `A 6-digit code is created`,
                    `Share it verbally with the ${type === 'pickup' ? 'sender at the station' : 'receiver at their door'}`,
                    `They read it back to you — enter it to confirm`,
                  ].map((s, i) => (
                    <li key={i} className="text-xs text-stone-500 flex gap-2">
                      <span className="text-orange-500 font-bold shrink-0">{i + 1}.</span> {s}
                    </li>
                  ))}
                </ol>
              </div>
              <button onClick={generate} disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? 'Generating…' : `🔐 Generate ${label} OTP`}
              </button>
            </>
          ) : (
            <>
              {/* Show the OTP to traveler (MVP — no SMS yet) */}
              {generatedOtp && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <p className="text-[11px] text-orange-600 font-semibold mb-2 uppercase tracking-wide">
                    Your OTP — share this with the {type === 'pickup' ? 'sender' : 'receiver'}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      {generatedOtp.split('').map((d, i) => (
                        <div key={i} className="w-9 h-10 bg-white border-2 border-orange-300 rounded-lg flex items-center justify-center font-bold text-lg text-orange-600">
                          {d}
                        </div>
                      ))}
                    </div>
                    <button onClick={copyOtp}
                      className="ml-auto flex items-center gap-1 text-xs font-semibold text-orange-500 hover:text-orange-700">
                      {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                    </button>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-2">
                    Ask the {type === 'pickup' ? 'sender' : 'receiver'} to read this back, then enter it below.
                  </p>
                </div>
              )}

              {/* OTP entry */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-stone-700">
                    Enter the OTP to confirm {label.toLowerCase()}:
                  </p>
                  {generatedOtp && (
                    <button onClick={autoFill}
                      className="text-[11px] text-orange-500 font-semibold hover:underline">
                      Auto-fill
                    </button>
                  )}
                </div>
                <div className={`flex gap-2 justify-between ${shaking ? 'animate-bounce' : ''}`}>
                  {otp.map((d, i) => (
                    <input key={i} ref={el => (refs.current[i] = el)}
                      className="w-11 h-12 text-center text-lg font-bold border-2 border-stone-200 focus:border-orange-400 rounded-xl outline-none transition-colors"
                      value={d}
                      onChange={e => handleDigit(e.target.value, i)}
                      onKeyDown={e => handleKey(e, i)}
                      inputMode="numeric" maxLength={1}
                      autoFocus={i === 0}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => { setStep('generate'); setOtp(['','','','','','']); setGeneratedOtp(''); }}
                  className="btn-secondary flex-1">
                  Regenerate
                </button>
                <button onClick={verify} disabled={loading} className="btn-primary flex-1">
                  {loading ? 'Verifying…' : `Confirm ${label}`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
