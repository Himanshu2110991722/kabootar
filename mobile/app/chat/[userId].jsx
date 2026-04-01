import { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, SafeAreaView, Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { getSocket, getRoomId } from '../../lib/socket';
import RatingModal from '../../components/RatingModal';

export default function ChatScreen() {
  const { userId } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [partner, setPartner] = useState(null);
  const [text, setText] = useState('');
  const [showRating, setShowRating] = useState(false);
  const flatRef = useRef(null);
  const roomId = user?._id && userId ? getRoomId(user._id, userId) : null;

  useEffect(() => {
    api.get(`/chat/${userId}`).then(r => {
      setMessages(r.data.messages);
      setPartner(r.data.partner);
    });
  }, [userId]);

  useEffect(() => {
    if (!roomId) return;
    const socket = getSocket();
    socket.emit('join_room', roomId);
    const handler = (msg) => {
      setMessages(prev => prev.find(m => m._id === msg._id) ? prev : [...prev, msg]);
    };
    socket.on('receive_message', handler);
    return () => socket.off('receive_message', handler);
  }, [roomId]);

  const sendMessage = async () => {
    if (!text.trim()) return;
    const payload = text.trim();
    setText('');
    const socket = getSocket();
    if (socket.connected) {
      socket.emit('send_message', { senderId: user._id, receiverId: userId, text: payload, roomId });
    } else {
      const res = await api.post(`/chat/${userId}`, { text: payload });
      setMessages(prev => [...prev, res.data.message]);
    }
  };

  const isMine = (msg) => msg.senderId === user?._id || msg.senderId?._id === user?._id;

  const initials = partner?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <SafeAreaView className="flex-1 bg-stone-50">
      {/* Header */}
      <View className="bg-white border-b border-stone-100 px-4 py-3 flex-row items-center gap-3">
        <TouchableOpacity onPress={() => router.back()} className="p-1 -ml-1">
          <Ionicons name="chevron-back" size={22} color="#44403c" />
        </TouchableOpacity>
        <View className="w-9 h-9 rounded-full bg-orange-50 items-center justify-center">
          <Text className="text-orange-600 font-bold text-sm">{initials}</Text>
        </View>
        <View className="flex-1">
          <Text className="font-semibold text-stone-900 text-sm">{partner?.name}</Text>
          <View className="flex-row items-center gap-1">
            <Ionicons name="star" size={10} color="#fbbf24" />
            <Text className="text-xs text-stone-400">{partner?.rating?.toFixed(1)} · {partner?.phone}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setShowRating(true)} className="p-2">
          <Ionicons name="star-outline" size={18} color="#78716c" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(m, i) => m._id || String(i)}
        contentContainerStyle={{ padding: 16 }}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <Text className="text-center text-stone-400 text-sm mt-10">Start the conversation! 👋</Text>
        }
        renderItem={({ item: msg, index }) => {
          const mine = isMine(msg);
          const showTime = index === 0 ||
            new Date(msg.timestamp) - new Date(messages[index - 1].timestamp) > 5 * 60 * 1000;
          return (
            <View>
              {showTime && (
                <Text className="text-center text-[11px] text-stone-400 my-2">
                  {format(new Date(msg.timestamp), 'hh:mm a')}
                </Text>
              )}
              <View className={`flex-row mb-1 ${mine ? 'justify-end' : 'justify-start'}`}>
                <View className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl ${
                  mine ? 'bg-orange-500 rounded-br-sm' : 'bg-white rounded-bl-sm border border-stone-100'
                }`}>
                  <Text className={`text-sm leading-5 ${mine ? 'text-white' : 'text-stone-900'}`}>
                    {msg.text}
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View className="bg-white border-t border-stone-100 px-4 py-3 flex-row items-end gap-2">
          <TextInput
            className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 max-h-28"
            placeholder="Type a message..."
            value={text}
            onChangeText={setText}
            multiline
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            onPress={sendMessage}
            disabled={!text.trim()}
            className="w-10 h-10 bg-orange-500 rounded-xl items-center justify-center"
            style={{ opacity: text.trim() ? 1 : 0.4 }}
            activeOpacity={0.8}
          >
            <Ionicons name="send" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {showRating && <RatingModal partner={partner} onClose={() => setShowRating(false)} />}
    </SafeAreaView>
  );
}
