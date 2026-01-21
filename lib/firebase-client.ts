/**
 * Firebase Client Configuration
 *
 * This file initializes the Firebase client SDK for authentication.
 * It uses the same Firebase project as the Apps project (read-only for auth).
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// Firebase configuration (same as demosite project)
const firebaseConfig = {
  projectId: 'studio-5400987535-1a69e',
  appId: '1:391721861434:web:8c2290695f2798defa1003',
  apiKey: 'AIzaSyDI3AXPoMV9wQUAO9ifSXjsY6mok_1aaqM',
  authDomain: 'studio-5400987535-1a69e.firebaseapp.com',
  messagingSenderId: '391721861434',
};

let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

/**
 * Initialize Firebase client (singleton pattern)
 */
export function initializeFirebaseClient() {
  if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApp();
  }

  auth = getAuth(firebaseApp);
  firestore = getFirestore(firebaseApp);

  return { firebaseApp, auth, firestore };
}

/**
 * Get Firebase Auth instance
 */
export function getFirebaseAuth(): Auth {
  if (!auth) {
    const { auth: authInstance } = initializeFirebaseClient();
    return authInstance;
  }
  return auth;
}

/**
 * Get Firestore instance
 */
export function getFirestoreClient(): Firestore {
  if (!firestore) {
    const { firestore: firestoreInstance } = initializeFirebaseClient();
    return firestoreInstance;
  }
  return firestore;
}
