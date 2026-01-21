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
  // Add more projects here as needed
  // Example:
  // {
  //   id: 'project-b',
  //   name: 'Project B',
  //   description: 'Description of Project B',
  //   pm2Processes: ['project-b-dev', 'project-b-prod'],
  //   systemdServices: ['project-b-webhook'],
  //   ports: [4000, 9001],
  //   logPaths: {
  //     pm2: '/home/apps/project-b/logs',
  //     deployment: '/home/apps/project-b/logs/deployment.log',
  //     webhook: '/home/apps/project-b/logs/webhook.log',
  //   },
  //   healthCheckUrl: 'http://localhost:9001/health',
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
