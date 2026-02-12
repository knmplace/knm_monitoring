/**
 * GET /api/projects/[id]/users - List all users for a project
 * POST /api/projects/[id]/users - Create a new user for a project
 * DELETE /api/projects/[id]/users - Delete a user by session ID
 *
 * Currently supports: wordsearch (SQLite database)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, logAuditEvent } from '@/lib/auth-middleware';
import { getProjectById } from '@/config/projects';
import Database from 'better-sqlite3';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

const WORDSEARCH_DB_PATH = '/home/apps/wordsearch/data/wordsearch.db';

function getWordsearchDb() {
  return new Database(WORDSEARCH_DB_PATH, { readonly: false });
}

function generatePlayerCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// GET - List all users
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async () => {
    const { id } = await params;
    const project = getProjectById(id);

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    if (id !== 'wordsearch') {
      return NextResponse.json({ success: false, error: 'User management not available for this project' }, { status: 400 });
    }

    try {
      const db = getWordsearchDb();
      const users = db.prepare(`
        SELECT
          s.id,
          s.nickname,
          s.player_code,
          s.has_seen_prompt,
          s.created_at,
          s.last_active,
          s.total_score,
          s.puzzles_completed,
          s.current_streak,
          s.best_streak,
          (SELECT COUNT(*) FROM puzzle_progress WHERE session_id = s.id AND completed = 1) as completed_count,
          (SELECT COUNT(*) FROM leaderboard WHERE session_id = s.id) as leaderboard_entries
        FROM sessions s
        ORDER BY s.last_active DESC
      `).all();
      db.close();

      return NextResponse.json({ success: true, users });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  });
}

// POST - Create a new user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (userInfo) => {
    const { id } = await params;
    const project = getProjectById(id);

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    if (id !== 'wordsearch') {
      return NextResponse.json({ success: false, error: 'User management not available for this project' }, { status: 400 });
    }

    try {
      const { nickname } = await request.json();
      if (!nickname || typeof nickname !== 'string' || nickname.trim().length === 0) {
        return NextResponse.json({ success: false, error: 'Nickname is required' }, { status: 400 });
      }

      const db = getWordsearchDb();
      const sessionId = uuidv4();
      let playerCode = generatePlayerCode();
      let attempts = 0;

      while (attempts < 10) {
        try {
          db.prepare(
            'INSERT INTO sessions (id, nickname, player_code, has_seen_prompt) VALUES (?, ?, ?, 1)'
          ).run(sessionId, nickname.trim(), playerCode);
          break;
        } catch {
          playerCode = generatePlayerCode();
          attempts++;
        }
      }

      const user = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
      db.close();

      logAuditEvent(userInfo.email, 'WORDSEARCH_USER_CREATE', `Created user: ${nickname.trim()} (${sessionId})`);

      return NextResponse.json({ success: true, user });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  });
}

// DELETE - Delete a user by session ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (userInfo) => {
    const { id } = await params;
    const project = getProjectById(id);

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    if (id !== 'wordsearch') {
      return NextResponse.json({ success: false, error: 'User management not available for this project' }, { status: 400 });
    }

    try {
      const { sessionId } = await request.json();
      if (!sessionId || typeof sessionId !== 'string') {
        return NextResponse.json({ success: false, error: 'Session ID is required' }, { status: 400 });
      }

      const db = getWordsearchDb();

      // Get user info before deleting for audit log
      const user = db.prepare('SELECT nickname FROM sessions WHERE id = ?').get(sessionId) as { nickname: string } | undefined;
      if (!user) {
        db.close();
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }

      // Delete in order: leaderboard → progress → session
      db.prepare('DELETE FROM leaderboard WHERE session_id = ?').run(sessionId);
      db.prepare('DELETE FROM puzzle_progress WHERE session_id = ?').run(sessionId);
      db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
      db.close();

      logAuditEvent(userInfo.email, 'WORDSEARCH_USER_DELETE', `Deleted user: ${user.nickname} (${sessionId})`);

      return NextResponse.json({ success: true, message: `User ${user.nickname} deleted` });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  });
}
