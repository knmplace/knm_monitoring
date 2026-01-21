'use client';

/**
 * Main Dashboard Page
 * Shows overview of all projects
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { AuthGate } from '@/components/AuthGate';
import { ProjectCard } from '@/components/ProjectCard';
import { useRouter } from 'next/navigation';
import { Loader2, LogOut, RefreshCw } from 'lucide-react';

interface ProjectOverview {
  id: string;
  name: string;
  description: string;
  status: 'online' | 'offline' | 'partial';
  processes: {
    online: number;
    total: number;
  };
  services: number;
}

export default function HomePage() {
  const { user, loading: authLoading, logout, idToken } = useAuth();
  const [projects, setProjects] = useState<ProjectOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchOverview = async () => {
    if (!idToken) return;

    try {
      setRefreshing(true);
      const response = await fetch('/api/system/overview', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setProjects(result.overview.projects);
      }
    } catch (error) {
      console.error('Error fetching overview:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (idToken) {
      fetchOverview();
    }
  }, [idToken]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Show login page if not authenticated
  if (!authLoading && !user) {
    router.push('/login');
    return null;
  }

  return (
    <AuthGate>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">KNM Monitoring Dashboard</h1>
                <p className="text-sm text-gray-600 mt-1">Manage and monitor all KNM projects</p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => fetchOverview()}
                  disabled={refreshing}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <div className="text-sm text-gray-600">
                  {user?.email}
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
                <p className="text-sm text-gray-600">
                  {projects.length} project{projects.length !== 1 ? 's' : ''} configured
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>

              {projects.length === 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <p className="text-gray-600">No projects configured</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Add projects to the configuration file to start monitoring
                  </p>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </AuthGate>
  );
}
