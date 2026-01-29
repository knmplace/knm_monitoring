/**
 * POST /api/projects/[id]/deploy
 * Trigger deployment script for a specific project
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, logAuditEvent } from '@/lib/auth-middleware';
import { getProjectById } from '@/config/projects';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

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
      // Determine project directory based on project ID
      const projectDir = path.join('/home/apps', id);
      const deployScript = path.join(projectDir, 'deploy.sh');

      // Check if deploy script exists
      const { exec: syncExec } = require('child_process');
      const fs = require('fs');

      if (!fs.existsSync(deployScript)) {
        return NextResponse.json(
          { success: false, error: 'Deploy script not found' },
          { status: 404 }
        );
      }

      // Log the action before deployment
      logAuditEvent(userInfo.email, 'DEPLOY', `Project: ${id} - Deployment initiated`);

      // Execute deploy script
      const { stdout, stderr } = await execAsync(
        `cd ${projectDir} && bash deploy.sh`,
        {
          timeout: 300000, // 5 minute timeout
          maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        }
      );

      // Log success
      logAuditEvent(userInfo.email, 'DEPLOY_SUCCESS', `Project: ${id}`);

      return NextResponse.json({
        success: true,
        message: `Deployment for ${project.name} completed successfully`,
        output: stdout,
        errors: stderr || null,
      });
    } catch (error: any) {
      // Log failure
      logAuditEvent(userInfo.email, 'DEPLOY_FAILED', `Project: ${id} - ${error.message}`);

      return NextResponse.json(
        {
          success: false,
          error: error.message,
          output: error.stdout || null,
          errors: error.stderr || null,
        },
        { status: 500 }
      );
    }
  });
}
