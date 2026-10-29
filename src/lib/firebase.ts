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

export default app;
