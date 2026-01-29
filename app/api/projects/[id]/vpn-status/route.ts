/**
 * GET /api/projects/[id]/vpn-status
 * Get VPN connection status and details for Docker-based projects with Gluetun
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth-middleware';
import { getProjectById } from '@/config/projects';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (userInfo) => {
    const { id } = await params;
    const project = getProjectById(id);

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Only works for remote Docker projects
    if (!project.isRemote) {
      return NextResponse.json(
        { success: false, error: 'VPN status only available for remote projects' },
        { status: 400 }
      );
    }

    try {
      // Determine project directory and SSH details
      const projectDir = `/home/apps/${id}`;
      const envFile = `${projectDir}/.env.deployment`;

      // Read deployment config to get SSH details
      const { stdout: envContent } = await execAsync(`cat ${envFile}`);
      const config: any = {};
      envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          config[match[1]] = match[2];
        }
      });

      const sshKey = config.SSH_KEY;
      const remoteUser = config.REMOTE_USER;
      const remoteHost = config.REMOTE_HOST;
      const remotePath = config.REMOTE_PATH;

      // Get Gluetun logs via SSH
      const { stdout, stderr } = await execAsync(
        `ssh -i ${sshKey} ${remoteUser}@${remoteHost} "cd ${remotePath} && docker compose logs gluetun | tail -100"`,
        { timeout: 10000 }
      );

      // Parse VPN status from logs
      const vpnStatus = parseVPNStatus(stdout);

      return NextResponse.json({
        success: true,
        vpn: vpnStatus,
      });
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          vpn: {
            connected: false,
            healthy: false,
          },
        },
        { status: 500 }
      );
    }
  });
}

function parseVPNStatus(logs: string): any {
  const status: any = {
    connected: false,
    healthy: false,
    publicIP: null,
    location: null,
    country: null,
    city: null,
    provider: null,
    server: null,
  };

  // Parse Public IP and location
  const ipMatch = logs.match(/Public IP address is ([\d.]+) \(([^)]+)\)/);
  if (ipMatch) {
    status.publicIP = ipMatch[1];
    const locationParts = ipMatch[2].split(', ');
    if (locationParts.length >= 3) {
      status.country = locationParts[0];
      status.city = locationParts[2];
      status.location = `${locationParts[2]}, ${locationParts[0]}`;
    } else {
      status.location = ipMatch[2];
    }
  }

  // Check if connected
  if (logs.includes('Initialization Sequence Completed')) {
    status.connected = true;
  }

  // Check health
  if (logs.includes('healthy!')) {
    status.healthy = true;
  }

  // Parse VPN provider
  const providerMatch = logs.match(/VPN_SERVICE_PROVIDER[=:]\s*([^\s\n]+)/i);
  if (providerMatch) {
    status.provider = providerMatch[1].replace(/['"]/g, '');
  }

  // Parse server
  const serverMatch = logs.match(/\[([^\]]+)\] Peer Connection Initiated/);
  if (serverMatch) {
    status.server = serverMatch[1];
  }

  return status;
}
