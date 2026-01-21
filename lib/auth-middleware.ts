/**
 * Authentication Middleware
 *
 * Middleware functions to protect API routes and verify admin access.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken, getUserRole } from './firebase-admin';
import { appendFileSync } from 'fs';
import { join } from 'path';

/**
 * Extract Firebase ID token from Authorization header
 */
function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

/**
 * Audit log for tracking administrative actions
 */
export function logAuditEvent(userEmail: string, action: string, details: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${userEmail}] ${action} - ${details}\n`;
  const logPath = join(process.cwd(), 'logs', 'audit.log');

  try {
    appendFileSync(logPath, logMessage);
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}

/**
 * Verify authentication and admin role
 * Returns user info if authorized, or an error response
 */
export async function verifyAdminAuth(request: NextRequest): Promise<
  | { authorized: true; uid: string; email: string; role: string }
  | { authorized: false; response: NextResponse }
> {
  // Extract token
  const token = getTokenFromRequest(request);
  if (!token) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Unauthorized', message: 'Missing or invalid authorization token' },
        { status: 401 }
      ),
    };
  }

  try {
    // Verify token
    const decodedToken = await verifyIdToken(token);
    const { uid, email } = decodedToken;

    if (!email) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: 'Unauthorized', message: 'Invalid user' },
          { status: 401 }
        ),
      };
    }

    // Check if user has admin role
    const role = await getUserRole(uid);
    if (role !== 'admin') {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: 'Forbidden', message: 'Admin access required' },
          { status: 403 }
        ),
      };
    }

    return {
      authorized: true,
      uid,
      email,
      role,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or expired token' },
        { status: 401 }
      ),
    };
  }
}

/**
 * Wrapper function for protected API routes
 * Usage: export async function GET(request: NextRequest) {
 *   return withAdminAuth(request, async (userInfo) => {
 *     // Your protected route logic here
 *     return NextResponse.json({ data: 'protected data' });
 *   });
 * }
 */
export async function withAdminAuth(
  request: NextRequest,
  handler: (userInfo: { uid: string; email: string; role: string }) => Promise<NextResponse>
): Promise<NextResponse> {
  const authResult = await verifyAdminAuth(request);

  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    return await handler(authResult);
  } catch (error) {
    console.error('Handler error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
