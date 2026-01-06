
import { initializeApp } from '@firebase/app';
import { getAuth, GoogleAuthProvider } from '@firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBLvj8kP0LurmmVhfJmlJk4O68uX_kSqCU",
  authDomain: "apphs-ofc.firebaseapp.com",
  projectId: "apphs-ofc",
  storageBucket: "apphs-ofc.firebasestorage.app",
  messagingSenderId: "134346996950",
  appId: "1:134346996950:web:eb27022a83ae7a7e841d77"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
