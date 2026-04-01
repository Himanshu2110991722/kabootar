import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  SafeAreaView, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import TripCard from '../../components/TripCard';
import PostTripModal from '../../components/PostTripModal';
import Toast from 'react-native-toast-message';

export default function TripsScreen() {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [myTrips, setMyTrips] = useState([]);
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;
      const [all, my] = await Promise.all([
        api.get('/trips', { params }),
        api.get('/trips/my'),
      ]);
      setTrips(all.data.trips);
      setMyTrips(my.data.trips);
    } finally { setLoading(false); }
  }, [from, to]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleDelete = async (id) => {
    await api.delete(`/trips/${id}`);
    setMyTrips(p => p.filter(t => t._id !== id));
    setTrips(p => p.filter(t => t._id !== id));
    Toast.show({ type: 'success', text1: 'Trip deleted' });
  };

  const data = tab === 'all' ? trips : myTrips;

  return (
    <SafeAreaView className="flex-1 bg-stone-50">
      <View className="bg-white border-b border-stone-100 px-4 py-3 flex-row items-center justify-between">
        <Text className="text-xl font-bold text-stone-900">Trips</Text>
        <TouchableOpacity onPress={() => setShowModal(true)}
          className="bg-orange-500 flex-row items-center gap-1 px-3 py-2 rounded-xl" activeOpacity={0.8}>
          <Ionicons name="add" size={16} color="#fff" />
          <Text className="text-white font-semibold text-sm">Post</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View className="flex-row gap-2 px-4 py-3">
        <TextInput className="flex-1 bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-sm"
          placeholder="From city" value={from} onChangeText={setFrom} />
        <TextInput className="flex-1 bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-sm"
          placeholder="To city" value={to} onChangeText={setTo} />
        {(from || to) && (
          <TouchableOpacity onPress={() => { setFrom(''); setTo(''); }}
            className="bg-stone-100 rounded-xl px-3 items-center justify-center">
            <Ionicons name="close" size={16} color="#78716c" />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View className="flex-row mx-4 bg-stone-100 rounded-xl p-1 mb-3">
        {['all', 'mine'].map(t => (
          <TouchableOpacity key={t} onPress={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-lg items-center ${tab === t ? 'bg-white shadow-sm' : ''}`}>
            <Text className={`text-sm font-semibold ${tab === t ? 'text-stone-900' : 'text-stone-500'}`}>
              {t === 'all' ? 'All Trips' : 'My Trips'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={data}
        keyExtractor={i => i._id}
        contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await fetch(); setRefreshing(false); }} tintColor="#f97316" />}
        ListEmptyComponent={
          <View className="bg-white rounded-2xl p-8 border border-stone-100 items-center">
            <Text className="text-2xl mb-2">✈️</Text>
            <Text className="text-stone-500 text-sm">
              {tab === 'mine' ? 'No trips posted yet.' : 'No trips found.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TripCard
            trip={item}
            showDelete={tab === 'mine'}
            onDelete={() => handleDelete(item._id)}
          />
        )}
      />

      <PostTripModal visible={showModal} onClose={() => setShowModal(false)}
        onSuccess={t => { setMyTrips(p => [t, ...p]); setTrips(p => [t, ...p]); setShowModal(false); }} />
    </SafeAreaView>
  );
}
