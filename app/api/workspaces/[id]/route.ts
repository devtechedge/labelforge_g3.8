import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  const db = getDb();

  const workspace = db.prepare('SELECT * FROM workspaces WHERE id = ?').get(id) as any;
  if (!workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  // Authorization check
  const membership = db
    .prepare('SELECT role FROM workspace_memberships WHERE workspace_id = ? AND user_id = ?')
    .get(id, user.id) as any;

  if (!membership) {
    return NextResponse.json({ error: 'Access denied: not a workspace member' }, { status: 403 });
  }

  // Projects
  const projects = db
    .prepare(`
      SELECT p.*,
        (SELECT COUNT(*) FROM annotation_tasks t WHERE t.project_id = p.id) as total_tasks,
        (SELECT COUNT(*) FROM annotation_tasks t WHERE t.project_id = p.id AND t.status = 'ACCEPTED') as completed_tasks,
        (SELECT COUNT(*) FROM annotation_tasks t WHERE t.project_id = p.id AND t.status = 'DISPUTED') as disputed_tasks
      FROM projects p
      WHERE p.workspace_id = ?
      ORDER BY p.created_at DESC
    `)
    .all(id);

  // Members
  const members = db
    .prepare(`
      SELECT m.id, m.role, m.created_at, u.id as user_id, u.name, u.email, u.avatar, u.title
      FROM workspace_memberships m
      JOIN users u ON m.user_id = u.id
      WHERE m.workspace_id = ?
      ORDER BY m.created_at ASC
    `)
    .all(id);

  // Overall task stats
  const stats = db
    .prepare(`
      SELECT
        COUNT(*) as total_tasks,
        SUM(CASE WHEN t.status = 'UNASSIGNED' THEN 1 ELSE 0 END) as unassigned,
        SUM(CASE WHEN t.status IN ('ASSIGNED', 'IN_PROGRESS') THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN t.status IN ('SUBMITTED', 'IN_REVIEW') THEN 1 ELSE 0 END) as in_review,
        SUM(CASE WHEN t.status = 'DISPUTED' THEN 1 ELSE 0 END) as disputed,
        SUM(CASE WHEN t.status = 'RETURNED_FOR_CORRECTION' THEN 1 ELSE 0 END) as returned,
        SUM(CASE WHEN t.status = 'ACCEPTED' THEN 1 ELSE 0 END) as accepted
      FROM annotation_tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE p.workspace_id = ?
    `)
    .get(id) as any;

  return NextResponse.json({
    workspace,
    userRole: membership.role,
    projects,
    members,
    stats: {
      total: stats?.total_tasks || 0,
      unassigned: stats?.unassigned || 0,
      inProgress: stats?.in_progress || 0,
      inReview: stats?.in_review || 0,
      disputed: stats?.disputed || 0,
      returned: stats?.returned || 0,
      accepted: stats?.accepted || 0,
    },
  });
}
