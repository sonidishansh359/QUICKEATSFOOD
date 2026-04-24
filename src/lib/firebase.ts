import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyADLzuB6pjKmDoyMBT_r0MIXpvVF7snT-M",
  authDomain: "quickeats-18f2e.firebaseapp.com",
  projectId: "quickeats-18f2e",
  storageBucket: "quickeats-18f2e.firebasestorage.app",
  messagingSenderId: "373751835265",
  appId: "1:373751835265:web:b38240199cbb1aedccbb80",
  measurementId: "G-TV7QHKCRW1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, googleProvider, signInWithPopup, signOut };
