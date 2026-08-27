import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (error: any) {
    console.warn("Google sign-in popup failed, attempting fallback:", error);
    // Fallback to anonymous sign-in if popup blocked in iframe or mobile browser
    if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/cancelled-popup-request' || error?.code === 'auth/popup-closed-by-user') {
      try {
        return await signInAnonymously(auth);
      } catch (anonErr) {
        console.warn("Anonymous sign-in also failed:", anonErr);
      }
    }
    throw error;
  }
};

export const signInAsGuest = async () => {
  try {
    return await signInAnonymously(auth);
  } catch (error) {
    console.warn("Guest login warning:", error);
    throw error;
  }
};

export const logOut = () => signOut(auth);

