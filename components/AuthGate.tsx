'use client';

/**
 * Authentication Gate
 * Protects the application and ensures only admins can access
 */

import { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import { getFirestoreClient } from '@/lib/firebase-client';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2, ShieldAlert } from 'lucide-react';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    async function checkRole() {
      if (!user) {
        setRoleLoading(false);
        return;
      }

      try {
        const firestore = getFirestoreClient();
        const userDoc = await getDoc(doc(firestore, 'users', user.uid));

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setRole(userData.role || null);
        } else {
          setRole(null);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setRole(null);
      } finally {
        setRoleLoading(false);
      }
    }

    if (user) {
      checkRole();
    } else {
      setRoleLoading(false);
    }
  }, [user]);

  // Loading state
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!user) {
    return null; // Login page will be shown by layout
  }

  // Authenticated but not admin
  if (role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg">
          <ShieldAlert className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You do not have permission to access the KNM Monitoring Dashboard.
            Admin access is required.
          </p>
          <p className="text-sm text-gray-500">
            Logged in as: {user.email}
          </p>
        </div>
      </div>
    );
  }

  // Authenticated and admin - show app
  return <>{children}</>;
}
