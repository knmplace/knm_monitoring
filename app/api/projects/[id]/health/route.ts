/**
 * GET /api/projects/[id]/health
 * Check health status of a project's health endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth-middleware';
import { getProjectById } from '@/config/projects';
import { checkHealth } from '@/lib/system-commands';

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

    if (!project.healthCheckUrl) {
      return NextResponse.json(
        { success: false, error: 'No health check URL configured for this project' },
        { status: 400 }
      );
    }

    try {
      const health = await checkHealth(project.healthCheckUrl);

      return NextResponse.json({
        success: true,
        health,
        url: project.healthCheckUrl,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
  });
}
