/**
 * GET /api/projects/[id]/logs/error
 * Get error logs for a project
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth-middleware';
import { getProjectById } from '@/config/projects';
import { getLogTail } from '@/lib/log-parser';
import { join } from 'path';

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
      const lines = parseInt(searchParams.get('lines') || '100', 10);

      const errorLogPath = join(project.logPaths.pm2, 'apps-dev-error.log');
      const logs = await getLogTail(errorLogPath, lines);

      return NextResponse.json({
        success: true,
        logs,
        logFile: 'Error Log',
      });
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
  });
}
