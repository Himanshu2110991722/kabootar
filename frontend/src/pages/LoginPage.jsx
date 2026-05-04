import { useState, useRef } from 'react';
import { auth } from '../lib/firebase';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Phone, ArrowRight, ChevronLeft, Shield } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

// true when running as native Android/iOS app.
// Google signInWithPopup doesn't work in Android WebViews — hide it on native.
const isNativeApp = Capacitor.isNativePlatform();

const STEPS = { HOME: 'home', PHONE: 'phone', OTP: 'otp', NAME: 'name' };

export default function LoginPage() {
  const [step, setStep]               = useState(STEPS.HOME);
  const [phone, setPhone]             = useState('');
  const [otp, setOtp]                 = useState(['', '', '', '', '', '']);
  const [name, setName]               = useState('');
  const [loading, setLoading]         = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [confirmResult, setConfirmResult] = useState(null);
  const [idToken, setIdToken]         = useState(null);
  const otpRefs = useRef([]);
  const { login } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();

  const redirectAfterLogin = (res) => {
    if (res?.requiresProfileCompletion) {
      navigate('/complete-profile', { replace: true });
    } else {
      navigate(location.state?.from || '/', { replace: true });
    }
  };

  // ── Google Sign-In (web browser only, not available in Android WebView) ──────
  const signInWithGoogle = async () => {
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result   = await signInWithPopup(auth, provider);
      const token    = await result.user.getIdToken();
      setIdToken(token);
      const res = await login(token);
      if (res.success) {
        toast.success('Welcome! 🕊️');
        redirectAfterLogin(res);
      } else if (res.newUser) {
        setName(result.user.displayName || '');
        setStep(STEPS.NAME);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') toast.error('Google sign-in failed');
    } finally { setGoogleLoading(false); }
  };

  // ── Phone OTP ─────────────────────────────────────────────────────────────────
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth, 'recaptcha-container', { size: 'invisible' }
      );
    }
  };

  const sendOtp = async () => {
    const fullPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    if (fullPhone.replace(/\D/g, '').length < 10) { toast.error('Enter a valid phone number'); return; }
    setLoading(true);
    try {
      setupRecaptcha();
      const result = await signInWithPhoneNumber(auth, fullPhone, window.recaptchaVerifier);
      setConfirmResult(result);
      setStep(STEPS.OTP);
      toast.success('OTP sent!');
    } catch (err) {
      toast.error(err.message || 'Failed to send OTP');
      window.recaptchaVerifier = null;
    } finally { setLoading(false); }
  };

  // Core verify — accepts the OTP array directly so auto-submit works reliably
  const verifyOtpCode = async (otpArray) => {
    const code = otpArray.join('');
    if (code.length !== 6) return;
    setLoading(true);
    try {
      const result = await confirmResult.confirm(code);
      const token  = await result.user.getIdToken();
      setIdToken(token);
      const res = await login(token);
      if (res.success) { toast.success('Welcome back!'); redirectAfterLogin(res); }
      else if (res.newUser) setStep(STEPS.NAME);
      else toast.error(res.message);
    } catch { toast.error('Invalid OTP — please try again'); }
    finally { setLoading(false); }
  };

  const verifyOtp = () => verifyOtpCode(otp);

  const handleOtpChange = (val, idx) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next  = [...otp];
    next[idx]   = digit;
    setOtp(next);

    if (digit && idx < 5) {
      // Move focus to next box
      otpRefs.current[idx + 1]?.focus();
    } else if (digit && idx === 5) {
      // Last box filled — auto-submit after a brief paint delay
      const allFilled = next.every(d => d !== '');
      if (allFilled) {
        otpRefs.current[5]?.blur();
        setTimeout(() => verifyOtpCode(next), 120);
      }
    }
  };

  const handleOtpKey = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
  };

  const submitName = async () => {
    if (!name.trim() || name.trim().length < 2) { toast.error('Enter your full name'); return; }
    setLoading(true);
    const res = await login(idToken, name.trim());
    setLoading(false);
    if (res.success) { toast.success('Welcome to Kabutar! 🕊️'); redirectAfterLogin(res); }
    else toast.error(res.message);
  };

  // ── HOME step ─────────────────────────────────────────────────────────────────
  if (step === STEPS.HOME) {
    return (
      <div className="min-h-screen flex flex-col"
        style={{ background: 'linear-gradient(160deg, #f97316 0%, #ea580c 55%, #9a3412 100%)' }}>

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-12 w-56 h-56 rounded-full bg-white/10" />
          <div className="absolute top-1/3 -left-16 w-40 h-40 rounded-full bg-white/8" />
        </div>

        {/* Logo section */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10 pt-16">
          <div className="w-28 h-28 rounded-3xl overflow-hidden shadow-2xl mb-6 border-4 border-white/20">
            <img src="/logo.png" alt="Kabutar" className="w-full h-full object-cover"
              onError={e => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML =
                  '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:56px;background:rgba(255,255,255,0.15)">🕊️</div>';
              }}
            />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">kabutar</h1>
          <p className="text-orange-100 text-center text-sm font-medium leading-relaxed max-w-xs">
            Send parcels with trusted travelers.{'\n'}Save money. Earn by traveling.
          </p>
          <div className="flex gap-2 mt-8 flex-wrap justify-center">
            {['✅ OTP Verified', '⭐ Trust Ratings', '🔐 KYC Secured'].map(t => (
              <span key={t} className="bg-white/15 text-white text-[11px] font-semibold px-3 py-1.5 rounded-full">{t}</span>
            ))}
          </div>
        </div>

        {/* Auth buttons */}
        <div className="relative z-10 px-5 pb-10 pt-6"
          style={{ background: 'linear-gradient(to top, rgba(154,52,18,0.95) 0%, transparent 100%)' }}>

          {/* Google — only on web browser, NOT in Android app (WebView can't handle popup) */}
          {!isNativeApp && (
            <button onClick={signInWithGoogle} disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 bg-white rounded-2xl py-4 mb-3 font-semibold text-stone-800 text-sm shadow-lg active:scale-95 transition-all disabled:opacity-70">
              {googleLoading ? <Spinner /> : <><GoogleIcon /> Continue with Google</>}
            </button>
          )}

          {/* Phone OTP — works on both web and Android */}
          <button onClick={() => setStep(STEPS.PHONE)}
            className={`w-full flex items-center justify-center gap-3 rounded-2xl py-4 font-semibold text-sm active:scale-95 transition-all ${
              isNativeApp
                ? 'bg-white text-stone-800 shadow-lg'           // primary on Android
                : 'bg-white/15 border border-white/25 text-white backdrop-blur-sm'  // secondary on web
            }`}>
            <Phone size={17} className={isNativeApp ? 'text-orange-500' : ''} />
            Continue with Phone
          </button>

          {isNativeApp && (
            <p className="text-center text-white/50 text-[11px] mt-3">
              Use phone number to sign in securely
            </p>
          )}

          <p className="text-center text-white/50 text-[11px] mt-4">
            By continuing, you agree to our Terms &amp; Privacy Policy
          </p>
        </div>

        <div id="recaptcha-container" />
      </div>
    );
  }

  // ── PHONE / OTP / NAME steps ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 px-5 pt-12 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setStep(STEPS.HOME)}
            className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white">
            <ChevronLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-white text-lg">🕊️</span>
            <span className="font-bold text-white text-lg">kabutar</span>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white">
          {step === STEPS.PHONE ? 'Your number' : step === STEPS.OTP ? 'Enter OTP' : 'Your name'}
        </h2>
        <p className="text-orange-100 text-sm mt-1">
          {step === STEPS.PHONE ? "We'll send a one-time password via SMS" :
           step === STEPS.OTP   ? `Sent to +91 ${phone}` :
           'Help others know who you are'}
        </p>
      </div>

      <div className="flex-1 px-5 pt-6 space-y-4">

        {/* ── PHONE ── */}
        {step === STEPS.PHONE && (
          <>
            <div className="flex gap-2">
              <div className="w-16 bg-white border border-stone-200 rounded-xl flex items-center justify-center text-stone-600 font-semibold text-sm shadow-sm shrink-0">
                +91
              </div>
              <input className="input-field flex-1 text-lg font-semibold tracking-widest"
                placeholder="98765 43210"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                onKeyDown={e => e.key === 'Enter' && sendOtp()}
                type="tel" inputMode="numeric" autoFocus maxLength={10} />
            </div>
            <button className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base rounded-2xl"
              onClick={sendOtp} disabled={loading || phone.length < 10}>
              {loading ? <Spinner /> : <><span>Send OTP</span><ArrowRight size={17} /></>}
            </button>
          </>
        )}

        {/* ── OTP ── */}
        {step === STEPS.OTP && (
          <>
            <p className="text-xs text-stone-400 text-center">
              Enter the 6-digit code — it will verify automatically
            </p>

            {/* OTP boxes — flex-1 so they scale with screen width, gap-1.5 for tight fit */}
            <div className="flex gap-1.5 w-full">
              {otp.map((d, i) => (
                <input
                  key={i}
                  ref={el => (otpRefs.current[i] = el)}
                  className={`flex-1 min-w-0 aspect-square text-center font-bold border-2 rounded-xl outline-none transition-all bg-white shadow-sm
                    text-xl
                    ${d ? 'border-orange-400 bg-orange-50 text-orange-600' : 'border-stone-200 text-stone-900'}
                    ${loading ? 'opacity-50 pointer-events-none' : 'focus:border-orange-400 focus:ring-2 focus:ring-orange-100'}
                  `}
                  value={d}
                  onChange={e => handleOtpChange(e.target.value, i)}
                  onKeyDown={e => handleOtpKey(e, i)}
                  inputMode="numeric"
                  maxLength={1}
                  autoFocus={i === 0}
                  disabled={loading}
                />
              ))}
            </div>

            {/* Auto-submitting indicator */}
            {loading && (
              <div className="flex items-center justify-center gap-2 py-2">
                <Spinner />
                <span className="text-sm text-stone-500 font-medium">Verifying…</span>
              </div>
            )}

            {!loading && (
              <>
                <button className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base rounded-2xl"
                  onClick={verifyOtp} disabled={otp.join('').length !== 6}>
                  <Shield size={17} /> Verify OTP
                </button>
                <button onClick={() => { setStep(STEPS.PHONE); setOtp(['','','','','','']); }}
                  className="w-full text-center text-orange-500 text-sm font-semibold py-2">
                  Change number or resend
                </button>
              </>
            )}
          </>
        )}

        {/* ── NAME ── */}
        {step === STEPS.NAME && (
          <>
            <input className="input-field text-lg font-semibold py-4 rounded-2xl"
              placeholder="Your full name"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitName()}
              autoFocus />
            <button className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base rounded-2xl"
              onClick={submitName} disabled={loading}>
              {loading ? <Spinner /> : <><span>Get Started</span><ArrowRight size={17} /></>}
            </button>
          </>
        )}
      </div>

      <div id="recaptcha-container" />
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
    </svg>
  );
}
