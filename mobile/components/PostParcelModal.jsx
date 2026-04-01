import { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../lib/api';
import Toast from 'react-native-toast-message';

const ITEM_TYPES = ['documents', 'electronics', 'clothes', 'others'];
const ITEM_EMOJI = { documents: '📄', electronics: '📱', clothes: '👕', others: '📦' };

export default function PostParcelModal({ visible, onClose, onSuccess }) {
  const [form, setForm] = useState({ fromCity: '', toCity: '', weight: '', itemType: 'documents', description: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: null })); };

  const validate = () => {
    const e = {};
    if (!form.fromCity.trim()) e.fromCity = 'Required';
    if (!form.toCity.trim()) e.toCity = 'Required';
    if (!form.weight || +form.weight <= 0) e.weight = 'Must be > 0';
    if (!form.description.trim()) e.description = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/parcels', { ...form, weight: +form.weight });
      Toast.show({ type: 'success', text1: 'Request posted!' });
      setForm({ fromCity: '', toCity: '', weight: '', itemType: 'documents', description: '' });
      onSuccess(data.parcel);
    } catch (err) {
      Toast.show({ type: 'error', text1: err.response?.data?.message || 'Failed to post' });
    } finally { setLoading(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView className="flex-1 bg-white" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View className="flex-row items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100">
          <View className="flex-row items-center gap-2">
            <Ionicons name="cube" size={18} color="#3b82f6" />
            <Text className="font-bold text-stone-900 text-base">Send a Parcel</Text>
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

          <Field label="Item Type">
            <View className="flex-row flex-wrap gap-2 mt-1">
              {ITEM_TYPES.map(t => (
                <TouchableOpacity key={t} onPress={() => set('itemType', t)}
                  className={`flex-row items-center gap-1.5 px-3.5 py-2 rounded-xl border ${
                    form.itemType === t ? 'bg-blue-500 border-blue-500' : 'bg-white border-stone-200'
                  }`}>
                  <Text>{ITEM_EMOJI[t]}</Text>
                  <Text className={`text-sm font-medium capitalize ${form.itemType === t ? 'text-white' : 'text-stone-600'}`}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          <Field label="Weight (kg)" error={errors.weight}>
            <TextInput className="border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-900"
              placeholder="2.5" keyboardType="numeric" value={form.weight} onChangeText={v => set('weight', v)} />
          </Field>

          <Field label="Description" error={errors.description}>
            <TextInput className="border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-900"
              placeholder="Describe your item (size, fragility, handling)..."
              value={form.description} onChangeText={v => set('description', v)}
              multiline numberOfLines={3} />
          </Field>
        </ScrollView>

        <View className="flex-row gap-3 px-5 py-4 border-t border-stone-100">
          <TouchableOpacity onPress={onClose} className="flex-1 bg-stone-100 rounded-xl py-3 items-center">
            <Text className="text-stone-700 font-semibold text-sm">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={submit} disabled={loading}
            className="flex-1 bg-blue-500 rounded-xl py-3 items-center" activeOpacity={0.8}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold text-sm">Post Request</Text>}
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
