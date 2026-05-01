import { useState, useRef } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { X, Shield } from 'lucide-react';

export default function OtpVerifyModal({ parcel, type, onClose, onSuccess }) {
  const [step, setStep] = useState('generate');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [shaking, setShaking] = useState(false);
  const refs = useRef([]);

  const label = type === 'pickup' ? 'Pickup' : 'Delivery';

  const generate = async () => {
    setLoading(true);
    try {
      await api.post(`/otp/${type}/generate`, { parcelId: parcel._id });
      toast.success('OTP sent to sender\'s phone');
      setStep('verify');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    const code = otp.join('');
    if (code.length !== 6) { toast.error('Enter all 6 digits'); return; }
    setLoading(true);
    try {
      const { data } = await api.post(`/otp/${type}/verify`, { parcelId: parcel._id, otp: code });
      toast.success(`${label} confirmed!`);
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
    const next = [...otp];
    next[idx] = digit;
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

        <div className="px-5 py-6 space-y-5">
          {step === 'generate' ? (
            <>
              <p className="text-sm text-stone-600 leading-relaxed">
                Generate a one-time code and share it with the sender to confirm {type === 'pickup' ? 'you have received' : 'you have delivered'} the parcel.
              </p>
              <button onClick={generate} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? 'Sending…' : `Send OTP to Sender`}
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-stone-600">Enter the OTP received by the sender:</p>
              <div className={`flex gap-2 justify-between ${shaking ? 'animate-[shake_0.4s_ease]' : ''}`}>
                {otp.map((d, i) => (
                  <input
                    key={i}
                    ref={el => (refs.current[i] = el)}
                    className="w-11 h-12 text-center text-lg font-bold border-2 border-stone-200 focus:border-orange-400 rounded-xl outline-none transition-colors"
                    value={d}
                    onChange={e => handleDigit(e.target.value, i)}
                    onKeyDown={e => handleKey(e, i)}
                    inputMode="numeric"
                    maxLength={1}
                    autoFocus={i === 0}
                  />
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setStep('generate'); setOtp(['','','','','','']); }} className="btn-secondary flex-1">
                  Resend
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
