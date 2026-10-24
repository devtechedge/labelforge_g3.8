import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser, logAuditEvent } from '@/lib/auth/session';
import { createHash } from 'node:crypto';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: workspaceId } = await params;
  const user = await getCurrentUser();
  const db = getDb();

  // Role check: Owner or Manager
  const membership = db
    .prepare('SELECT role FROM workspace_memberships WHERE workspace_id = ? AND user_id = ?')
    .get(workspaceId, user.id) as any;

  if (!membership || (membership.role !== 'OWNER' && membership.role !== 'MANAGER')) {
    return NextResponse.json({ error: 'Permission denied: Only Owners and Managers can invite members.' }, { status: 403 });
  }

  const body = await req.json();
  const email = body.email?.trim().toLowerCase();
  const role = body.role || 'ANNOTATOR';

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }

  const token = createHash('sha256').update(`${email}-${Date.now()}-${Math.random()}`).digest('hex');
  const id = `inv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  try {
    db.prepare(`
      INSERT INTO invitations (id, workspace_id, email, role, token, expires_at, created_by, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)
    `).run(id, workspaceId, email, role, token, expiresAt, user.id, now);

    logAuditEvent({
      workspaceId,
      actorId: user.id,
      action: 'MEMBER_INVITED',
      targetType: 'INVITATION',
      targetId: id,
      details: { email, role, token: token.slice(0, 8) + '...' },
    });

    return NextResponse.json({
      success: true,
      invitationId: id,
      token,
      inviteUrl: `/invite/${token}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: workspaceId } = await params;
  const db = getDb();

  const invitations = db
    .prepare('SELECT * FROM invitations WHERE workspace_id = ? ORDER BY created_at DESC')
    .all(workspaceId);

  return NextResponse.json({ invitations });
}
