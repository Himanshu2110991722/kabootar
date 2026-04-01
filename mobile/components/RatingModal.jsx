import { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../lib/api';
import Toast from 'react-native-toast-message';

export default function RatingModal({ partner, onClose }) {
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await api.post(`/auth/rate/${partner._id}`, { rating });
      Toast.show({ type: 'success', text1: `Rated ${partner.name} ${rating}⭐` });
      onClose();
    } catch (err) {
      Toast.show({ type: 'error', text1: err.response?.data?.message || 'Failed to submit' });
    } finally { setLoading(false); }
  };

  const labels = ['', 'Poor', 'Below average', 'Okay', 'Good', 'Excellent!'];

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/40 items-center justify-center px-6">
        <View className="bg-white rounded-2xl w-full overflow-hidden">
          <View className="flex-row items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100">
            <Text className="font-bold text-stone-900">Rate {partner?.name}</Text>
            <TouchableOpacity onPress={onClose} className="p-2 -mr-2">
              <Ionicons name="close" size={18} color="#78716c" />
            </TouchableOpacity>
          </View>

          <View className="px-5 py-6 items-center">
            <View className="w-16 h-16 rounded-full bg-orange-50 items-center justify-center mb-4">
              <Text className="text-orange-500 font-bold text-2xl">{partner?.name?.[0]?.toUpperCase()}</Text>
            </View>
            <View className="flex-row gap-2 mb-2">
              {[1, 2, 3, 4, 5].map(s => (
                <TouchableOpacity key={s} onPress={() => setRating(s)} activeOpacity={0.7}>
                  <Ionicons name={s <= rating ? 'star' : 'star-outline'} size={32}
                    color={s <= rating ? '#fbbf24' : '#d6d3d1'} />
                </TouchableOpacity>
              ))}
            </View>
            <Text className="text-stone-500 text-sm">{labels[rating]}</Text>
          </View>

          <View className="flex-row gap-3 px-5 pb-5">
            <TouchableOpacity onPress={onClose} className="flex-1 bg-stone-100 rounded-xl py-3 items-center">
              <Text className="text-stone-700 font-semibold text-sm">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={submit} disabled={loading}
              className="flex-1 bg-orange-500 rounded-xl py-3 items-center" activeOpacity={0.8}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold text-sm">Submit</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
