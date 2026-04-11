import { useState, useRef } from "react";
import { auth } from "../lib/firebase";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Phone, ArrowRight, ChevronLeft, Shield } from "lucide-react";

const STEPS = { HOME: "home", PHONE: "phone", OTP: "otp", NAME: "name" };

export default function LoginPage() {
  const [step, setStep] = useState(STEPS.HOME);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [confirmResult, setConfirmResult] = useState(null);
  const [idToken, setIdToken] = useState(null);
  const otpRefs = useRef([]);
  const { login } = useAuth();
  const navigate = useNavigate();

  // ── Google Sign-In ──────────────────────────────────────────────────────────
  const signInWithGoogle = async () => {
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
      setIdToken(token);
      const res = await login(token);
      if (res.success) {
        toast.success("Welcome! 🕊️");
        navigate("/");
      } else if (res.newUser) {
        // Pre-fill name from Google profile
        setName(result.user.displayName || "");
        setStep(STEPS.NAME);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") {
        toast.error("Google sign-in failed");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // ── Phone OTP ───────────────────────────────────────────────────────────────
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth, "recaptcha-container", { size: "invisible" }
      );
    }
  };

  const sendOtp = async () => {
    const fullPhone = phone.startsWith("+") ? phone : `+91${phone}`;
    if (fullPhone.replace(/\D/g, "").length < 10) {
      toast.error("Enter a valid phone number"); return;
    }
    setLoading(true);
    try {
      setupRecaptcha();
      const result = await signInWithPhoneNumber(auth, fullPhone, window.recaptchaVerifier);
      setConfirmResult(result);
      setStep(STEPS.OTP);
      toast.success("OTP sent!");
    } catch (err) {
      toast.error(err.message || "Failed to send OTP");
      window.recaptchaVerifier = null;
    } finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    const code = otp.join("");
    if (code.length !== 6) { toast.error("Enter complete OTP"); return; }
    setLoading(true);
    try {
      const result = await confirmResult.confirm(code);
      const token = await result.user.getIdToken();
      setIdToken(token);
      const res = await login(token);
      if (res.success) { toast.success("Welcome back!"); navigate("/"); }
      else if (res.newUser) setStep(STEPS.NAME);
      else toast.error(res.message);
    } catch { toast.error("Invalid OTP"); }
    finally { setLoading(false); }
  };

  const submitName = async () => {
    if (!name.trim() || name.trim().length < 2) {
      toast.error("Enter your full name"); return;
    }
    setLoading(true);
    const res = await login(idToken, name.trim());
    setLoading(false);
    if (res.success) { toast.success("Welcome to Kabootar! 🕊️"); navigate("/"); }
    else toast.error(res.message);
  };

  const handleOtpChange = (val, idx) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    if (digit && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKey = (e, idx) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0)
      otpRefs.current[idx - 1]?.focus();
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Hero */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 px-6 pt-16 pb-12 text-white">
        <div className="text-5xl mb-3">🕊️</div>
        <h1 className="text-3xl font-bold tracking-tight">kabootar</h1>
        <p className="text-orange-100 mt-2 text-sm leading-relaxed">
          Send parcels with trusted travelers.<br />Save money. Go farther.
        </p>
      </div>

      <div className="flex-1 px-6 pt-8">

        {/* ── HOME: choose auth method ───────────────────────────── */}
        {step === STEPS.HOME && (
          <div className="animate-slide-up space-y-3">
            <h2 className="text-xl font-bold text-stone-900 mb-1">Get started</h2>
            <p className="text-stone-500 text-sm mb-6">Choose how you want to sign in</p>

            {/* Google */}
            <button
              onClick={signInWithGoogle}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 border border-stone-200 hover:border-stone-300 hover:bg-stone-50 rounded-xl py-3 transition-all font-semibold text-stone-700 text-sm active:scale-95"
            >
              {googleLoading ? (
                <Spinner />
              ) : (
                <>
                  <GoogleIcon />
                  Continue with Google
                </>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-stone-100" />
              <span className="text-xs text-stone-400">or</span>
              <div className="flex-1 h-px bg-stone-100" />
            </div>

            {/* Phone */}
            <button
              onClick={() => setStep(STEPS.PHONE)}
              className="w-full flex items-center justify-center gap-3 bg-orange-500 hover:bg-orange-600 rounded-xl py-3 transition-all font-semibold text-white text-sm active:scale-95"
            >
              <Phone size={16} />
              Continue with Phone
            </button>
          </div>
        )}

        {/* ── PHONE ─────────────────────────────────────────────── */}
        {step === STEPS.PHONE && (
          <div className="animate-slide-up">
            <BackBtn onClick={() => setStep(STEPS.HOME)} />
            <h2 className="text-xl font-bold text-stone-900 mb-1">Enter your number</h2>
            <p className="text-stone-500 text-sm mb-5">We'll send you a one-time password</p>
            <div className="flex gap-2 mb-4">
              <div className="input-field w-16 text-center font-semibold text-stone-600 shrink-0 flex items-center justify-center">+91</div>
              <input
                className="input-field flex-1"
                placeholder="98765 43210"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                onKeyDown={e => e.key === "Enter" && sendOtp()}
                type="tel"
                inputMode="numeric"
                autoFocus
              />
            </div>
            <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={sendOtp} disabled={loading}>
              {loading ? <Spinner /> : <><span>Send OTP</span><ArrowRight size={16} /></>}
            </button>
          </div>
        )}

        {/* ── OTP ───────────────────────────────────────────────── */}
        {step === STEPS.OTP && (
          <div className="animate-slide-up">
            <BackBtn onClick={() => setStep(STEPS.PHONE)} />
            <h2 className="text-xl font-bold text-stone-900 mb-1">Enter OTP</h2>
            <p className="text-stone-500 text-sm mb-5">
              Sent to +91 {phone}
              <button onClick={() => setStep(STEPS.PHONE)} className="text-orange-500 ml-2 font-semibold">Change</button>
            </p>
            <div className="flex gap-2 justify-between mb-5">
              {otp.map((d, i) => (
                <input
                  key={i}
                  ref={el => (otpRefs.current[i] = el)}
                  className="w-12 h-12 text-center text-lg font-bold border-2 border-stone-200 focus:border-orange-400 rounded-xl outline-none transition-colors"
                  value={d}
                  onChange={e => handleOtpChange(e.target.value, i)}
                  onKeyDown={e => handleOtpKey(e, i)}
                  inputMode="numeric"
                  maxLength={1}
                />
              ))}
            </div>
            <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={verifyOtp} disabled={loading}>
              {loading ? <Spinner /> : <><Shield size={16} /><span>Verify OTP</span></>}
            </button>
          </div>
        )}

        {/* ── NAME ──────────────────────────────────────────────── */}
        {step === STEPS.NAME && (
          <div className="animate-slide-up">
            <h2 className="text-xl font-bold text-stone-900 mb-1">What's your name?</h2>
            <p className="text-stone-500 text-sm mb-5">Help others know who you are</p>
            <input
              className="input-field mb-4"
              placeholder="Full name"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submitName()}
              autoFocus
            />
            <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={submitName} disabled={loading}>
              {loading ? <Spinner /> : <><span>Let's go</span><ArrowRight size={16} /></>}
            </button>
          </div>
        )}
      </div>

      <div id="recaptcha-container" />
      <p className="text-center text-xs text-stone-400 pb-8 px-6 mt-6">
        By continuing, you agree to our Terms & Privacy Policy
      </p>
    </div>
  );
}

function BackBtn({ onClick }) {
  return (
    <button onClick={onClick} className="btn-ghost -ml-2 mb-4 flex items-center gap-1 text-stone-500">
      <ChevronLeft size={16} /> Back
    </button>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
    </svg>
  );
}
