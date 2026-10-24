import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser, logAuditEvent } from '@/lib/auth/session';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const user = await getCurrentUser();
  const db = getDb();

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId) as any;
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  // Check role: Only Owner or Manager can assign/reassign
  const membership = db
    .prepare('SELECT role FROM workspace_memberships WHERE workspace_id = ? AND user_id = ?')
    .get(project.workspace_id, user.id) as any;

  if (!membership || (membership.role !== 'OWNER' && membership.role !== 'MANAGER')) {
    return NextResponse.json(
      { error: 'Permission denied: Only Owners and Managers can assign tasks.' },
      { status: 403 }
    );
  }

  const body = await req.json();
  const taskIds: string[] = body.taskIds || [];
  const assigneeId: string | null = body.assigneeId || null; // null to unassign

  if (taskIds.length === 0) {
    return NextResponse.json({ error: 'No task IDs provided' }, { status: 400 });
  }

  const now = new Date().toISOString();

  try {
    db.exec('BEGIN TRANSACTION;');

    const updateTask = db.prepare(`
      UPDATE annotation_tasks
      SET assigned_to = ?,
          status = CASE WHEN status = 'UNASSIGNED' AND ? IS NOT NULL THEN 'ASSIGNED'
                        WHEN ? IS NULL AND status = 'ASSIGNED' THEN 'UNASSIGNED'
                        ELSE status END,
          updated_at = ?
      WHERE id = ? AND project_id = ?
    `);

    const insertAssign = db.prepare(`
      INSERT INTO task_assignments (id, task_id, user_id, status, assigned_at)
      VALUES (?, ?, ?, 'ACTIVE', ?)
    `);

    taskIds.forEach((taskId) => {
      updateTask.run(assigneeId, assigneeId, assigneeId, now, taskId, projectId);
      if (assigneeId) {
        insertAssign.run(`asg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, taskId, assigneeId, now);
      }
    });

    db.exec('COMMIT;');

    logAuditEvent({
      workspaceId: project.workspace_id,
      actorId: user.id,
      action: 'TASKS_ASSIGNED',
      targetType: 'PROJECT',
      targetId: projectId,
      details: { taskCount: taskIds.length, assigneeId },
    });

    return NextResponse.json({ success: true, updatedCount: taskIds.length });
  } catch (err: any) {
    db.exec('ROLLBACK;');
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
