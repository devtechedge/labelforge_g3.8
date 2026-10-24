import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser, logAuditEvent } from '@/lib/auth/session';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const user = await getCurrentUser();
  const db = getDb();

  const invitation = db.prepare('SELECT * FROM invitations WHERE token = ?').get(token) as any;
  if (!invitation) {
    return NextResponse.json({ error: 'Invalid or non-existent invitation token' }, { status: 404 });
  }

  if (invitation.status !== 'PENDING') {
    return NextResponse.json({ error: `Invitation is already ${invitation.status.toLowerCase()}` }, { status: 400 });
  }

  if (new Date(invitation.expires_at) < new Date()) {
    db.prepare("UPDATE invitations SET status = 'EXPIRED' WHERE id = ?").run(invitation.id);
    return NextResponse.json({ error: 'This invitation has expired' }, { status: 410 });
  }

  const now = new Date().toISOString();

  try {
    db.exec('BEGIN TRANSACTION;');

    // Update invitation status
    db.prepare("UPDATE invitations SET status = 'ACCEPTED' WHERE id = ?").run(invitation.id);

    // Upsert membership
    const membershipId = `m_${invitation.workspace_id}_${user.id}`;
    db.prepare(`
      INSERT INTO workspace_memberships (id, workspace_id, user_id, role, created_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(workspace_id, user_id) DO UPDATE SET role = excluded.role
    `).run(membershipId, invitation.workspace_id, user.id, invitation.role, now);

    db.exec('COMMIT;');

    logAuditEvent({
      workspaceId: invitation.workspace_id,
      actorId: user.id,
      action: 'INVITATION_ACCEPTED',
      targetType: 'MEMBERSHIP',
      targetId: membershipId,
      details: { role: invitation.role, email: invitation.email },
    });

    return NextResponse.json({
      success: true,
      workspaceId: invitation.workspace_id,
      role: invitation.role,
    });
  } catch (err: any) {
    db.exec('ROLLBACK;');
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
