import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const TRANSPORT_ICON = { train: 'train', flight: 'airplane', bus: 'bus', car: 'car' };

export default function TripCard({ trip, showDelete, onDelete }) {
  const { user } = useAuth();
  const router = useRouter();
  const traveler = trip.userId;
  const isOwn = traveler?._id === user?._id || trip.userId === user?._id;

  return (
    <View className="bg-white rounded-2xl border border-stone-100 p-4 mb-3">
      {/* Route */}
      <View className="flex-row items-center justify-between mb-2.5">
        <View className="flex-row items-center gap-1.5 flex-1">
          <Ionicons name="location" size={13} color="#f97316" />
          <Text className="font-semibold text-stone-900 text-sm">{trip.fromCity}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <View className="h-px w-4 bg-stone-200" />
          <Ionicons name={TRANSPORT_ICON[trip.transportMode] || 'train'} size={13} color="#a8a29e" />
          <View className="h-px w-4 bg-stone-200" />
        </View>
        <View className="flex-row items-center gap-1.5 flex-1 justify-end">
          <Text className="font-semibold text-stone-900 text-sm">{trip.toCity}</Text>
          <Ionicons name="location" size={13} color="#10b981" />
        </View>
      </View>

      {/* Badges */}
      <View className="flex-row flex-wrap gap-1.5 mb-3">
        <Chip icon="calendar-outline" label={format(new Date(trip.date), 'dd MMM yyyy')} />
        <Chip icon="scale-outline" label={`${trip.availableWeight} kg`} color="orange" />
        <Chip icon="cash-outline" label={`₹${trip.pricePerKg}/kg`} color="green" />
      </View>

      {/* Traveler + actions */}
      {traveler && typeof traveler === 'object' && (
        <View className="flex-row items-center justify-between pt-2.5 border-t border-stone-50">
          <View className="flex-row items-center gap-2">
            <View className="w-7 h-7 rounded-full bg-orange-50 items-center justify-center">
              <Text className="text-orange-600 font-bold text-xs">{traveler.name?.[0]?.toUpperCase()}</Text>
            </View>
            <View>
              <Text className="text-xs font-semibold text-stone-700">{traveler.name}</Text>
              <View className="flex-row items-center gap-0.5">
                <Ionicons name="star" size={9} color="#fbbf24" />
                <Text className="text-[11px] text-stone-400">{traveler.rating?.toFixed(1)}</Text>
              </View>
            </View>
          </View>
          <View className="flex-row items-center gap-2">
            {showDelete && (
              <TouchableOpacity onPress={onDelete}
                className="w-8 h-8 rounded-xl bg-red-50 items-center justify-center">
                <Ionicons name="trash-outline" size={14} color="#f87171" />
              </TouchableOpacity>
            )}
            {!isOwn && (
              <TouchableOpacity
                onPress={() => router.push(`/chat/${traveler._id}`)}
                className="bg-orange-500 flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl"
                activeOpacity={0.8}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={13} color="#fff" />
                <Text className="text-white font-semibold text-xs">Chat</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

function Chip({ icon, label, color }) {
  const bg = color === 'orange' ? 'bg-orange-50' : color === 'green' ? 'bg-emerald-50' : 'bg-stone-100';
  const text = color === 'orange' ? 'text-orange-600' : color === 'green' ? 'text-emerald-600' : 'text-stone-600';
  const iconColor = color === 'orange' ? '#f97316' : color === 'green' ? '#10b981' : '#78716c';
  return (
    <View className={`flex-row items-center gap-1 px-2.5 py-1 rounded-full ${bg}`}>
      <Ionicons name={icon} size={10} color={iconColor} />
      <Text className={`text-[11px] font-semibold ${text}`}>{label}</Text>
    </View>
  );
}
