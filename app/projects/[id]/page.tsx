'use client';

/**
 * Project Detail Page
 * Shows detailed monitoring view for a single project
 */

import { use, useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { AuthGate } from '@/components/AuthGate';
import { ProcessTable } from '@/components/ProcessTable';
import { StatusBadge } from '@/components/StatusBadge';
import { LogModal } from '@/components/LogModal';
import { WebhookStatus } from '@/components/WebhookStatus';
import Link from 'next/link';
import { UserManagement } from '@/components/UserManagement';
import { ArrowLeft, Loader2, RefreshCw, Activity, Server, FileText, Rocket, Shield, Globe } from 'lucide-react';

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { idToken } = useAuth();
  const [project, setProject] = useState<any>(null);
  const [processes, setProcesses] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Log modal states
  const [errorLogModal, setErrorLogModal] = useState(false);
  const [deploymentLogModal, setDeploymentLogModal] = useState(false);
  const [errorLogs, setErrorLogs] = useState('');
  const [deploymentLogs, setDeploymentLogs] = useState('');
  const [logsLoading, setLogsLoading] = useState(false);
  const [isRestartingWebhook, setIsRestartingWebhook] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployOutput, setDeployOutput] = useState<string | null>(null);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [vpnStatus, setVpnStatus] = useState<any>(null);

  const fetchProjectData = async () => {
    if (!idToken) return;

    try {
      setRefreshing(true);

      // Fetch all projects to get project info
      const projectsResponse = await fetch('/api/projects', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const projectsData = await projectsResponse.json();
      const currentProject = projectsData.projects.find((p: any) => p.id === id);
      setProject(currentProject);

      // Fetch PM2 processes
      const processesResponse = await fetch(`/api/projects/${id}/pm2/status`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const processesData = await processesResponse.json();
      if (processesData.success) {
        setProcesses(processesData.processes);
      }

      // Fetch metrics
      const metricsResponse = await fetch(`/api/projects/${id}/metrics`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const metricsData = await metricsResponse.json();
      if (metricsData.success) {
        setMetrics(metricsData.metrics);
      }

      // Fetch health if URL is configured
      if (currentProject?.healthCheckUrl) {
        const healthResponse = await fetch(`/api/projects/${id}/health`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const healthData = await healthResponse.json();
        if (healthData.success) {
          setHealth(healthData.health);
        }
      }

      // Fetch VPN status if remote project
      if (currentProject?.isRemote) {
        try {
          const vpnResponse = await fetch(`/api/projects/${id}/vpn-status`, {
            headers: { Authorization: `Bearer ${idToken}` },
          });
          const vpnData = await vpnResponse.json();
          if (vpnData.success) {
            setVpnStatus(vpnData.vpn);
          }
        } catch (error) {
          console.error('Error fetching VPN status:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching project data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchErrorLogs = async () => {
    if (!idToken) return;
    setLogsLoading(true);
    try {
      const response = await fetch(`/api/projects/${id}/logs/error?lines=100`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const result = await response.json();
      if (result.success) {
        setErrorLogs(result.logs);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchDeploymentLogs = async () => {
    if (!idToken) return;
    setLogsLoading(true);
    try {
      const response = await fetch(`/api/projects/${id}/logs/deployment?lines=100`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const result = await response.json();
      if (result.success) {
        setDeploymentLogs(result.logs);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleRestartWebhook = async () => {
    setIsRestartingWebhook(true);
    try {
      // Service restart endpoint for webhook
      const response = await fetch(`/api/projects/${id}/service/restart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ serviceName: 'webhook' }),
      });

      const result = await response.json();
      if (result.success) {
        // Wait a moment then refresh
        setTimeout(() => {
          fetchProjectData();
        }, 1000);
      }
    } catch (error) {
      console.error('Error restarting webhook:', error);
    } finally {
      setIsRestartingWebhook(false);
    }
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    setDeployOutput(null);
    setDeployError(null);

    try {
      const response = await fetch(`/api/projects/${id}/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setDeployOutput(result.output || 'Deployment completed successfully');
        // Refresh deployment logs after successful deployment
        setTimeout(() => {
          fetchDeploymentLogs();
          fetchProjectData();
        }, 1000);
      } else {
        setDeployError(result.error || 'Deployment failed');
        setDeployOutput(result.output || null);
      }
    } catch (error: any) {
      setDeployError(error.message || 'Failed to trigger deployment');
    } finally {
      setIsDeploying(false);
    }
  };

  useEffect(() => {
    if (idToken) {
      fetchProjectData();

      // Auto-refresh every 10 seconds
      const interval = setInterval(fetchProjectData, 10000);
      return () => clearInterval(interval);
    }
  }, [idToken, id]);

  return (
    <AuthGate>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Back
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {project?.name || 'Loading...'}
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">{project?.description}</p>
                </div>
              </div>
              <button
                onClick={fetchProjectData}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
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
            <div className="space-y-8">
              {/* Status Cards */}
              <div className={`grid grid-cols-1 ${project?.pm2Processes?.length > 0 ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
                {/* Only show PM2 card if project uses PM2 */}
                {project?.pm2Processes && project.pm2Processes.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">PM2 Processes</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">
                          {processes.filter(p => p.pm2_env?.status === 'online').length}/
                          {processes.length}
                        </p>
                      </div>
                      <Activity className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="mt-4">
                      <StatusBadge
                        status={
                          processes.every(p => p.pm2_env?.status === 'online')
                            ? 'online'
                            : 'partial'
                        }
                      />
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">System CPU</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {metrics?.cpu ? `${metrics.cpu.toFixed(1)}%` : 'N/A'}
                      </p>
                    </div>
                    <Server className="h-8 w-8 text-green-600" />
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Memory Usage</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {metrics?.memory ? `${metrics.memory.toFixed(1)}%` : 'N/A'}
                      </p>
                    </div>
                    <Server className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
              </div>

              {/* Health Status */}
              {health && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Health Check</h2>
                  <div className="flex items-center gap-4">
                    <StatusBadge status={health.healthy ? 'online' : 'offline'} />
                    <span className="text-sm text-gray-600">
                      Response time: {health.responseTime}ms
                    </span>
                    {health.error && (
                      <span className="text-sm text-red-600">Error: {health.error}</span>
                    )}
                  </div>
                </div>
              )}

              {/* VPN Status */}
              {vpnStatus && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Shield className="h-6 w-6 text-blue-600" />
                      <h2 className="text-lg font-semibold text-gray-900">VPN Status</h2>
                    </div>
                    <StatusBadge status={vpnStatus.connected && vpnStatus.healthy ? 'online' : 'offline'} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <Globe className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Public IP</p>
                        <p className="text-base font-semibold text-gray-900 mt-1">
                          {vpnStatus.publicIP || 'Not connected'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Globe className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Location</p>
                        <p className="text-base font-semibold text-gray-900 mt-1">
                          {vpnStatus.location || 'Unknown'}
                        </p>
                      </div>
                    </div>

                    {vpnStatus.provider && (
                      <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">VPN Provider</p>
                          <p className="text-base font-semibold text-gray-900 mt-1">
                            {vpnStatus.provider}
                          </p>
                        </div>
                      </div>
                    )}

                    {vpnStatus.server && (
                      <div className="flex items-start gap-3">
                        <Server className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Server</p>
                          <p className="text-base font-semibold text-gray-900 mt-1">
                            {vpnStatus.server}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${vpnStatus.healthy ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className="text-sm text-gray-600">
                      {vpnStatus.healthy ? 'Connected & Healthy' : 'Connection Issues'}
                    </span>
                  </div>
                </div>
              )}

              {/* Manual Deployment */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Manual Deployment</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Deploy latest changes from repository to {project?.isRemote ? 'remote server' : 'server'}
                    </p>
                  </div>
                  <button
                    onClick={handleDeploy}
                    disabled={isDeploying}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {isDeploying ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Deploying...
                      </>
                    ) : (
                      <>
                        <Rocket className="h-4 w-4" />
                        Deploy Now
                      </>
                    )}
                  </button>
                </div>

                {deployError && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm font-medium text-red-900">Deployment Failed</p>
                    <p className="text-sm text-red-700 mt-1">{deployError}</p>
                  </div>
                )}

                {deployOutput && !deployError && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm font-medium text-green-900">Deployment Successful</p>
                    <pre className="text-xs text-green-700 mt-2 whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
                      {deployOutput}
                    </pre>
                  </div>
                )}
              </div>

              {/* Webhook Status */}
              <WebhookStatus
                projectId={id}
                idToken={idToken || ''}
                onRestartClick={handleRestartWebhook}
                isRestarting={isRestartingWebhook}
              />

              {/* PM2 Processes Table - Only show if project uses PM2 */}
              {project?.pm2Processes && project.pm2Processes.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">PM2 Processes</h2>
                  <ProcessTable
                    processes={processes}
                    projectId={id}
                    onRefresh={fetchProjectData}
                  />
                </div>
              )}

              {/* User Management - Wordsearch only */}
              {id === 'wordsearch' && idToken && (
                <UserManagement projectId={id} idToken={idToken} />
              )}

              {/* Logs Section */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Logs</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      fetchErrorLogs();
                      setErrorLogModal(true);
                    }}
                    className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition"
                  >
                    <FileText className="h-6 w-6 text-red-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Error Log</p>
                      <p className="text-sm text-gray-600">Application errors and issues</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      fetchDeploymentLogs();
                      setDeploymentLogModal(true);
                    }}
                    className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition"
                  >
                    <FileText className="h-6 w-6 text-blue-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Deployment Log</p>
                      <p className="text-sm text-gray-600">Build and deployment events</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Log Modals */}
      <LogModal
        isOpen={errorLogModal}
        onClose={() => setErrorLogModal(false)}
        title="Error Log"
        logs={errorLogs}
        loading={logsLoading}
        onRefresh={fetchErrorLogs}
      />

      <LogModal
        isOpen={deploymentLogModal}
        onClose={() => setDeploymentLogModal(false)}
        title="Deployment Log"
        logs={deploymentLogs}
        loading={logsLoading}
        onRefresh={fetchDeploymentLogs}
      />
    </AuthGate>
  );
}
