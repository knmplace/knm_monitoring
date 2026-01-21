/**
 * Firebase Admin SDK Configuration
 *
 * This file initializes the Firebase Admin SDK for server-side token verification.
 * It should only be imported in API routes (server-side code).
 */

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App;

/**
 * Initialize Firebase Admin SDK (singleton pattern)
 */
export function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    // Initialize with environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        'Missing Firebase Admin credentials. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.'
      );
    }

    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } else {
    adminApp = getApps()[0];
  }

  return adminApp;
}

/**
 * Get Firebase Admin Auth instance
 */
export function getAdminAuth() {
  if (!adminApp) {
    initializeFirebaseAdmin();
  }
  return getAuth(adminApp);
}

/**
 * Get Firebase Admin Firestore instance
 */
export function getAdminFirestore() {
  if (!adminApp) {
    initializeFirebaseAdmin();
  }
  return getFirestore(adminApp);
}

/**
 * Verify a Firebase ID token
 * @param idToken - The Firebase ID token from the client
 * @returns The decoded token with user info
 */
export async function verifyIdToken(idToken: string) {
  const auth = getAdminAuth();
  return await auth.verifyIdToken(idToken);
}

/**
 * Get user role from Firestore
 * @param uid - The user's Firebase UID
 * @returns The user's role (or null if not found)
 */
export async function getUserRole(uid: string): Promise<string | null> {
  try {
    const firestore = getAdminFirestore();
    const userDoc = await firestore.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return null;
    }

    const userData = userDoc.data();
    return userData?.role || null;
  } catch (error) {
    console.error('Error fetching user role:', error);
    return null;
  }
}
