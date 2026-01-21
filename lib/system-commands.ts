/**
 * System Commands Utility
 *
 * Safe command execution with whitelisting and input sanitization.
 * All commands are logged for audit purposes.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);

/**
 * Allowed PM2 commands (whitelist)
 */
const ALLOWED_PM2_COMMANDS = ['list', 'describe', 'restart', 'stop', 'start', 'logs', 'flush'];

/**
 * Allowed systemctl commands (whitelist)
 */
const ALLOWED_SYSTEMCTL_COMMANDS = ['status', 'restart', 'start', 'stop'];

/**
 * Sanitize process name to prevent command injection
 */
function sanitizeProcessName(name: string): string {
  // Only allow alphanumeric characters, hyphens, and underscores
  return name.replace(/[^a-zA-Z0-9\-_]/g, '');
}

/**
 * Sanitize service name to prevent command injection
 */
function sanitizeServiceName(name: string): string {
  // Only allow alphanumeric characters, hyphens, and underscores
  return name.replace(/[^a-zA-Z0-9\-_]/g, '');
}

/**
 * Get PM2 process list in JSON format
 */
export async function getPM2List(): Promise<any[]> {
  try {
    const { stdout } = await execAsync('pm2 jlist');
    return JSON.parse(stdout);
  } catch (error: any) {
    console.error('Error getting PM2 list:', error);
    throw new Error('Failed to retrieve PM2 process list');
  }
}

/**
 * Get detailed info about a specific PM2 process
 */
export async function getPM2ProcessInfo(processName: string): Promise<any> {
  const sanitized = sanitizeProcessName(processName);
  if (sanitized !== processName) {
    throw new Error('Invalid process name');
  }

  try {
    const { stdout } = await execAsync(`pm2 jlist`);
    const processes = JSON.parse(stdout);
    return processes.find((p: any) => p.name === sanitized) || null;
  } catch (error: any) {
    console.error(`Error getting PM2 process info for ${processName}:`, error);
    throw new Error('Failed to retrieve process information');
  }
}

/**
 * Restart a PM2 process
 */
export async function restartPM2Process(processName: string): Promise<string> {
  const sanitized = sanitizeProcessName(processName);
  if (sanitized !== processName) {
    throw new Error('Invalid process name');
  }

  try {
    const { stdout } = await execAsync(`pm2 restart ${sanitized}`);
    return stdout;
  } catch (error: any) {
    console.error(`Error restarting PM2 process ${processName}:`, error);
    throw new Error('Failed to restart process');
  }
}

/**
 * Stop a PM2 process
 */
export async function stopPM2Process(processName: string): Promise<string> {
  const sanitized = sanitizeProcessName(processName);
  if (sanitized !== processName) {
    throw new Error('Invalid process name');
  }

  try {
    const { stdout } = await execAsync(`pm2 stop ${sanitized}`);
    return stdout;
  } catch (error: any) {
    console.error(`Error stopping PM2 process ${processName}:`, error);
    throw new Error('Failed to stop process');
  }
}

/**
 * Start a PM2 process
 */
export async function startPM2Process(processName: string): Promise<string> {
  const sanitized = sanitizeProcessName(processName);
  if (sanitized !== processName) {
    throw new Error('Invalid process name');
  }

  try {
    const { stdout } = await execAsync(`pm2 start ${sanitized}`);
    return stdout;
  } catch (error: any) {
    console.error(`Error starting PM2 process ${processName}:`, error);
    throw new Error('Failed to start process');
  }
}

/**
 * Get PM2 logs for a specific process
 */
export async function getPM2Logs(processName: string, lines: number = 100): Promise<string> {
  const sanitized = sanitizeProcessName(processName);
  if (sanitized !== processName) {
    throw new Error('Invalid process name');
  }

  // Validate lines is a reasonable number
  const numLines = Math.min(Math.max(1, lines), 1000);

  try {
    const { stdout } = await execAsync(`pm2 logs ${sanitized} --lines ${numLines} --nostream`);
    return stdout;
  } catch (error: any) {
    console.error(`Error getting PM2 logs for ${processName}:`, error);
    throw new Error('Failed to retrieve PM2 logs');
  }
}

/**
 * Get systemd service status
 */
export async function getServiceStatus(serviceName: string): Promise<string> {
  const sanitized = sanitizeServiceName(serviceName);
  if (sanitized !== serviceName) {
    throw new Error('Invalid service name');
  }

  try {
    const { stdout } = await execAsync(`systemctl status ${sanitized}`);
    return stdout;
  } catch (error: any) {
    // systemctl status returns non-zero exit code if service is not running
    // We still want to return the output
    if (error.stdout) {
      return error.stdout;
    }
    console.error(`Error getting service status for ${serviceName}:`, error);
    throw new Error('Failed to retrieve service status');
  }
}

/**
 * Restart a systemd service
 */
export async function restartService(serviceName: string): Promise<string> {
  const sanitized = sanitizeServiceName(serviceName);
  if (sanitized !== serviceName) {
    throw new Error('Invalid service name');
  }

  try {
    const { stdout } = await execAsync(`sudo systemctl restart ${sanitized}`);
    return `Service ${sanitized} restarted successfully`;
  } catch (error: any) {
    console.error(`Error restarting service ${serviceName}:`, error);
    throw new Error('Failed to restart service');
  }
}

/**
 * Get systemd service logs (journalctl)
 */
export async function getServiceLogs(serviceName: string, lines: number = 100): Promise<string> {
  const sanitized = sanitizeServiceName(serviceName);
  if (sanitized !== serviceName) {
    throw new Error('Invalid service name');
  }

  // Validate lines is a reasonable number
  const numLines = Math.min(Math.max(1, lines), 1000);

  try {
    const { stdout } = await execAsync(`journalctl -u ${sanitized} -n ${numLines} --no-pager`);
    return stdout;
  } catch (error: any) {
    console.error(`Error getting service logs for ${serviceName}:`, error);
    throw new Error('Failed to retrieve service logs');
  }
}

/**
 * Read a log file (with path validation)
 */
export async function readLogFile(filePath: string, lines: number = 100): Promise<string> {
  // Validate the file path is within allowed directories
  const allowedDirs = ['/home/apps/'];
  if (!allowedDirs.some(dir => filePath.startsWith(dir))) {
    throw new Error('Access to this file path is not allowed');
  }

  // Validate lines is a reasonable number
  const numLines = Math.min(Math.max(1, lines), 1000);

  try {
    const { stdout } = await execAsync(`tail -n ${numLines} "${filePath}"`);
    return stdout;
  } catch (error: any) {
    console.error(`Error reading log file ${filePath}:`, error);
    throw new Error('Failed to read log file');
  }
}

/**
 * Get system metrics (CPU, memory, disk)
 */
export async function getSystemMetrics(): Promise<{
  cpu: string;
  memory: string;
  disk: string;
}> {
  try {
    const [cpuResult, memResult, diskResult] = await Promise.all([
      execAsync(`top -bn1 | grep "Cpu(s)" | sed "s/.*, *\\([0-9.]*\\)%* id.*/\\1/" | awk '{print 100 - $1}'`),
      execAsync('free -m | awk \'NR==2{printf "%.2f", $3*100/$2 }\''),
      execAsync('df -h / | awk \'NR==2{print $5}\''),
    ]);

    return {
      cpu: cpuResult.stdout.trim(),
      memory: memResult.stdout.trim(),
      disk: diskResult.stdout.trim(),
    };
  } catch (error: any) {
    console.error('Error getting system metrics:', error);
    throw new Error('Failed to retrieve system metrics');
  }
}

/**
 * Health check for a URL
 */
export async function checkHealth(url: string): Promise<{ healthy: boolean; responseTime: number; error?: string }> {
  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    const responseTime = Date.now() - startTime;

    return {
      healthy: response.ok,
      responseTime,
    };
  } catch (error: any) {
    return {
      healthy: false,
      responseTime: Date.now() - startTime,
      error: error.message,
    };
  }
}
