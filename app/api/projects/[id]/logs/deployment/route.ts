/**
 * GET /api/projects/[id]/logs/deployment
 * Get deployment logs for a project
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth-middleware';
import { getProjectById } from '@/config/projects';
import { getLogTail } from '@/lib/log-parser';

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

      const logs = await getLogTail(project.logPaths.deployment, lines);

      return NextResponse.json({
        success: true,
        logs,
        logFile: 'Deployment Log',
      });
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
  });
}
