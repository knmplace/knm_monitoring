/**
 * POST /api/projects/[id]/service/restart
 * Restart a systemd service for a specific project
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, logAuditEvent } from '@/lib/auth-middleware';
import { getProjectById } from '@/config/projects';
import { restartService } from '@/lib/system-commands';

export async function POST(
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

    try {
      const { serviceName } = await request.json();

      if (!serviceName || !project.systemdServices.includes(serviceName)) {
        return NextResponse.json(
          { success: false, error: 'Invalid service name' },
          { status: 400 }
        );
      }

      const result = await restartService(serviceName);

      // Log the action
      logAuditEvent(userInfo.email, 'SERVICE_RESTART', `Project: ${id}, Service: ${serviceName}`);

      return NextResponse.json({
        success: true,
        message: result,
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
