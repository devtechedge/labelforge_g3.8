import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser, logAuditEvent } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  const body = await req.json();

  const workspaceId = body.workspaceId;
  const name = body.name?.trim();
  const description = body.description?.trim() || '';
  const redundancyCount = Math.max(1, Math.min(5, Number(body.redundancyCount) || 1));

  if (!workspaceId || !name || name.length < 2) {
    return NextResponse.json({ error: 'Workspace ID and valid Project name are required.' }, { status: 400 });
  }

  const db = getDb();

  // Role check
  const membership = db
    .prepare('SELECT role FROM workspace_memberships WHERE workspace_id = ? AND user_id = ?')
    .get(workspaceId, user.id) as any;

  if (!membership || (membership.role !== 'OWNER' && membership.role !== 'MANAGER')) {
    return NextResponse.json(
      { error: 'Permission denied: Only Owners and Managers can create projects.' },
      { status: 403 }
    );
  }

  const id = `proj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();

  try {
    db.prepare(`
      INSERT INTO projects (id, workspace_id, name, description, status, redundancy_count, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?, ?)
    `).run(id, workspaceId, name, description, redundancyCount, now, now);

    logAuditEvent({
      workspaceId,
      actorId: user.id,
      action: 'PROJECT_CREATED',
      targetType: 'PROJECT',
      targetId: id,
      details: { name, redundancyCount },
    });

    return NextResponse.json({ success: true, projectId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
