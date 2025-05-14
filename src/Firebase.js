import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage"; 
import { getFirestore } from "firebase/firestore"; // Add Firestore import

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB-fSiSl6inewEn0-jzTGqYI9el4noMTlU",
  authDomain: "farmmartapp-951fb.firebaseapp.com",
  projectId: "farmmartapp-951fb",
  storageBucket: "farmmartapp-951fb.appspot.com",
  messagingSenderId: "1023068644817",
  appId: "1:1023068644817:web:ab0c3a31aa4fa468c82cf0",
  measurementId: "G-M62W2LKB26"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // Initialize Firebase Auth
const db = getDatabase(app); // Initialize Firebase Realtime Database
const storage = getStorage(app); // Initialize Firebase Storage
const firestore = getFirestore(app); // Initialize Firebase Firestore

// Export the initialized instances
export { app, auth, db, storage, firestore };