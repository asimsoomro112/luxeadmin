import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCv3aMVRQPwp-6gJZtO3596sQ_MbeNxbxg",
  authDomain: "luxeapparel-d8c68.firebaseapp.com",
  projectId: "luxeapparel-d8c68",
  storageBucket: "luxeapparel-d8c68.firebasestorage.app",
  messagingSenderId: "439094012093",
  appId: "1:439094012093:web:0b4b611adb8d1a92892fd4",
  measurementId: "G-XKE3N8QQHB"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

setPersistence(auth, browserSessionPersistence)
  .catch(error => console.error('Error setting persistence:', error));