/**
 * GET /api/projects/[id]/pm2/logs
 * Get PM2 logs for a specific project process
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth-middleware';
import { getProjectById } from '@/config/projects';
import { getPM2Logs } from '@/lib/system-commands';

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
      const processName = searchParams.get('process');
      const lines = parseInt(searchParams.get('lines') || '100', 10);

      if (!processName || !project.pm2Processes.includes(processName)) {
        return NextResponse.json(
          { success: false, error: 'Invalid process name' },
          { status: 400 }
        );
      }

      const logs = await getPM2Logs(processName, lines);

      return NextResponse.json({
        success: true,
        logs,
        processName,
      });
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
  });
}
