import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import api from '../../lib/api';

export default function MessagesScreen() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    api.get('/chat/conversations')
      .then(r => setConversations(r.data.conversations))
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-stone-50">
      <View className="bg-white border-b border-stone-100 px-4 py-3">
        <Text className="text-xl font-bold text-stone-900">Messages</Text>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={i => i.partner._id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        ListEmptyComponent={
          loading ? null : (
            <View className="bg-white rounded-2xl p-10 border border-stone-100 items-center">
              <Ionicons name="chatbubbles-outline" size={32} color="#d6d3d1" />
              <Text className="text-stone-500 text-sm mt-3">No conversations yet.</Text>
              <Text className="text-stone-400 text-xs mt-1">Find a match to start chatting!</Text>
            </View>
          )
        }
        renderItem={({ item: { partner, lastMessage, unreadCount } }) => (
          <TouchableOpacity
            onPress={() => router.push(`/chat/${partner._id}`)}
            className="bg-white rounded-2xl border border-stone-100 p-3 flex-row items-center gap-3 mb-2"
            activeOpacity={0.8}
          >
            <Avatar name={partner.name} />
            <View className="flex-1">
              <View className="flex-row items-center justify-between">
                <Text className="font-semibold text-stone-900 text-sm">{partner.name}</Text>
                <Text className="text-[11px] text-stone-400">
                  {formatDistanceToNow(new Date(lastMessage.timestamp), { addSuffix: true })}
                </Text>
              </View>
              <View className="flex-row items-center justify-between mt-0.5">
                <Text className="text-xs text-stone-500 flex-1 mr-2" numberOfLines={1}>{lastMessage.text}</Text>
                {unreadCount > 0 && (
                  <View className="bg-orange-500 rounded-full w-4 h-4 items-center justify-center">
                    <Text className="text-white text-[10px] font-bold">{unreadCount}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

function Avatar({ name }) {
  const initials = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  return (
    <View className="w-11 h-11 rounded-full bg-orange-50 items-center justify-center">
      <Text className="text-orange-600 font-bold text-sm">{initials}</Text>
    </View>
  );
}
