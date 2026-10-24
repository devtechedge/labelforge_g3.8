import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser, logAuditEvent } from '@/lib/auth/session';
import { resolveReviewDecision } from '@/lib/domain/concurrency';
import { ReviewDecision } from '@/lib/domain/types';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: annotationId } = await params;
  const user = await getCurrentUser();
  const db = getDb();

  const annotation = db.prepare('SELECT * FROM annotations WHERE id = ?').get(annotationId) as any;
  if (!annotation) {
    return NextResponse.json({ error: 'Annotation not found' }, { status: 404 });
  }

  const task = db
    .prepare(`
      SELECT t.*, p.workspace_id
      FROM annotation_tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.id = ?
    `)
    .get(annotation.task_id) as any;

  if (!task) {
    return NextResponse.json({ error: 'Associated task not found' }, { status: 404 });
  }

  // Role check: Reviewer or Manager or Owner
  const membership = db
    .prepare('SELECT role FROM workspace_memberships WHERE workspace_id = ? AND user_id = ?')
    .get(task.workspace_id, user.id) as any;

  if (!membership || (membership.role !== 'REVIEWER' && membership.role !== 'MANAGER' && membership.role !== 'OWNER')) {
    return NextResponse.json(
      { error: 'Permission denied: Only Reviewers and Managers can review annotations.' },
      { status: 403 }
    );
  }

  const body = await req.json();
  const decision = body.decision as ReviewDecision;
  const feedback = body.feedback?.trim() || '';

  if (!['PASS', 'RETURN_FOR_CORRECTION', 'REJECT', 'REQUEST_ADJUDICATION'].includes(decision)) {
    return NextResponse.json({ error: `Invalid review decision: ${decision}` }, { status: 400 });
  }

  const newStatus = resolveReviewDecision(decision);
  const now = new Date().toISOString();
  const reviewId = `rev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  try {
    db.exec('BEGIN TRANSACTION;');

    // Insert review
    db.prepare(`
      INSERT INTO reviews (id, annotation_id, task_id, reviewer_id, decision, feedback, observed_revision, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(reviewId, annotationId, task.id, user.id, decision, feedback, annotation.revision, now);

    // If returned for correction, reset is_draft to 1 so annotator can edit
    if (decision === 'RETURN_FOR_CORRECTION') {
      db.prepare('UPDATE annotations SET is_draft = 1, updated_at = ? WHERE id = ?').run(now, annotationId);
    }

    // Update task status and revision
    db.prepare(`
      UPDATE annotation_tasks
      SET status = ?, revision = revision + 1, updated_at = ?
      WHERE id = ?
    `).run(newStatus, now, task.id);

    db.exec('COMMIT;');

    logAuditEvent({
      workspaceId: task.workspace_id,
      actorId: user.id,
      action: 'REVIEW_DECISION',
      targetType: 'TASK',
      targetId: task.id,
      details: { decision, feedback, newStatus, observedRevision: annotation.revision },
    });

    return NextResponse.json({
      success: true,
      reviewId,
      newStatus,
      reviewedAt: now,
    });
  } catch (err: any) {
    db.exec('ROLLBACK;');
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
