/**
 * Log Parser Utilities
 * Parses and filters log files for the monitoring dashboard
 */

import { readFile } from 'fs/promises';

/**
 * Read a log file and return the last N lines
 */
export async function getLogTail(filePath: string, lines: number = 100): Promise<string> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const allLines = content.split('\n');
    const lastLines = allLines.slice(Math.max(0, allLines.length - lines));
    return lastLines.join('\n');
  } catch (error) {
    throw new Error(`Failed to read log file: ${error}`);
  }
}

/**
 * Parse webhook logs and extract the last N entries
 */
export async function parseWebhookLogs(filePath: string, limit: number = 10) {
  try {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());

    const webhookEntries: WebhookLogEntry[] = [];

    // Parse each line - webhook logs typically have timestamps and status info
    for (const line of lines) {
      const entry = parseWebhookLine(line);
      if (entry) {
        webhookEntries.push(entry);
      }
    }

    // Return the last N entries (most recent first)
    return webhookEntries.slice(-limit).reverse();
  } catch (error) {
    throw new Error(`Failed to parse webhook logs: ${error}`);
  }
}

/**
 * Parse a single webhook log line
 * Expected format: [timestamp] event info status
 */
function parseWebhookLine(line: string): WebhookLogEntry | null {
  try {
    // Look for timestamp pattern: [YYYY-MM-DD HH:MM:SS]
    const timestampMatch = line.match(/\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)\]/);

    if (!timestampMatch) {
      return null;
    }

    const timestamp = timestampMatch[1];
    const restOfLine = line.substring(timestampMatch[0].length).trim();

    // Try to extract status (success, error, failed, completed, etc.)
    let status: 'success' | 'error' | 'pending' = 'pending';
    if (restOfLine.toLowerCase().includes('error') || restOfLine.toLowerCase().includes('failed')) {
      status = 'error';
    } else if (
      restOfLine.toLowerCase().includes('success') ||
      restOfLine.toLowerCase().includes('completed') ||
      restOfLine.toLowerCase().includes('triggered') ||
      restOfLine.toLowerCase().includes('received')
    ) {
      status = 'success';
    }

    return {
      timestamp: new Date(timestamp).toISOString(),
      message: restOfLine,
      status,
    };
  } catch (error) {
    // Skip lines that can't be parsed
    return null;
  }
}

/**
 * Check webhook service status
 */
export async function getWebhookStatus(filePath: string): Promise<{
  isOnline: boolean;
  lastActivity: string | null;
  recentCalls: WebhookLogEntry[];
}> {
  try {
    const recentCalls = await parseWebhookLogs(filePath, 2);
    const lastCall = recentCalls[0];

    // Determine if online based on recent activity (within last 10 minutes)
    let isOnline = false;
    let lastActivity = null;

    if (lastCall) {
      const lastCallTime = new Date(lastCall.timestamp).getTime();
      const now = Date.now();
      const tenMinutesMs = 10 * 60 * 1000;

      isOnline = now - lastCallTime < tenMinutesMs;
      lastActivity = lastCall.timestamp;
    }

    return {
      isOnline,
      lastActivity,
      recentCalls,
    };
  } catch (error) {
    return {
      isOnline: false,
      lastActivity: null,
      recentCalls: [],
    };
  }
}

export interface WebhookLogEntry {
  timestamp: string;
  message: string;
  status: 'success' | 'error' | 'pending';
}
