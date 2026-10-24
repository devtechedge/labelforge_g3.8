import { cookies } from 'next/headers';
import { getDb } from '@/lib/db';
import { User, WorkspaceRole } from '@/lib/domain/types';
import { DEMO_USERS } from './constants';

export { DEMO_USERS };

export async function getCurrentUser(): Promise<User & { roles: WorkspaceRole[] }> {
  const cookieStore = await cookies();
  const userId = cookieStore.get('lf_user_id')?.value || 'u_elena';

  const db = getDb();
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;

  if (!row) {
    // fallback to Elena
    return {
      id: 'u_elena',
      email: 'elena@labelforge.io',
      name: 'Elena Vance',
      avatar: 'EV',
      title: 'Lead ML Ops Architect',
      disabled: false,
      createdAt: new Date().toISOString(),
      roles: ['OWNER', 'MANAGER'],
    };
  }

  // Get user's role in the active workspace
  const membership = db
    .prepare('SELECT role FROM workspace_memberships WHERE user_id = ? AND workspace_id = ?')
    .get(row.id, 'ws_core') as { role: WorkspaceRole } | undefined;

  const roles: WorkspaceRole[] = membership ? [membership.role] : ['ANNOTATOR'];
  if (membership?.role === 'OWNER') {
    roles.push('MANAGER');
  }

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatar: row.avatar,
    title: row.title,
    disabled: Boolean(row.disabled),
    createdAt: row.created_at,
    roles,
  };
}

export function logAuditEvent(params: {
  workspaceId: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: Record<string, any>;
}) {
  const db = getDb();
  const id = `aud_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  db.prepare(`
    INSERT INTO audit_events (id, workspace_id, actor_id, action, target_type, target_id, details_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    params.workspaceId,
    params.actorId,
    params.action,
    params.targetType,
    params.targetId,
    params.details ? JSON.stringify(params.details) : null,
    new Date().toISOString()
  );
}
