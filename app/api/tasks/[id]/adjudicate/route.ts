import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser, logAuditEvent } from '@/lib/auth/session';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: taskId } = await params;
  const user = await getCurrentUser();
  const db = getDb();

  const task = db
    .prepare(`
      SELECT t.*, p.workspace_id
      FROM annotation_tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.id = ?
    `)
    .get(taskId) as any;

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  // Role check: Reviewer or Manager or Owner
  const membership = db
    .prepare('SELECT role FROM workspace_memberships WHERE workspace_id = ? AND user_id = ?')
    .get(task.workspace_id, user.id) as any;

  if (!membership || (membership.role !== 'REVIEWER' && membership.role !== 'MANAGER' && membership.role !== 'OWNER')) {
    return NextResponse.json(
      { error: 'Permission denied: Only Reviewers and Managers can adjudicate disputed tasks.' },
      { status: 403 }
    );
  }

  const body = await req.json();
  const chosenAnswer = body.chosenAnswer || {};
  const rationale = body.rationale?.trim();

  if (!rationale) {
    return NextResponse.json({ error: 'Adjudication rationale is required for auditable resolution.' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const adjudicationId = `adj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  try {
    db.exec('BEGIN TRANSACTION;');

    db.prepare(`
      INSERT INTO adjudications (id, task_id, adjudicator_id, chosen_answer_json, rationale, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(adjudicationId, taskId, user.id, JSON.stringify(chosenAnswer), rationale, now);

    // Transition task to ACCEPTED
    db.prepare(`
      UPDATE annotation_tasks
      SET status = 'ACCEPTED', revision = revision + 1, updated_at = ?
      WHERE id = ?
    `).run(now, taskId);

    db.exec('COMMIT;');

    logAuditEvent({
      workspaceId: task.workspace_id,
      actorId: user.id,
      action: 'TASK_ADJUDICATED',
      targetType: 'TASK',
      targetId: taskId,
      details: { rationale, adjudicator: user.name },
    });

    return NextResponse.json({
      success: true,
      adjudicationId,
      status: 'ACCEPTED',
      resolvedAt: now,
    });
  } catch (err: any) {
    db.exec('ROLLBACK;');
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
