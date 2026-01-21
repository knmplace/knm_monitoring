/**
 * GET /api/system/overview
 * Get an overview of all projects and their status
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth-middleware';
import { projects } from '@/config/projects';
import { getPM2List, getSystemMetrics } from '@/lib/system-commands';

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      // Get all PM2 processes
      const allProcesses = await getPM2List();

      // Get system metrics
      const metrics = await getSystemMetrics();

      // Build overview for each project
      const projectOverviews = projects.map(project => {
        const projectProcesses = allProcesses.filter(p =>
          project.pm2Processes.includes(p.name)
        );

        // Count online/stopped processes
        const onlineCount = projectProcesses.filter(p => p.pm2_env?.status === 'online').length;
        const totalCount = projectProcesses.length;

        return {
          id: project.id,
          name: project.name,
          description: project.description,
          status: onlineCount === totalCount && totalCount > 0 ? 'online' : 'partial',
          processes: {
            online: onlineCount,
            total: totalCount,
          },
          services: project.systemdServices.length,
        };
      });

      return NextResponse.json({
        success: true,
        overview: {
          projects: projectOverviews,
          systemMetrics: {
            cpu: parseFloat(metrics.cpu),
            memory: parseFloat(metrics.memory),
            disk: metrics.disk,
          },
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
  });
}
