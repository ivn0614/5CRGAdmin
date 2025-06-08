import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage"; 
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCH-ZIRSuaoAELryVI7u0dc9mz5gZUGoZQ",
  authDomain: "crg-admin-99d01.firebaseapp.com",
  databaseURL: "https://crg-admin-99d01-default-rtdb.firebaseio.com",
  projectId: "crg-admin-99d01",
  storageBucket: "crg-admin-99d01.firebasestorage.app",
  messagingSenderId: "162092425570",
  appId: "1:162092425570:web:7031f2d25a1515c417cc3b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // Initialize Firebase Auth
const db = getDatabase(app); // Initialize Firebase Realtime Database
const storage = getStorage(app); // Initialize Firebase Storage
const firestore = getFirestore(app); // Initialize Firebase Firestore

// Export the initialized instances
export { app, auth, db, storage, firestore };