import { useState, useEffect } from 'react';
import { Modal, View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import api from '../lib/api';

export default function MatchesModal({ parcel, onClose }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    api.get(`/match/parcel/${parcel._id}`)
      .then(r => setTrips(r.data.trips))
      .finally(() => setLoading(false));
  }, [parcel._id]);

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-white">
        <View className="flex-row items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100">
          <View>
            <View className="flex-row items-center gap-2">
              <Ionicons name="flash" size={18} color="#f59e0b" />
              <Text className="font-bold text-stone-900 text-base">Matching Travelers</Text>
            </View>
            <Text className="text-xs text-stone-500 mt-0.5">
              {parcel.fromCity} → {parcel.toCity} · {parcel.weight} kg
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} className="p-2 -mr-2">
            <Ionicons name="close" size={20} color="#78716c" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#f97316" />
          </View>
        ) : trips.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-4xl mb-3">😕</Text>
            <Text className="font-semibold text-stone-700 mb-1 text-center">No matches yet</Text>
            <Text className="text-stone-400 text-sm text-center">
              No travelers going {parcel.fromCity} → {parcel.toCity} right now. Check back soon!
            </Text>
          </View>
        ) : (
          <FlatList
            data={trips}
            keyExtractor={i => i._id}
            contentContainerStyle={{ padding: 16 }}
            ListHeaderComponent={
              <Text className="text-xs text-stone-500 mb-3">{trips.length} traveler{trips.length > 1 ? 's' : ''} found</Text>
            }
            renderItem={({ item: trip }) => {
              const t = trip.userId;
              return (
                <View className="bg-white rounded-2xl border border-stone-100 p-4 mb-3">
                  <View className="flex-row items-center justify-between mb-2.5">
                    <View className="flex-row items-center gap-2.5">
                      <View className="w-10 h-10 rounded-full bg-orange-50 items-center justify-center">
                        <Text className="text-orange-500 font-bold">{t?.name?.[0]?.toUpperCase()}</Text>
                      </View>
                      <View>
                        <Text className="font-semibold text-stone-900 text-sm">{t?.name}</Text>
                        <View className="flex-row items-center gap-1">
                          <Ionicons name="star" size={10} color="#fbbf24" />
                          <Text className="text-xs text-stone-400">{t?.rating?.toFixed(1)} ({t?.totalRatings} reviews)</Text>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => { router.push(`/chat/${t._id}`); onClose(); }}
                      className="bg-orange-500 flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl"
                      activeOpacity={0.8}
                    >
                      <Ionicons name="chatbubble-ellipses-outline" size={13} color="#fff" />
                      <Text className="text-white font-semibold text-xs">Chat</Text>
                    </TouchableOpacity>
                  </View>
                  <View className="flex-row flex-wrap gap-1.5">
                    <View className="flex-row items-center gap-1 bg-stone-100 px-2.5 py-1 rounded-full">
                      <Ionicons name="calendar-outline" size={10} color="#78716c" />
                      <Text className="text-[11px] text-stone-600">{format(new Date(trip.date), 'dd MMM')}</Text>
                    </View>
                    <View className="flex-row items-center gap-1 bg-orange-50 px-2.5 py-1 rounded-full">
                      <Ionicons name="scale-outline" size={10} color="#f97316" />
                      <Text className="text-[11px] text-orange-600">{trip.availableWeight} kg capacity</Text>
                    </View>
                    <View className="flex-row items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full">
                      <Text className="text-[11px] text-emerald-600">
                        ₹{trip.pricePerKg}/kg · ≈₹{Math.ceil(parcel.weight * trip.pricePerKg)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>
    </Modal>
  );
}
