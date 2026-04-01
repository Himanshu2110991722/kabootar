import { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  Image, SafeAreaView, Alert, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import Toast from 'react-native-toast-message';

function calcCompletion(u) {
  const checks = [!!u?.name, !!u?.phone, !!u?.profileImage, !!u?.bio?.trim()];
  return Math.round((checks.filter(Boolean).length / 4) * 100);
}

export default function ProfileScreen() {
  const { user, logout, setUser } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imgUploading, setImgUploading] = useState(false);
  const [draft, setDraft] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    city: user?.city || '',
    routeFrom: user?.frequentRoute?.from || '',
    routeTo: user?.frequentRoute?.to || '',
  });

  const persist = async (updated) => { await setUser(updated); };

  const saveProfile = async () => {
    if (!draft.name.trim()) { Toast.show({ type: 'error', text1: 'Name cannot be empty' }); return; }
    setSaving(true);
    try {
      const { data } = await api.patch('/auth/me', {
        name: draft.name.trim(),
        bio: draft.bio.slice(0, 160),
        city: draft.city.trim(),
        frequentRoute: { from: draft.routeFrom.trim(), to: draft.routeTo.trim() },
      });
      await persist(data.user);
      setEditing(false);
      Toast.show({ type: 'success', text1: 'Profile updated!' });
    } catch { Toast.show({ type: 'error', text1: 'Failed to save' }); }
    finally { setSaving(false); }
  };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Toast.show({ type: 'error', text1: 'Gallery permission required' }); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true,
    });
    if (result.canceled) return;
    setImgUploading(true);
    try {
      const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
      const { data } = await api.post('/auth/me/image', { imageUrl: base64 });
      await persist(data.user);
      Toast.show({ type: 'success', text1: 'Photo updated!' });
    } catch { Toast.show({ type: 'error', text1: 'Upload failed' }); }
    finally { setImgUploading(false); }
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } },
    ]);
  };

  const completion = calcCompletion(user);
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  const isActive = (user?.tripsCompleted || 0) >= 1;

  return (
    <SafeAreaView className="flex-1 bg-stone-50">
      <View className="bg-white border-b border-stone-100 px-4 py-3">
        <Text className="text-xl font-bold text-stone-900">Profile</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* Avatar + name card */}
        <View className="bg-white rounded-2xl border border-stone-100 p-5 mb-4">
          <View className="flex-row items-start gap-4">
            {/* Photo */}
            <TouchableOpacity onPress={pickImage} className="relative" activeOpacity={0.8}>
              {user?.profileImage ? (
                <Image source={{ uri: user.profileImage }}
                  className="w-20 h-20 rounded-full border-2 border-orange-100" />
              ) : (
                <View className="w-20 h-20 rounded-full bg-orange-50 border-2 border-orange-100 items-center justify-center">
                  <Text className="text-orange-500 font-bold text-2xl">{initials}</Text>
                </View>
              )}
              <View className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-orange-500 items-center justify-center shadow">
                {imgUploading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Ionicons name="camera" size={13} color="#fff" />}
              </View>
            </TouchableOpacity>

            {/* Name + badges */}
            <View className="flex-1">
              {editing ? (
                <TextInput
                  className="border border-stone-200 rounded-xl px-3 py-2 text-sm font-semibold text-stone-900 mb-2"
                  value={draft.name}
                  onChangeText={v => setDraft(d => ({ ...d, name: v }))}
                  autoFocus
                />
              ) : (
                <Text className="text-lg font-bold text-stone-900" numberOfLines={1}>{user?.name}</Text>
              )}
              <View className="flex-row flex-wrap gap-1.5 mt-1.5">
                <Badge color="emerald" icon="shield-checkmark" label="Phone Verified" />
                <Badge color={isActive ? 'orange' : 'stone'} icon="flash" label={isActive ? 'Active User' : 'New User'} />
              </View>
              <View className="flex-row items-center gap-1.5 mt-2">
                <Ionicons name="call-outline" size={12} color="#a8a29e" />
                <Text className="text-stone-500 text-xs">{user?.phone}</Text>
              </View>
            </View>

            <TouchableOpacity onPress={() => editing ? setEditing(false) : setEditing(true)}
              className="p-2 -mt-1 -mr-1">
              <Ionicons name={editing ? 'close' : 'pencil'} size={16} color="#78716c" />
            </TouchableOpacity>
          </View>

          {/* Completion bar */}
          <View className="mt-4 pt-4 border-t border-stone-50">
            <View className="flex-row items-center justify-between mb-1.5">
              <Text className="text-xs font-semibold text-stone-600">Profile completion</Text>
              <Text className={`text-xs font-bold ${completion === 100 ? 'text-emerald-500' : 'text-orange-500'}`}>
                {completion}%
              </Text>
            </View>
            <View className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <View
                className={`h-full rounded-full ${completion === 100 ? 'bg-emerald-400' : 'bg-orange-400'}`}
                style={{ width: `${completion}%` }}
              />
            </View>
            {completion < 100 && (
              <Text className="text-[11px] text-stone-400 mt-1">
                {[!user?.profileImage && 'Add a photo', !user?.bio?.trim() && 'Add a bio'].filter(Boolean).join(' · ')}
              </Text>
            )}
          </View>
        </View>

        {/* Edit form */}
        {editing && (
          <View className="bg-white rounded-2xl border border-stone-100 p-4 mb-4 gap-3">
            <Field label={`Bio (${draft.bio.length}/160)`}>
              <TextInput
                className="border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-900"
                placeholder="Tell travelers a bit about yourself…"
                value={draft.bio}
                onChangeText={v => setDraft(d => ({ ...d, bio: v.slice(0, 160) }))}
                multiline
                numberOfLines={2}
              />
            </Field>
            <Field label="City">
              <View className="flex-row items-center border border-stone-200 rounded-xl px-3">
                <Ionicons name="location-outline" size={14} color="#a8a29e" />
                <TextInput className="flex-1 py-2.5 px-2 text-sm text-stone-900"
                  placeholder="Your base city" value={draft.city}
                  onChangeText={v => setDraft(d => ({ ...d, city: v }))} />
              </View>
            </Field>
            <Field label="Frequent Route">
              <View className="flex-row items-center gap-2">
                <TextInput className="flex-1 border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-900"
                  placeholder="From" value={draft.routeFrom}
                  onChangeText={v => setDraft(d => ({ ...d, routeFrom: v }))} />
                <Text className="text-stone-400">→</Text>
                <TextInput className="flex-1 border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-900"
                  placeholder="To" value={draft.routeTo}
                  onChangeText={v => setDraft(d => ({ ...d, routeTo: v }))} />
              </View>
            </Field>
            <View className="flex-row gap-2 pt-1">
              <TouchableOpacity onPress={() => setEditing(false)}
                className="flex-1 bg-stone-100 rounded-xl py-2.5 items-center">
                <Text className="text-stone-700 font-semibold text-sm">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveProfile} disabled={saving}
                className="flex-1 bg-orange-500 rounded-xl py-2.5 items-center" activeOpacity={0.8}>
                {saving
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text className="text-white font-semibold text-sm">Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Bio / City / Route read mode */}
        {!editing && (user?.bio || user?.city || user?.frequentRoute?.from) && (
          <View className="bg-white rounded-2xl border border-stone-100 p-4 mb-4 gap-2.5">
            {user.bio && (
              <View className="flex-row gap-2.5">
                <Ionicons name="document-text-outline" size={14} color="#a8a29e" style={{ marginTop: 2 }} />
                <Text className="text-sm text-stone-600 leading-5 flex-1">{user.bio}</Text>
              </View>
            )}
            {user.city && (
              <View className="flex-row gap-2.5 items-center">
                <Ionicons name="location-outline" size={14} color="#a8a29e" />
                <Text className="text-sm text-stone-600">{user.city}</Text>
              </View>
            )}
            {user.frequentRoute?.from && (
              <View className="flex-row gap-2.5 items-center">
                <Ionicons name="navigate-outline" size={14} color="#a8a29e" />
                <Text className="text-sm text-stone-600">
                  {user.frequentRoute.from}{user.frequentRoute.to ? ` → ${user.frequentRoute.to}` : ''}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Stats */}
        <View className="flex-row gap-2 mb-4">
          {[
            { label: 'Rating', value: user?.rating?.toFixed(1) || '5.0', icon: 'star', iconColor: '#fbbf24' },
            { label: 'Reviews', value: user?.totalRatings || 0 },
            { label: 'Trips', value: user?.tripsCompleted || 0 },
            { label: 'Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }) : '–' },
          ].map(s => (
            <View key={s.label} className="flex-1 bg-white rounded-2xl border border-stone-100 p-2.5 items-center">
              <View className="flex-row items-center gap-0.5">
                {s.icon && <Ionicons name={s.icon} size={12} color={s.iconColor || '#78716c'} />}
                <Text className="font-bold text-stone-900 text-sm">{s.value}</Text>
              </View>
              <Text className="text-[10px] text-stone-400 mt-0.5">{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu */}
        <View className="bg-white rounded-2xl border border-stone-100 mb-4 overflow-hidden">
          <MenuRow icon="paper-plane-outline" color="#f97316" label="My Trips" onPress={() => router.push('/(tabs)/trips')} />
          <View className="h-px bg-stone-50 mx-4" />
          <MenuRow icon="cube-outline" color="#3b82f6" label="My Parcels" onPress={() => router.push('/(tabs)/parcels')} />
        </View>

        <TouchableOpacity onPress={handleLogout}
          className="bg-white rounded-2xl border border-stone-100 p-4 flex-row items-center justify-center gap-2">
          <Ionicons name="log-out-outline" size={16} color="#ef4444" />
          <Text className="text-red-500 font-semibold text-sm">Log out</Text>
        </TouchableOpacity>

        <Text className="text-center text-xs text-stone-400 mt-6">🕊️ Kabootar v1.0.0 · Made with ♥</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Badge({ color, icon, label }) {
  const colors = {
    emerald: 'bg-emerald-50', orange: 'bg-orange-50', stone: 'bg-stone-100',
  };
  const textColors = {
    emerald: 'text-emerald-600', orange: 'text-orange-600', stone: 'text-stone-500',
  };
  const iconColors = {
    emerald: '#059669', orange: '#f97316', stone: '#78716c',
  };
  return (
    <View className={`flex-row items-center gap-0.5 px-2 py-0.5 rounded-full ${colors[color]}`}>
      <Ionicons name={icon} size={9} color={iconColors[color]} />
      <Text className={`text-[11px] font-semibold ${textColors[color]}`}>{label}</Text>
    </View>
  );
}

function Field({ label, children }) {
  return (
    <View>
      <Text className="text-xs font-semibold text-stone-600 mb-1.5">{label}</Text>
      {children}
    </View>
  );
}

function MenuRow({ icon, color, label, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} className="flex-row items-center gap-3 px-4 py-3.5" activeOpacity={0.7}>
      <Ionicons name={icon} size={16} color={color} />
      <Text className="flex-1 text-sm font-medium text-stone-700">{label}</Text>
      <Ionicons name="chevron-forward" size={16} color="#d6d3d1" />
    </TouchableOpacity>
  );
}
