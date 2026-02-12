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
    name: 'Niko TV (Docker)',
    description: 'IPTV player with VPN routing via Docker Compose - Gluetun VPN + NodeCast-TV (Remote Server)',
    pm2Processes: [],
    systemdServices: [],
    ports: [3000, 8888, 7000, 7388],
    logPaths: {
      pm2: '/home/apps/niko-tv/logs',
      deployment: '/home/apps/niko-tv/logs/deployment.log',
      webhook: '/home/apps/niko-tv/logs/webhook.log',
    },
    healthCheckUrl: 'http://192.168.1.221:3000',
    isRemote: true,
    remoteHost: '192.168.1.221',
  },
  {
    id: 'as-builts',
    name: 'AS-BUILTS Reporting System',
    description: 'BTR as-builts reporting and analytics platform with Excel upload, dashboard visualization, and FIR management',
    pm2Processes: ['as-builts-dev', 'as-builts-prod'],
    systemdServices: ['webhook-as-builts'],
    ports: [3001, 3010, 9010],
    logPaths: {
      pm2: '/home/apps/as-builts/logs',
      deployment: '/home/apps/as-builts/logs/deployment.log',
      webhook: '/home/apps/as-builts/logs/webhook.log',
    },
    healthCheckUrl: 'http://localhost:3010/api/health',
  },
  {
    id: 'wordsearch',
    name: 'Word Search Puzzle Game',
    description: 'Mobile-first word search puzzle game with 132 themed puzzles, user accounts, leaderboard, and cross-device play',
    pm2Processes: ['wordsearch'],
    systemdServices: [],
    ports: [3021],
    logPaths: {
      pm2: '/home/apps/wordsearch/logs',
      deployment: '/home/apps/wordsearch/logs/deployment.log',
      webhook: '/home/apps/wordsearch/logs/webhook.log',
    },
    healthCheckUrl: 'http://localhost:3021',
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
