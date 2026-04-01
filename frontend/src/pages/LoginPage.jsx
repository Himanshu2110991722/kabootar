import { useState, useRef } from "react";
import { auth } from "../lib/firebase";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Phone, Shield, ArrowRight, ChevronLeft } from "lucide-react";

const STEPS = { PHONE: "phone", OTP: "otp", NAME: "name" };

export default function LoginPage() {
  const [step, setStep] = useState(STEPS.PHONE);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmResult, setConfirmResult] = useState(null);
  const [idToken, setIdToken] = useState(null);
  const otpRefs = useRef([]);
  const { login } = useAuth();
  const navigate = useNavigate();

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        { size: "invisible" }
      );
    }
  };

  const sendOtp = async () => {
    const fullPhone = phone.startsWith("+") ? phone : `+91${phone}`;
    if (fullPhone.replace(/\D/g, "").length < 10) {
      toast.error("Enter a valid phone number");
      return;
    }
    setLoading(true);
    try {
      setupRecaptcha();
      const result = await signInWithPhoneNumber(
        auth,
        fullPhone,
        window.recaptchaVerifier
      );
      setConfirmResult(result);
      setStep(STEPS.OTP);
      toast.success("OTP sent!");
    } catch (err) {
      toast.error(err.message || "Failed to send OTP");
      window.recaptchaVerifier = null;
    } finally {
      setLoading(false);
    }
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
      if (res.success) {
        toast.success("Welcome back!");
        navigate("/");
      } else if (res.newUser) {
        setStep(STEPS.NAME);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error("Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const submitName = async () => {
    if (!name.trim() || name.trim().length < 2) {
      toast.error("Enter your full name");
      return;
    }
    setLoading(true);
    const res = await login(idToken, name.trim());
    setLoading(false);
    if (res.success) {
      toast.success("Welcome to Kabootar! 🕊️");
      navigate("/");
    } else {
      toast.error(res.message);
    }
  };

  const handleOtpChange = (val, idx) => {
    const digits = val.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[idx] = digits;
    setOtp(next);
    if (digits && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKey = (e, idx) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Hero */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 px-6 pt-16 pb-12 text-white">
        <div className="text-4xl mb-3">🕊️</div>
        <h1 className="text-3xl font-bold tracking-tight">kabootar</h1>
        <p className="text-orange-100 mt-2 text-sm leading-relaxed">
          Send parcels with trusted travelers.<br />Save money. Go farther.
        </p>
      </div>

      {/* Card */}
      <div className="flex-1 px-6 pt-8">
        {step === STEPS.PHONE && (
          <div className="animate-slide-up">
            <h2 className="text-xl font-bold text-stone-900 mb-1">Enter your number</h2>
            <p className="text-stone-500 text-sm mb-6">We'll send you a one-time password</p>
            <div className="flex gap-2 mb-4">
              <div className="input-field w-16 text-center font-semibold text-stone-600 shrink-0">+91</div>
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

        {step === STEPS.OTP && (
          <div className="animate-slide-up">
            <button className="btn-ghost -ml-2 mb-4 flex items-center gap-1" onClick={() => setStep(STEPS.PHONE)}>
              <ChevronLeft size={16} /> Back
            </button>
            <h2 className="text-xl font-bold text-stone-900 mb-1">Enter OTP</h2>
            <p className="text-stone-500 text-sm mb-6">Sent to +91 {phone}</p>
            <div className="flex gap-2 justify-between mb-6">
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

        {step === STEPS.NAME && (
          <div className="animate-slide-up">
            <h2 className="text-xl font-bold text-stone-900 mb-1">What's your name?</h2>
            <p className="text-stone-500 text-sm mb-6">Help others know who you are</p>
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

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
    </svg>
  );
}
