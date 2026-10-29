import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDqIFRV_alUF_YaI-hGg-nohSTtBpMy6Rc",
  authDomain: "cirqlr-1a97d.firebaseapp.com",
  projectId: "cirqlr-1a97d",
  storageBucket: "cirqlr-1a97d.firebasestorage.app",
  messagingSenderId: "1041776490385",
  appId: "1:1041776490385:web:ec7a734cab3e717b5f4c30"
};

// Initialize Firebase safely
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);

/**
 * Recursively cleans objects before writing to Firestore, removing all undefined fields
 * which would otherwise cause Firestore to throw "Unsupported field value: undefined".
 */
export function cleanForFirestore<T>(data: T): T {
  if (data === undefined) return null as any;
  if (data === null || typeof data !== 'object') return data;
  if (Array.isArray(data)) {
    return data.map((item) => cleanForFirestore(item)) as any;
  }
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(data as Record<string, any>)) {
    if (value !== undefined) {
      cleaned[key] = cleanForFirestore(value);
    }
  }
  return cleaned as T;
}

export default app;
