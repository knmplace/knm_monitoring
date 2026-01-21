'use client';

/**
 * Webhook Status Component
 * Displays webhook service status and recent activity
 */

import { useEffect, useState } from 'react';
import { StatusBadge } from './StatusBadge';
import { RotateCw, Loader2, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface WebhookCall {
  timestamp: string;
  message: string;
  status: 'success' | 'error' | 'pending';
}

interface WebhookStatusProps {
  projectId: string;
  idToken: string;
  onRestartClick: () => void;
  isRestarting?: boolean;
}

export function WebhookStatus({ projectId, idToken, onRestartClick, isRestarting = false }: WebhookStatusProps) {
  const [loading, setLoading] = useState(true);
  const [webhookStatus, setWebhookStatus] = useState<{
    isOnline: boolean;
    lastActivity: string | null;
    recentCalls: WebhookCall[];
  } | null>(null);

  const fetchWebhookStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/logs/webhook`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      const result = await response.json();
      if (result.success) {
        setWebhookStatus(result.webhookStatus);
      }
    } catch (error) {
      console.error('Error fetching webhook status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhookStatus();
    const interval = setInterval(fetchWebhookStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [projectId, idToken]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Webhook Service</h2>
        <div className="flex items-center gap-4">
          <StatusBadge status={webhookStatus?.isOnline ? 'active' : 'inactive'} />
          {!webhookStatus?.isOnline && (
            <button
              onClick={onRestartClick}
              disabled={isRestarting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRestarting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Restarting...
                </>
              ) : (
                <>
                  <RotateCw className="h-4 w-4" />
                  Restart Service
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {webhookStatus?.lastActivity && (
        <p className="text-sm text-gray-600 mb-6">
          Last activity: {formatDistanceToNow(new Date(webhookStatus.lastActivity), { addSuffix: true })}
        </p>
      )}

      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Recent Activity (Last 2 Calls)</h3>

        {webhookStatus?.recentCalls && webhookStatus.recentCalls.length > 0 ? (
          <div className="space-y-3">
            {webhookStatus.recentCalls.map((call, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <time className="text-sm font-medium text-gray-900">
                        {new Date(call.timestamp).toLocaleString()}
                      </time>
                      <StatusBadge
                        status={call.status === 'error' ? 'offline' : call.status === 'success' ? 'online' : 'partial'}
                      />
                    </div>
                    <p className="text-sm text-gray-600 break-words">{call.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-500">
            <AlertCircle className="h-5 w-5" />
            <p>No recent webhook activity</p>
          </div>
        )}
      </div>
    </div>
  );
}
