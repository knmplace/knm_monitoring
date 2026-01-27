/**
 * Project Registry Configuration
 *
 * This file defines all projects that the KNM Monitoring Dashboard can monitor.
 * Add new projects here to automatically include them in the monitoring system.
 */

export interface Project {
  id: string;
  name: string;
  description: string;
  pm2Processes: string[];  // PM2 process names
  systemdServices: string[];  // systemd service names
  ports: number[];  // Ports used by the application
  logPaths: {
    pm2: string;  // Directory containing PM2 logs
    deployment: string;  // Deployment log file
    webhook: string;  // Webhook log file
  };
  healthCheckUrl?: string;  // Optional health check endpoint
  isRemote?: boolean;  // If true, this project runs on a remote server
  remoteHost?: string;  // Remote server hostname/IP
}

export const projects: Project[] = [
  {
    id: 'demosite',
    name: 'KNM Place Community Apps',
    description: 'Main community management application with resident portal, reservations, and property listings',
    pm2Processes: ['apps-dev'],
    systemdServices: ['webhook'],
    ports: [3000, 9000],
    logPaths: {
      pm2: '/home/apps/demosite/logs',
      deployment: '/home/apps/demosite/logs/deployment.log',
      webhook: '/home/apps/demosite/logs/webhook.log',
    },
    healthCheckUrl: 'http://localhost:9000/health',
  },
  {
    id: 'knm-monitoring',
    name: 'KNM Monitoring Dashboard',
    description: 'System monitoring dashboard for PM2 processes, health checks, and server metrics',
    pm2Processes: ['knm-monitoring'],
    systemdServices: [],
    ports: [5005],
    logPaths: {
      pm2: '/home/apps/monitoring/logs',
      deployment: '/home/apps/monitoring/logs/deployment.log',
      webhook: '/home/apps/monitoring/logs/webhook.log',
    },
    healthCheckUrl: 'http://localhost:5005/api/system/overview',
  },
  {
    id: 'niko-tv',
    name: 'Niko TV',
    description: 'Modern IPTV player with live TV, EPG, movies, and series support (Remote Server)',
    pm2Processes: ['niko-tv-dev'],
    systemdServices: [],
    ports: [3010],
    logPaths: {
      pm2: '/home/apps/niko-tv/logs',
      deployment: '/home/apps/niko-tv/logs/deployment.log',
      webhook: '/home/apps/niko-tv/logs/webhook.log',
    },
    healthCheckUrl: 'http://192.168.1.221:3010',
    isRemote: true,
    remoteHost: '192.168.1.221',
  },
  // Add more projects here as needed
  // Example:
  // {
  //   id: 'project-c',
  //   name: 'Project C',
  //   description: 'Description of Project C',
  //   pm2Processes: ['project-c-dev', 'project-c-prod'],
  //   systemdServices: ['project-c-webhook'],
  //   ports: [4000, 9001],
  //   logPaths: {
  //     pm2: '/home/apps/project-c/logs',
  //     deployment: '/home/apps/project-c/logs/deployment.log',
  //     webhook: '/home/apps/project-c/logs/webhook.log',
  //   },
  //   healthCheckUrl: 'http://localhost:4000/health',
  // },
];

/**
 * Get a project by ID
 */
export function getProjectById(id: string): Project | undefined {
  return projects.find(p => p.id === id);
}

/**
 * Get all project IDs
 */
export function getAllProjectIds(): string[] {
  return projects.map(p => p.id);
}
