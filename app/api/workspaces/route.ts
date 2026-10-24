import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser, logAuditEvent } from '@/lib/auth/session';

export async function GET() {
  const user = await getCurrentUser();
  const db = getDb();

  const workspaces = db
    .prepare(`
      SELECT w.*, m.role as user_role
      FROM workspaces w
      JOIN workspace_memberships m ON w.id = m.workspace_id
      WHERE m.user_id = ?
      ORDER BY w.created_at DESC
    `)
    .all(user.id) as any[];

  // Pending invitations for user
  const invitations = db
    .prepare('SELECT * FROM invitations WHERE email = ? AND status = ?')
    .all(user.email, 'PENDING');

  return NextResponse.json({ workspaces, invitations });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  const body = await req.json();

  const name = body.name?.trim();
  if (!name || name.length < 2) {
    return NextResponse.json({ error: 'Workspace name must be at least 2 characters.' }, { status: 400 });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const id = `ws_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();

  const db = getDb();
  try {
    db.prepare('INSERT INTO workspaces (id, name, slug, owner_id, created_at) VALUES (?, ?, ?, ?, ?)').run(
      id,
      name,
      slug,
      user.id,
      now
    );

    db.prepare(
      'INSERT INTO workspace_memberships (id, workspace_id, user_id, role, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(`m_${id}_${user.id}`, id, user.id, 'OWNER', now);

    logAuditEvent({
      workspaceId: id,
      actorId: user.id,
      action: 'WORKSPACE_CREATED',
      targetType: 'WORKSPACE',
      targetId: id,
      details: { name, slug },
    });

    return NextResponse.json({ success: true, workspaceId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
