/**
 * GET /api/projects/[id]/metrics
 * Get system metrics (CPU, memory, disk) for monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth-middleware';
import { getProjectById } from '@/config/projects';
import { getSystemMetrics } from '@/lib/system-commands';

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
      const metrics = await getSystemMetrics();

      return NextResponse.json({
        success: true,
        metrics: {
          cpu: parseFloat(metrics.cpu),
          memory: parseFloat(metrics.memory),
          disk: metrics.disk,
        },
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
