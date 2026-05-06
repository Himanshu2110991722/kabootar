import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app  = initializeApp(firebaseConfig);
export const auth    = getAuth(app);
export const storage = getStorage(app);

// Upload a File to Firebase Storage and return the public download URL.
// Images persist permanently — not lost when the backend server restarts.
export async function uploadImageToStorage(file, folder = 'profile-images') {
  const ext      = file.name.split('.').pop() || 'jpg';
  const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const fileRef  = ref(storage, filename);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
}

export default app;
