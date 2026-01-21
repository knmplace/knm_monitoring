/**
 * GET /api/projects
 * List all configured projects
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth-middleware';
import { projects } from '@/config/projects';

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    return NextResponse.json({
      success: true,
      projects,
    });
  });
}
