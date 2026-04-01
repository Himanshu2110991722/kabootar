import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import TripCard from '../../components/TripCard';
import ParcelCard from '../../components/ParcelCard';
import PostTripModal from '../../components/PostTripModal';
import PostParcelModal from '../../components/PostParcelModal';

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [trips, setTrips] = useState([]);
  const [parcels, setParcels] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showTrip, setShowTrip] = useState(false);
  const [showParcel, setShowParcel] = useState(false);

  const load = async () => {
    const [t, p] = await Promise.all([
      api.get('/trips').catch(() => ({ data: { trips: [] } })),
      api.get('/parcels').catch(() => ({ data: { parcels: [] } })),
    ]);
    setTrips(t.data.trips.slice(0, 3));
    setParcels(p.data.parcels.slice(0, 3));
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <SafeAreaView className="flex-1 bg-stone-50">
      {/* Header */}
      <View className="bg-white border-b border-stone-100 px-4 py-3 flex-row items-center justify-between">
        <Text className="text-xl">🕊️</Text>
        <Text className="font-bold text-lg text-stone-900">kabootar</Text>
        <View className="w-6" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" />}
      >
        {/* Greeting */}
        <View className="mb-4">
          <Text className="text-stone-500 text-sm">Good day 👋</Text>
          <Text className="text-2xl font-bold text-stone-900">Hey, {firstName}</Text>
        </View>

        {/* Stats */}
        <View className="flex-row gap-2 mb-4">
          <StatBox value={user?.rating?.toFixed(1) || '5.0'} label="Rating" accent />
          <StatBox value={user?.totalRatings || 0} label="Reviews" />
          <StatBox value="✓" label="Verified" green />
        </View>

        {/* Quick actions */}
        <View className="flex-row gap-3 mb-6">
          <TouchableOpacity onPress={() => setShowTrip(true)} activeOpacity={0.8}
            className="flex-1 bg-white rounded-2xl p-4 border border-stone-100 shadow-sm">
            <View className="w-9 h-9 rounded-xl bg-orange-50 items-center justify-center mb-3">
              <Ionicons name="paper-plane" size={18} color="#f97316" />
            </View>
            <Text className="font-semibold text-stone-900 text-sm">Post a Trip</Text>
            <Text className="text-xs text-stone-400 mt-0.5">Earn by carrying</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowParcel(true)} activeOpacity={0.8}
            className="flex-1 bg-white rounded-2xl p-4 border border-stone-100 shadow-sm">
            <View className="w-9 h-9 rounded-xl bg-blue-50 items-center justify-center mb-3">
              <Ionicons name="cube" size={18} color="#3b82f6" />
            </View>
            <Text className="font-semibold text-stone-900 text-sm">Send Parcel</Text>
            <Text className="text-xs text-stone-400 mt-0.5">Find a traveler</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Trips */}
        <SectionHeader title="Recent Trips" onSeeAll={() => router.push('/(tabs)/trips')} />
        {trips.length === 0
          ? <Empty text="No trips yet" />
          : trips.map(t => <TripCard key={t._id} trip={t} />)}

        {/* Recent Parcels */}
        <SectionHeader title="Open Requests" onSeeAll={() => router.push('/(tabs)/parcels')} />
        {parcels.length === 0
          ? <Empty text="No requests yet" />
          : parcels.map(p => <ParcelCard key={p._id} parcel={p} />)}
      </ScrollView>

      <PostTripModal visible={showTrip} onClose={() => setShowTrip(false)}
        onSuccess={t => { setTrips(p => [t, ...p].slice(0, 3)); setShowTrip(false); }} />
      <PostParcelModal visible={showParcel} onClose={() => setShowParcel(false)}
        onSuccess={p => { setParcels(prev => [p, ...prev].slice(0, 3)); setShowParcel(false); }} />
    </SafeAreaView>
  );
}

function StatBox({ value, label, accent, green }) {
  return (
    <View className="flex-1 bg-white rounded-2xl p-3 border border-stone-100 items-center">
      <Text className={`text-base font-bold ${accent ? 'text-orange-500' : green ? 'text-emerald-500' : 'text-stone-800'}`}>
        {value}
      </Text>
      <Text className="text-[10px] text-stone-400 mt-0.5">{label}</Text>
    </View>
  );
}

function SectionHeader({ title, onSeeAll }) {
  return (
    <View className="flex-row items-center justify-between mb-3 mt-2">
      <Text className="font-bold text-stone-900">{title}</Text>
      <TouchableOpacity onPress={onSeeAll}>
        <Text className="text-orange-500 text-xs font-semibold">See all →</Text>
      </TouchableOpacity>
    </View>
  );
}

function Empty({ text }) {
  return (
    <View className="bg-white rounded-2xl p-6 border border-stone-100 items-center mb-3">
      <Text className="text-stone-400 text-sm">{text}</Text>
    </View>
  );
}
