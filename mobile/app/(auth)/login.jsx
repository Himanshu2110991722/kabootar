import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, SafeAreaView,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';

const STEPS = { PHONE: 'phone', OTP: 'otp', NAME: 'name' };

export default function LoginScreen() {
  const [step, setStep] = useState(STEPS.PHONE);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [idToken, setIdToken] = useState(null);
  const otpRefs = useRef([]);
  const { login } = useAuth();
  const router = useRouter();

  const sendOtp = async () => {
    const full = phone.startsWith('+') ? phone : `+91${phone}`;
    if (full.replace(/\D/g, '').length < 10) {
      Toast.show({ type: 'error', text1: 'Enter a valid phone number' });
      return;
    }
    setLoading(true);
    try {
      const result = await auth().signInWithPhoneNumber(full);
      setConfirm(result);
      setStep(STEPS.OTP);
      Toast.show({ type: 'success', text1: 'OTP sent!' });
    } catch (err) {
      Toast.show({ type: 'error', text1: err.message || 'Failed to send OTP' });
    } finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    const code = otp.join('');
    if (code.length !== 6) { Toast.show({ type: 'error', text1: 'Enter full OTP' }); return; }
    setLoading(true);
    try {
      const result = await confirm.confirm(code);
      const token = await result.user.getIdToken();
      setIdToken(token);
      const res = await login(token);
      if (res.success) { Toast.show({ type: 'success', text1: 'Welcome back!' }); router.replace('/(tabs)'); }
      else if (res.newUser) setStep(STEPS.NAME);
      else Toast.show({ type: 'error', text1: res.message });
    } catch { Toast.show({ type: 'error', text1: 'Invalid OTP' }); }
    finally { setLoading(false); }
  };

  const submitName = async () => {
    if (!name.trim() || name.trim().length < 2) {
      Toast.show({ type: 'error', text1: 'Enter your full name' }); return;
    }
    setLoading(true);
    const res = await login(idToken, name.trim());
    setLoading(false);
    if (res.success) { Toast.show({ type: 'success', text1: 'Welcome to Kabootar! 🕊️' }); router.replace('/(tabs)'); }
    else Toast.show({ type: 'error', text1: res.message });
  };

  const handleOtpChange = (val, idx) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    if (digit && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKey = (e, idx) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[idx] && idx > 0)
      otpRefs.current[idx - 1]?.focus();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Hero */}
      <View className="bg-orange-500 px-6 pt-14 pb-10">
        <Text className="text-4xl mb-2">🕊️</Text>
        <Text className="text-3xl font-bold text-white tracking-tight">kabootar</Text>
        <Text className="text-orange-100 mt-1 text-sm leading-5">
          Send parcels with trusted travelers.{'
'}Save money. Go farther.
        </Text>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView className="flex-1 px-6 pt-8" keyboardShouldPersistTaps="handled">

          {step === STEPS.PHONE && (
            <View>
              <Text className="text-xl font-bold text-stone-900 mb-1">Enter your number</Text>
              <Text className="text-stone-500 text-sm mb-5">We'll send you a one-time password</Text>
              <View className="flex-row gap-2 mb-4">
                <View className="border border-stone-200 rounded-xl px-3 items-center justify-center w-14">
                  <Text className="font-semibold text-stone-600">+91</Text>
                </View>
                <TextInput
                  className="flex-1 border border-stone-200 focus:border-orange-400 rounded-xl px-4 py-3 text-sm text-stone-900"
                  placeholder="98765 43210"
                  value={phone}
                  onChangeText={t => setPhone(t.replace(/\D/g, '').slice(0, 10))}
                  keyboardType="phone-pad"
                  autoFocus
                />
              </View>
              <Btn onPress={sendOtp} loading={loading} label="Send OTP" />
            </View>
          )}

          {step === STEPS.OTP && (
            <View>
              <TouchableOpacity onPress={() => setStep(STEPS.PHONE)} className="mb-4">
                <Text className="text-stone-500 text-sm">← Back</Text>
              </TouchableOpacity>
              <Text className="text-xl font-bold text-stone-900 mb-1">Enter OTP</Text>
              <Text className="text-stone-500 text-sm mb-5">Sent to +91 {phone}</Text>
              <View className="flex-row justify-between mb-6">
                {otp.map((d, i) => (
                  <TextInput
                    key={i}
                    ref={el => (otpRefs.current[i] = el)}
                    className="w-12 h-12 border-2 border-stone-200 rounded-xl text-center text-lg font-bold text-stone-900"
                    value={d}
                    onChangeText={v => handleOtpChange(v, i)}
                    onKeyPress={e => handleOtpKey(e, i)}
                    keyboardType="numeric"
                    maxLength={1}
                    selectTextOnFocus
                  />
                ))}
              </View>
              <Btn onPress={verifyOtp} loading={loading} label="Verify OTP" />
            </View>
          )}

          {step === STEPS.NAME && (
            <View>
              <Text className="text-xl font-bold text-stone-900 mb-1">What's your name?</Text>
              <Text className="text-stone-500 text-sm mb-5">Help others know who you are</Text>
              <TextInput
                className="border border-stone-200 focus:border-orange-400 rounded-xl px-4 py-3 text-sm text-stone-900 mb-4"
                placeholder="Full name"
                value={name}
                onChangeText={setName}
                autoFocus
              />
              <Btn onPress={submitName} loading={loading} label="Let's go →" />
            </View>
          )}

          <Text className="text-center text-xs text-stone-400 mt-8 mb-4">
            By continuing, you agree to our Terms & Privacy Policy
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Btn({ onPress, loading, label }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      className="bg-orange-500 rounded-xl py-3 items-center"
      activeOpacity={0.8}
    >
      {loading
        ? <ActivityIndicator color="#fff" />
        : <Text className="text-white font-semibold text-sm">{label}</Text>}
    </TouchableOpacity>
  );
}
