# 🕊️ Kabootar Mobile (React Native + Expo)

Monorepo structure — mobile shares `lib/` and `context/` logic with the web app.

## Structure
```
kabootar/
├── frontend/          ← Web (Vite + React)
├── backend/           ← Node + Express + MongoDB
└── mobile/            ← This folder (Expo + React Native)
    ├── app/
    │   ├── _layout.jsx         Root layout + auth guard
    │   ├── (auth)/login.jsx    OTP login
    │   ├── (tabs)/             Bottom tab screens
    │   │   ├── index.jsx       Dashboard
    │   │   ├── trips.jsx
    │   │   ├── parcels.jsx
    │   │   ├── messages.jsx
    │   │   └── profile.jsx
    │   └── chat/[userId].jsx   Chat screen
    ├── components/             TripCard, ParcelCard, Modals
    ├── context/AuthContext.jsx (same logic as web)
    └── lib/                    api.js + socket.js (same as web)
```

## Setup

### 1. Prerequisites
```bash
npm install -g expo-cli eas-cli
```

### 2. Install & configure Firebase
1. Go to Firebase Console → your project
2. Add an **Android app** with package `com.kabootar.app`
3. Download `google-services.json` → place in `mobile/`
4. Enable **Phone Authentication**

### 3. Install dependencies
```bash
cd mobile
npm install
```

### 4. Set env
```bash
cp .env.example .env
# Fill EXPO_PUBLIC_API_URL and EXPO_PUBLIC_SOCKET_URL
```

### 5. Run on Android emulator
```bash
npx expo run:android
```

### 6. Run on physical device
```bash
npx expo start
# Scan QR with Expo Go app
```

---

## Build APK for Play Store

### First time setup
```bash
eas login
eas build:configure
```

### Preview APK (internal testing)
```bash
eas build --platform android --profile preview
```

### Production AAB (Play Store)
```bash
eas build --platform android --profile production
```

---

## Key differences from Web

| Web | Mobile |
|---|---|
| `localStorage` | `expo-secure-store` |
| Firebase Web SDK | `@react-native-firebase/auth` |
| `react-router-dom` | `expo-router` |
| Tailwind CSS | NativeWind (`className` on RN components) |
| `<div>/<p>/<input>` | `<View>/<Text>/<TextInput>` |
| `lucide-react` | `@expo/vector-icons` (Ionicons) |
| `launchImageLibrary` | `expo-image-picker` |
| Modal (web) | `<Modal>` (RN) |

## Backend: Zero changes needed
The existing backend works as-is. For local development use:
- `EXPO_PUBLIC_API_URL=http://10.0.2.2:5000/api` (Android emulator → localhost)
- `EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:5000/api` (physical device)
