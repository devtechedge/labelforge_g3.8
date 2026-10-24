import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const workspaceId = url.searchParams.get('workspaceId') || 'ws_core';
  const user = await getCurrentUser();
  const db = getDb();

  const events = db
    .prepare(`
      SELECT a.*, u.name as actor_name, u.avatar as actor_avatar, u.email as actor_email
      FROM audit_events a
      LEFT JOIN users u ON a.actor_id = u.id
      WHERE a.workspace_id = ?
      ORDER BY a.created_at DESC
      LIMIT 100
    `)
    .all(workspaceId) as any[];

  return NextResponse.json({
    events: events.map((e) => ({
      ...e,
      details: e.details_json ? JSON.parse(e.details_json) : null,
    })),
  });
}
