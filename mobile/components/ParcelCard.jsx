import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const ITEM_EMOJI = { documents: '📄', electronics: '📱', clothes: '👕', others: '📦' };
const STATUS_BG = { open: 'bg-emerald-50', matched: 'bg-blue-50', in_transit: 'bg-amber-50', delivered: 'bg-stone-100' };
const STATUS_TEXT = { open: 'text-emerald-600', matched: 'text-blue-600', in_transit: 'text-amber-600', delivered: 'text-stone-500' };

export default function ParcelCard({ parcel, showDelete, onDelete, onFindMatch }) {
  const { user } = useAuth();
  const router = useRouter();
  const sender = parcel.userId;
  const isOwn = sender?._id === user?._id || parcel.userId === user?._id;

  return (
    <View className="bg-white rounded-2xl border border-stone-100 p-4 mb-3">
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-row items-center gap-2 flex-1">
          <Text className="text-xl">{ITEM_EMOJI[parcel.itemType] || '📦'}</Text>
          <View className="flex-1">
            <Text className="font-semibold text-stone-900 text-sm">{parcel.fromCity} → {parcel.toCity}</Text>
            <Text className="text-xs text-stone-500 capitalize mt-0.5">{parcel.itemType}</Text>
          </View>
        </View>
        <View className={`px-2.5 py-1 rounded-full ${STATUS_BG[parcel.status] || 'bg-stone-100'}`}>
          <Text className={`text-[11px] font-semibold ${STATUS_TEXT[parcel.status] || 'text-stone-500'}`}>
            {parcel.status}
          </Text>
        </View>
      </View>

      <Text className="text-xs text-stone-500 leading-4 mb-2.5" numberOfLines={2}>{parcel.description}</Text>

      <View className="flex-row flex-wrap gap-1.5 mb-3">
        <View className="flex-row items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50">
          <Ionicons name="scale-outline" size={10} color="#f97316" />
          <Text className="text-[11px] font-semibold text-orange-600">{parcel.weight} kg</Text>
        </View>
        <View className="flex-row items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100">
          <Text className="text-[11px] text-stone-500">
            {formatDistanceToNow(new Date(parcel.createdAt), { addSuffix: true })}
          </Text>
        </View>
      </View>

      {sender && typeof sender === 'object' && (
        <View className="flex-row items-center justify-between pt-2.5 border-t border-stone-50">
          <View className="flex-row items-center gap-2">
            <View className="w-7 h-7 rounded-full bg-blue-50 items-center justify-center">
              <Text className="text-blue-600 font-bold text-xs">{sender.name?.[0]?.toUpperCase()}</Text>
            </View>
            <View>
              <Text className="text-xs font-semibold text-stone-700">{sender.name}</Text>
              <View className="flex-row items-center gap-0.5">
                <Ionicons name="star" size={9} color="#fbbf24" />
                <Text className="text-[11px] text-stone-400">{sender.rating?.toFixed(1)}</Text>
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
            {isOwn && onFindMatch && parcel.status === 'open' && (
              <TouchableOpacity onPress={onFindMatch}
                className="bg-orange-500 flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl" activeOpacity={0.8}>
                <Ionicons name="flash" size={13} color="#fff" />
                <Text className="text-white font-semibold text-xs">Find Match</Text>
              </TouchableOpacity>
            )}
            {!isOwn && (
              <TouchableOpacity onPress={() => router.push(`/chat/${sender._id}`)}
                className="bg-orange-500 flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl" activeOpacity={0.8}>
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
