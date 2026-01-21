/**
 * POST /api/projects/[id]/pm2/start
 * Start a PM2 process for a specific project
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, logAuditEvent } from '@/lib/auth-middleware';
import { getProjectById } from '@/config/projects';
import { startPM2Process } from '@/lib/system-commands';

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
      const { processName } = await request.json();

      if (!processName || !project.pm2Processes.includes(processName)) {
        return NextResponse.json(
          { success: false, error: 'Invalid process name' },
          { status: 400 }
        );
      }

      const result = await startPM2Process(processName);

      // Log the action
      logAuditEvent(userInfo.email, 'PM2_START', `Project: ${id}, Process: ${processName}`);

      return NextResponse.json({
        success: true,
        message: `Process ${processName} started successfully`,
        output: result,
      });
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
  });
}
