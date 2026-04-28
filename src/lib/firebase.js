import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAnPFYxa3ApoINSo_TjEbllobpwn2tp2iM",
  authDomain: "habit-tracker-58305.firebaseapp.com",
  databaseURL: "https://habit-tracker-58305-default-rtdb.firebaseio.com",
  projectId: "habit-tracker-58305",
  storageBucket: "habit-tracker-58305.firebasestorage.app",
  messagingSenderId: "472706097602",
  appId: "1:472706097602:web:dc2bc1354d2e6501cff65b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);

const provider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Store user data in Firestore
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        name: user.displayName,
        email: user.email,
        avatar: user.photoURL,
        createdAt: new Date().toISOString(),
      });
    }

    return user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
  }
};

export { auth, db, rtdb };
