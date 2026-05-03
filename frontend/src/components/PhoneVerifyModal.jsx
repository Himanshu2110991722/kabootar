import { useState, useRef, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { X, Phone, Shield, ArrowRight, ChevronLeft } from 'lucide-react';

// Props:
//   onClose()          — close the modal
//   onSuccess(user)    — called with updated user after verification
//   prefillPhone       — optional: pre-fill + skip to OTP (for "verify existing" flow)

export default function PhoneVerifyModal({ onClose, onSuccess, prefillPhone }) {
  const { setUser } = useAuth();
  const [step, setStep]         = useState(prefillPhone ? 'sending' : 'phone');
  const [phone, setPhone]       = useState(prefillPhone?.replace('+91', '') || '');
  const [otp, setOtp]           = useState(['', '', '', '', '', '']);
  const [loading, setLoading]   = useState(false);
  const [confirmResult, setConfirmResult] = useState(null);
  const otpRefs = useRef([]);
  const rcRef   = useRef(null); // recaptcha instance ref

  // If prefillPhone provided, auto-send OTP on mount
  useEffect(() => {
    if (prefillPhone) sendOtp(prefillPhone.replace('+91', ''));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setupRecaptcha = () => {
    if (!rcRef.current) {
      rcRef.current = new RecaptchaVerifier(
        auth,
        'recaptcha-phone-container',
        { size: 'invisible' }
      );
    }
    return rcRef.current;
  };

  const sendOtp = async (phoneDigits = phone) => {
    if (phoneDigits.length !== 10) { toast.error('Enter a valid 10-digit number'); return; }
    const fullPhone = `+91${phoneDigits}`;
    setLoading(true);
    try {
      const verifier = setupRecaptcha();
      const result   = await signInWithPhoneNumber(auth, fullPhone, verifier);
      setConfirmResult(result);
      setStep('otp');
      toast.success('OTP sent!');
    } catch (err) {
      toast.error(err.message || 'Failed to send OTP');
      rcRef.current = null; // reset so it can be re-created
    } finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    const code = otp.join('');
    if (code.length !== 6) { toast.error('Enter all 6 digits'); return; }
    setLoading(true);
    try {
      // Firebase confirms OTP — proves user owns the number
      await confirmResult.confirm(code);
      // Tell backend: set phone + isPhoneVerified = true
      const { data } = await api.post('/auth/me/phone', { phone: `+91${phone}` });
      localStorage.setItem('kabootar_user', JSON.stringify(data.user));
      setUser(data.user);
      toast.success('Phone verified! ✓');
      onSuccess?.(data.user);
      onClose();
    } catch (err) {
      if (err.code === 'auth/invalid-verification-code') {
        toast.error('Wrong OTP. Try again.');
      } else {
        toast.error(err.response?.data?.message || 'Verification failed');
      }
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally { setLoading(false); }
  };

  const resend = () => {
    rcRef.current = null;
    setOtp(['', '', '', '', '', '']);
    setStep('phone');
    setConfirmResult(null);
  };

  const handleDigit = (val, idx) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...otp]; next[idx] = digit; setOtp(next);
    if (digit && idx < 5) otpRefs.current[idx + 1]?.focus();
  };
  const handleKey = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Phone size={18} className="text-orange-500" />
            <h2 className="font-bold text-stone-900">
              {step === 'phone' ? 'Add Phone Number' : 'Verify OTP'}
            </h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 -mr-1.5"><X size={18} /></button>
        </div>

        <div className="px-5 py-5 space-y-4">

          {/* ── Step 1: Phone input ── */}
          {step === 'phone' && (
            <>
              <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 text-sm text-stone-600 leading-relaxed">
                📱 Add your phone number so senders can trust you. We'll verify it with a one-time SMS code.
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                  Indian mobile number
                </label>
                <div className="flex gap-2">
                  <div className="input-field w-14 text-center font-semibold text-stone-600 shrink-0 flex items-center justify-center select-none">
                    +91
                  </div>
                  <input
                    className="input-field flex-1"
                    placeholder="9876543210"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    onKeyDown={e => e.key === 'Enter' && sendOtp()}
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-stone-400 mt-1.5">
                  Must start with 6, 7, 8, or 9. Standard SMS rates apply.
                </p>
              </div>

              <button
                onClick={() => sendOtp()}
                disabled={loading || phone.length !== 10}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading
                  ? <>Sending…</>
                  : <><ArrowRight size={15} /> Send OTP</>}
              </button>
            </>
          )}

          {/* ── Step 1b: Sending OTP (prefill flow) ── */}
          {step === 'sending' && (
            <div className="py-6 text-center text-stone-400 text-sm">
              Sending OTP to +91 {phone}…
            </div>
          )}

          {/* ── Step 2: OTP input ── */}
          {step === 'otp' && (
            <>
              <div className="flex items-center gap-2 text-sm text-stone-600">
                <span>OTP sent to</span>
                <span className="font-semibold text-stone-900">+91 {phone}</span>
                <button
                  onClick={resend}
                  className="ml-auto text-orange-500 text-xs font-semibold flex items-center gap-0.5"
                >
                  <ChevronLeft size={12} /> Change
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-2">
                  Enter the 6-digit code
                </label>
                <div className="flex gap-2 justify-between">
                  {otp.map((d, i) => (
                    <input
                      key={i}
                      ref={el => (otpRefs.current[i] = el)}
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
              </div>

              <button
                onClick={verifyOtp}
                disabled={loading || otp.join('').length !== 6}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Shield size={15} />
                {loading ? 'Verifying…' : 'Verify & Save'}
              </button>

              <button onClick={resend} className="btn-secondary w-full text-sm">
                Didn't receive? Resend OTP
              </button>
            </>
          )}
        </div>

        {/* Invisible recaptcha container */}
        <div id="recaptcha-phone-container" />
      </div>
    </div>
  );
}
