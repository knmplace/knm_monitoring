/**
 * GET /api/projects/[id]/service/logs
 * Get systemd service logs (journalctl) for a specific project
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth-middleware';
import { getProjectById } from '@/config/projects';
import { getServiceLogs } from '@/lib/system-commands';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async () => {
    const { id } = await params;
    const project = getProjectById(id);

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    try {
      const { searchParams } = new URL(request.url);
      const serviceName = searchParams.get('service');
      const lines = parseInt(searchParams.get('lines') || '100', 10);

      if (!serviceName || !project.systemdServices.includes(serviceName)) {
        return NextResponse.json(
          { success: false, error: 'Invalid service name' },
          { status: 400 }
        );
      }

      const logs = await getServiceLogs(serviceName, lines);

      return NextResponse.json({
        success: true,
        logs,
        serviceName,
      });
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
  });
}
