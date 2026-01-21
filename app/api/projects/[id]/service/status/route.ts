/**
 * GET /api/projects/[id]/service/status
 * Get systemd service status for a specific project
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth-middleware';
import { getProjectById } from '@/config/projects';
import { getServiceStatus } from '@/lib/system-commands';

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

      if (!serviceName || !project.systemdServices.includes(serviceName)) {
        return NextResponse.json(
          { success: false, error: 'Invalid service name' },
          { status: 400 }
        );
      }

      const status = await getServiceStatus(serviceName);

      return NextResponse.json({
        success: true,
        status,
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
