import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { checkOptimisticRevision } from '@/lib/domain/concurrency';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: taskId } = await params;
  const user = await getCurrentUser();
  const db = getDb();

  const task = db.prepare('SELECT * FROM annotation_tasks WHERE id = ?').get(taskId) as any;
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const body = await req.json();
  const answers = body.answers || {};
  const expectedRevision = Number(body.expectedRevision) || 1;

  // Find existing annotation for this user
  const existing = db
    .prepare('SELECT * FROM annotations WHERE task_id = ? AND annotator_id = ?')
    .get(taskId, user.id) as any;

  if (existing) {
    // Check optimistic concurrency revision
    const check = checkOptimisticRevision(existing.revision, expectedRevision);
    if (check.conflict) {
      return NextResponse.json(
        {
          code: 'REVISION_CONFLICT',
          message: check.message,
          currentRevision: existing.revision,
          storedAnswers: JSON.parse(existing.answers_json),
          updatedAt: existing.updated_at,
        },
        { status: 409 }
      );
    }
  }

  const now = new Date().toISOString();
  const nextRevision = (existing?.revision || 0) + 1;
  const annotationId = existing?.id || `ann_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  try {
    db.exec('BEGIN TRANSACTION;');

    if (existing) {
      db.prepare(`
        UPDATE annotations
        SET answers_json = ?, revision = ?, is_draft = 1, updated_at = ?
        WHERE id = ?
      `).run(JSON.stringify(answers), nextRevision, now, existing.id);
    } else {
      db.prepare(`
        INSERT INTO annotations (id, task_id, annotator_id, schema_version_id, answers_json, revision, is_draft, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
      `).run(annotationId, taskId, user.id, task.schema_version_id, JSON.stringify(answers), nextRevision, now, now);
    }

    // Advance task state to IN_PROGRESS if ASSIGNED or RETURNED_FOR_CORRECTION
    if (task.status === 'ASSIGNED' || task.status === 'RETURNED_FOR_CORRECTION') {
      db.prepare(`
        UPDATE annotation_tasks
        SET status = 'IN_PROGRESS', revision = revision + 1, updated_at = ?
        WHERE id = ?
      `).run(now, taskId);
    }

    db.exec('COMMIT;');

    return NextResponse.json({
      success: true,
      revision: nextRevision,
      savedAt: now,
    });
  } catch (err: any) {
    db.exec('ROLLBACK;');
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
