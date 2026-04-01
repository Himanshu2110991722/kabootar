import { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../lib/api';
import Toast from 'react-native-toast-message';

const MODES = ['train', 'flight', 'bus', 'car'];
const MODE_ICON = { train: 'train', flight: 'airplane', bus: 'bus', car: 'car' };
const today = new Date().toISOString().split('T')[0];

export default function PostTripModal({ visible, onClose, onSuccess }) {
  const [form, setForm] = useState({
    fromCity: '', toCity: '', date: '', transportMode: 'train',
    availableWeight: '', pricePerKg: '', notes: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: null })); };

  const validate = () => {
    const e = {};
    if (!form.fromCity.trim()) e.fromCity = 'Required';
    if (!form.toCity.trim()) e.toCity = 'Required';
    if (!form.date) e.date = 'Required';
    if (!form.availableWeight || +form.availableWeight <= 0) e.availableWeight = 'Must be > 0';
    if (form.pricePerKg === '' || +form.pricePerKg < 0) e.pricePerKg = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/trips', { ...form, availableWeight: +form.availableWeight, pricePerKg: +form.pricePerKg });
      Toast.show({ type: 'success', text1: 'Trip posted!' });
      setForm({ fromCity: '', toCity: '', date: '', transportMode: 'train', availableWeight: '', pricePerKg: '', notes: '' });
      onSuccess(data.trip);
    } catch (err) {
      Toast.show({ type: 'error', text1: err.response?.data?.message || 'Failed to post trip' });
    } finally { setLoading(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView className="flex-1 bg-white" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View className="flex-row items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100">
          <View className="flex-row items-center gap-2">
            <Ionicons name="paper-plane" size={18} color="#f97316" />
            <Text className="font-bold text-stone-900 text-base">Post a Trip</Text>
          </View>
          <TouchableOpacity onPress={onClose} className="p-2 -mr-2">
            <Ionicons name="close" size={20} color="#78716c" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-5 py-4" keyboardShouldPersistTaps="handled">
          <View className="flex-row gap-3 mb-3">
            <Field label="From City" error={errors.fromCity} flex>
              <TextInput className="border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-900"
                placeholder="Delhi" value={form.fromCity} onChangeText={v => set('fromCity', v)} />
            </Field>
            <Field label="To City" error={errors.toCity} flex>
              <TextInput className="border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-900"
                placeholder="Mumbai" value={form.toCity} onChangeText={v => set('toCity', v)} />
            </Field>
          </View>

          <Field label="Date (YYYY-MM-DD)" error={errors.date}>
            <TextInput className="border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-900"
              placeholder={today} value={form.date} onChangeText={v => set('date', v)} />
          </Field>

          <Field label="Transport Mode">
            <View className="flex-row flex-wrap gap-2 mt-1">
              {MODES.map(m => (
                <TouchableOpacity key={m} onPress={() => set('transportMode', m)}
                  className={`flex-row items-center gap-1.5 px-3.5 py-2 rounded-xl border ${
                    form.transportMode === m ? 'bg-orange-500 border-orange-500' : 'bg-white border-stone-200'
                  }`}>
                  <Ionicons name={MODE_ICON[m]} size={13} color={form.transportMode === m ? '#fff' : '#78716c'} />
                  <Text className={`text-sm font-medium capitalize ${form.transportMode === m ? 'text-white' : 'text-stone-600'}`}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          <View className="flex-row gap-3 mt-1">
            <Field label="Weight (kg)" error={errors.availableWeight} flex>
              <TextInput className="border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-900"
                placeholder="10" keyboardType="numeric" value={form.availableWeight}
                onChangeText={v => set('availableWeight', v)} />
            </Field>
            <Field label="Price/kg (₹)" error={errors.pricePerKg} flex>
              <TextInput className="border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-900"
                placeholder="50" keyboardType="numeric" value={form.pricePerKg}
                onChangeText={v => set('pricePerKg', v)} />
            </Field>
          </View>

          <Field label="Notes (optional)">
            <TextInput className="border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-900"
              placeholder="Any extra info..." value={form.notes} onChangeText={v => set('notes', v)}
              multiline numberOfLines={2} />
          </Field>
        </ScrollView>

        <View className="flex-row gap-3 px-5 py-4 border-t border-stone-100">
          <TouchableOpacity onPress={onClose} className="flex-1 bg-stone-100 rounded-xl py-3 items-center">
            <Text className="text-stone-700 font-semibold text-sm">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={submit} disabled={loading}
            className="flex-1 bg-orange-500 rounded-xl py-3 items-center" activeOpacity={0.8}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold text-sm">Post Trip</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({ label, error, children, flex }) {
  return (
    <View className={`mb-3 ${flex ? 'flex-1' : ''}`}>
      <Text className="text-xs font-semibold text-stone-600 mb-1.5">{label}</Text>
      {children}
      {error && <Text className="text-xs text-red-500 mt-1">{error}</Text>}
    </View>
  );
}
