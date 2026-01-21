'use client';

/**
 * Process Table Component
 * Displays PM2 processes with control buttons
 */

import { useState } from 'react';
import { StatusBadge } from './StatusBadge';
import { RotateCw, Square, Play, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ProcessTableProps {
  processes: any[];
  projectId: string;
  onRefresh: () => void;
}

export function ProcessTable({ processes, projectId, onRefresh }: ProcessTableProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (action: 'restart' | 'stop' | 'start', processName: string) => {
    setLoading(`${action}-${processName}`);

    try {
      // Get ID token from auth context
      const auth = await import('firebase/auth');
      const { getFirebaseAuth } = await import('@/lib/firebase-client');
      const firebaseAuth = getFirebaseAuth();
      const user = firebaseAuth.currentUser;

      if (!user) {
        alert('Not authenticated');
        return;
      }

      const idToken = await user.getIdToken();

      const response = await fetch(`/api/projects/${projectId}/pm2/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ processName }),
      });

      const result = await response.json();

      if (result.success) {
        // Wait a moment for PM2 to update
        setTimeout(() => {
          onRefresh();
        }, 1000);
      } else {
        alert(`Failed to ${action} process: ${result.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(null);
    }
  };

  if (processes.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-600">
        No PM2 processes found for this project
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Process Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Uptime
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              CPU
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Memory
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Restarts
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {processes.map((process) => {
            const status = process.pm2_env?.status || 'unknown';
            const uptime = process.pm2_env?.pm_uptime
              ? formatDistanceToNow(new Date(process.pm2_env.pm_uptime), { addSuffix: false })
              : 'N/A';

            return (
              <tr key={process.name} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {process.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={status === 'online' ? 'online' : 'stopped'} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{uptime}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {process.monit?.cpu ? `${process.monit.cpu}%` : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {process.monit?.memory ? `${(process.monit.memory / 1024 / 1024).toFixed(0)} MB` : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {process.pm2_env?.restart_time || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleAction('restart', process.name)}
                      disabled={loading !== null}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Restart"
                    >
                      {loading === `restart-${process.name}` ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCw className="h-4 w-4" />
                      )}
                    </button>
                    {status === 'online' ? (
                      <button
                        onClick={() => handleAction('stop', process.name)}
                        disabled={loading !== null}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Stop"
                      >
                        {loading === `stop-${process.name}` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAction('start', process.name)}
                        disabled={loading !== null}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Start"
                      >
                        {loading === `start-${process.name}` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
