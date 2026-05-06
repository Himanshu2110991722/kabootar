import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Lazy-initialize Storage so a missing/disabled bucket doesn't crash the app on startup
export async function uploadImageToStorage(file, folder = 'profile-images') {
  const { getStorage, ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
  const storage  = getStorage(app);
  const ext      = file.name?.split('.').pop() || 'jpg';
  const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const fileRef  = ref(storage, filename);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
}

export default app;
